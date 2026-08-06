const { supabase } = require('../db/supabase');

const TICKET_SELECT = 'id, user_id, name, email, subject, status, created_at, updated_at';
const MESSAGE_SELECT = 'id, ticket_id, author_name, from_staff, text, created_at';

async function loadMessages(ticketId) {
  const { data, error } = await supabase
    .from('support_messages')
    .select(MESSAGE_SELECT)
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

// POST /api/support — создание обращения. Гостям нужно указать имя и почту,
// авторизованным они подставляются из аккаунта.
async function createTicket(req, res, next) {
  try {
    const { subject, text } = req.body;

    const name = req.user ? req.user.username : String(req.body.name || '').trim();
    const email = req.user ? req.user.email : String(req.body.email || '').trim().toLowerCase();

    if (!name || !email) {
      return res.status(400).json({ message: 'Укажите имя и адрес почты для ответа' });
    }

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: req.user?.id || null,
        name,
        email,
        subject: String(subject).trim(),
      })
      .select(TICKET_SELECT)
      .single();

    if (error) throw error;

    const { error: messageError } = await supabase.from('support_messages').insert({
      ticket_id: ticket.id,
      author_id: req.user?.id || null,
      author_name: name,
      from_staff: false,
      text: String(text).trim(),
    });

    if (messageError) throw messageError;

    res.status(201).json({ item: { ...ticket, messages: await loadMessages(ticket.id) } });
  } catch (err) {
    next(err);
  }
}

// GET /api/support/mine — обращения текущего пользователя вместе с перепиской.
async function myTickets(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .select(TICKET_SELECT)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const tickets = await Promise.all(
      (data || []).map(async (ticket) => ({ ...ticket, messages: await loadMessages(ticket.id) }))
    );

    res.json({ items: tickets });
  } catch (err) {
    next(err);
  }
}

// POST /api/support/:id/messages — ответ пользователя в своём обращении.
async function replyToTicket(req, res, next) {
  try {
    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .select('id, user_id, status')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!ticket || ticket.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Обращение не найдено' });
    }
    if (ticket.status === 'closed') {
      return res.status(400).json({ message: 'Обращение закрыто. Создайте новое.' });
    }

    const { error: messageError } = await supabase.from('support_messages').insert({
      ticket_id: ticket.id,
      author_id: req.user.id,
      author_name: req.user.username,
      from_staff: false,
      text: String(req.body.text).trim(),
    });

    if (messageError) throw messageError;

    await supabase
      .from('support_tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', ticket.id);

    res.status(201).json({ messages: await loadMessages(ticket.id) });
  } catch (err) {
    next(err);
  }
}

module.exports = { createTicket, myTickets, replyToTicket, loadMessages, TICKET_SELECT };
