import { useCallback, useEffect, useState } from 'react';
import { LifeBuoy, Send } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ErrorMessage from '../components/ErrorMessage';
import Loader from '../components/Loader';
import { formatRelativeDate } from '../utils/format';

export const TICKET_STATUS = {
  new: { label: 'Новое', className: 'bg-amber-100 text-amber-800' },
  in_progress: { label: 'В работе', className: 'bg-brand-accent text-brand-dark' },
  closed: { label: 'Закрыто', className: 'bg-neutral-100 text-neutral-600' },
};

export function TicketThread({ messages }) {
  return (
    <ul className="space-y-3">
      {messages.map((message) => (
        <li
          key={message.id}
          className={`rounded-md border p-3 text-sm ${
            message.from_staff
              ? 'border-brand-accent bg-brand-accent/20'
              : 'border-neutral-200 bg-white'
          }`}
        >
          <p className="mb-1 text-xs font-semibold text-neutral-600">
            {message.from_staff ? `Редакция · ${message.author_name}` : message.author_name}
            <span className="ml-2 font-normal text-neutral-400">
              {formatRelativeDate(message.created_at)}
            </span>
          </p>
          <p className="whitespace-pre-wrap text-neutral-800">{message.text}</p>
        </li>
      ))}
    </ul>
  );
}

export default function Support() {
  const { user, isAuthenticated } = useAuth();

  const [form, setForm] = useState({ name: '', email: '', subject: '', text: '' });
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(isAuthenticated);
  const [replyText, setReplyText] = useState({});
  const [replyBusy, setReplyBusy] = useState(null);

  const loadTickets = useCallback(() => {
    if (!isAuthenticated) return Promise.resolve();
    setLoadingTickets(true);
    return api
      .get('/support/mine')
      .then(({ data }) => setTickets(data.items))
      .catch(() => setTickets([]))
      .finally(() => setLoadingTickets(false));
  }, [isAuthenticated]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    if (form.subject.trim().length < 5) {
      setError('Тема должна быть не короче 5 символов');
      return;
    }
    if (form.text.trim().length < 10) {
      setError('Опишите вопрос подробнее — не короче 10 символов');
      return;
    }
    if (!isAuthenticated && (!form.name.trim() || !form.email.trim())) {
      setError('Укажите имя и адрес почты, чтобы мы могли ответить');
      return;
    }

    setSending(true);
    try {
      await api.post('/support', {
        subject: form.subject.trim(),
        text: form.text.trim(),
        ...(isAuthenticated ? {} : { name: form.name.trim(), email: form.email.trim() }),
      });
      setForm({ name: '', email: '', subject: '', text: '' });
      setSent(true);
      await loadTickets();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const sendReply = async (ticketId) => {
    const text = (replyText[ticketId] || '').trim();
    if (text.length < 2) return;

    setReplyBusy(ticketId);
    setError('');
    try {
      const { data } = await api.post(`/support/${ticketId}/messages`, { text });
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === ticketId ? { ...ticket, messages: data.messages } : ticket
        )
      );
      setReplyText((prev) => ({ ...prev, [ticketId]: '' }));
    } catch (err) {
      setError(err.message);
    } finally {
      setReplyBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="section-title">Служба поддержки</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Вопрос о публикации, жалоба на материал или ошибка на сайте — напишите, разберёмся.
        </p>
      </div>

      <ErrorMessage message={error} />

      {sent ? (
        <div className="card flex flex-col items-center gap-3 p-6 text-center">
          <LifeBuoy className="h-10 w-10 text-brand" aria-hidden="true" />
          <h2 className="text-lg font-bold text-neutral-900">Обращение принято</h2>
          <p className="text-sm text-neutral-500">
            {isAuthenticated
              ? 'Ответ появится ниже, в переписке по обращению.'
              : 'Ответ придёт на указанный адрес почты.'}
          </p>
          <button type="button" className="btn-outline" onClick={() => setSent(false)}>
            Написать ещё
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="card space-y-4 p-5" noValidate>
          {!isAuthenticated && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="support-name" className="text-sm font-semibold text-neutral-700">
                  Как к вам обращаться
                </label>
                <input id="support-name" value={form.name} onChange={update('name')} className="field" />
              </div>
              <div className="space-y-1">
                <label htmlFor="support-email" className="text-sm font-semibold text-neutral-700">
                  Email для ответа
                </label>
                <input
                  id="support-email"
                  type="email"
                  value={form.email}
                  onChange={update('email')}
                  className="field"
                />
              </div>
            </div>
          )}

          {isAuthenticated && (
            <p className="text-xs text-neutral-500">
              Ответим на {user.email} и покажем переписку на этой странице.
            </p>
          )}

          <div className="space-y-1">
            <label htmlFor="support-subject" className="text-sm font-semibold text-neutral-700">
              Тема
            </label>
            <input
              id="support-subject"
              value={form.subject}
              onChange={update('subject')}
              maxLength={150}
              className="field"
              placeholder="Коротко о сути"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="support-text" className="text-sm font-semibold text-neutral-700">
              Сообщение
            </label>
            <textarea
              id="support-text"
              rows={6}
              value={form.text}
              onChange={update('text')}
              maxLength={5000}
              className="field resize-y"
              placeholder="Опишите подробно, что случилось"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={sending}>
            <Send className="h-4 w-4" aria-hidden="true" />
            {sending ? 'Отправляем...' : 'Отправить обращение'}
          </button>
        </form>
      )}

      {isAuthenticated && (
        <section className="space-y-4">
          <h2 className="section-title">Мои обращения</h2>

          {loadingTickets ? (
            <Loader />
          ) : tickets.length === 0 ? (
            <p className="text-sm text-neutral-500">Вы ещё не обращались в поддержку.</p>
          ) : (
            <ul className="space-y-4">
              {tickets.map((ticket) => {
                const status = TICKET_STATUS[ticket.status];

                return (
                  <li key={ticket.id} className="card space-y-3 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
                        {status.label}
                      </span>
                      <h3 className="font-bold text-neutral-900">{ticket.subject}</h3>
                      <span className="text-xs text-neutral-400">
                        {formatRelativeDate(ticket.created_at)}
                      </span>
                    </div>

                    <TicketThread messages={ticket.messages} />

                    {ticket.status !== 'closed' && (
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          value={replyText[ticket.id] || ''}
                          onChange={(event) =>
                            setReplyText((prev) => ({ ...prev, [ticket.id]: event.target.value }))
                          }
                          className="field"
                          placeholder="Добавить сообщение..."
                        />
                        <button
                          type="button"
                          onClick={() => sendReply(ticket.id)}
                          disabled={replyBusy === ticket.id}
                          className="btn-outline shrink-0"
                        >
                          <Send className="h-4 w-4" aria-hidden="true" />
                          Отправить
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
