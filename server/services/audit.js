const { supabase } = require('../db/supabase');

// Запись в журнал не должна ломать основное действие: если лог не записался,
// администратор всё равно получает результат, а причина уходит в консоль.
async function logAction(actor, action, { targetType, targetId, details } = {}) {
  try {
    const { error } = await supabase.from('admin_actions').insert({
      actor_id: actor?.id || null,
      actor_name: actor?.username || 'система',
      action,
      target_type: targetType || null,
      target_id: targetId ? String(targetId) : null,
      details: details || null,
    });
    if (error) throw error;
  } catch (err) {
    console.error('[audit] не удалось записать действие:', err.message);
  }
}

async function listActions({ limit = 100 } = {}) {
  const { data, error } = await supabase
    .from('admin_actions')
    .select('id, actor_name, action, target_type, target_id, details, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

module.exports = { logAction, listActions };
