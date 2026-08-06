import { useCallback, useEffect, useState } from 'react';
import { LifeBuoy, Send } from 'lucide-react';
import api from '../../api/axios';
import Loader from '../../components/Loader';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import { TICKET_STATUS, TicketThread } from '../Support';
import { formatDateTime, formatRelativeDate } from '../../utils/format';

const FILTERS = [
  { value: '', label: 'Все' },
  { value: 'new', label: 'Новые' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'closed', label: 'Закрытые' },
];

export default function AdminSupport() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyText, setReplyText] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    api
      .get('/admin/support', { params: status ? { status } : {} })
      .then(({ data }) => {
        if (!cancelled) setItems(data.items);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [status, reloadToken]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  const applyUpdate = (updated) => {
    setItems((prev) => prev.map((ticket) => (ticket.id === updated.id ? updated : ticket)));
  };

  const changeStatus = async (ticket, nextStatus) => {
    setBusyId(ticket.id);
    setError('');
    try {
      const { data } = await api.patch(`/admin/support/${ticket.id}/status`, { status: nextStatus });
      applyUpdate(data.item);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const answer = async (ticket) => {
    const text = (replyText[ticket.id] || '').trim();
    if (text.length < 2) return;

    setBusyId(ticket.id);
    setError('');
    try {
      const { data } = await api.post(`/admin/support/${ticket.id}/messages`, { text });
      applyUpdate(data.item);
      setReplyText((prev) => ({ ...prev, [ticket.id]: '' }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900">Поддержка</h1>
        <p className="text-sm text-neutral-500">Обращения читателей и переписка по ним.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setStatus(filter.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              status === filter.value
                ? 'bg-brand text-white'
                : 'border border-neutral-200 bg-white text-neutral-600 hover:border-brand hover:text-brand'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <ErrorMessage message={error} onRetry={reload} />

      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
        !error && (
          <EmptyState
            title="Обращений нет"
            description="Здесь появятся вопросы читателей из формы поддержки."
            icon={LifeBuoy}
          />
        )
      ) : (
        <ul className="space-y-4">
          {items.map((ticket) => {
            const badge = TICKET_STATUS[ticket.status];

            return (
              <li key={ticket.id} className="card space-y-3 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
                    {badge.label}
                  </span>
                  <h2 className="font-bold text-neutral-900">{ticket.subject}</h2>
                  <span className="text-xs text-neutral-400" title={formatDateTime(ticket.created_at)}>
                    {formatRelativeDate(ticket.created_at)}
                  </span>
                </div>

                <p className="text-xs text-neutral-500">
                  {ticket.name} · {ticket.email}
                  {!ticket.user_id && ' · гость'}
                </p>

                <TicketThread messages={ticket.messages} />

                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={replyText[ticket.id] || ''}
                    onChange={(event) =>
                      setReplyText((prev) => ({ ...prev, [ticket.id]: event.target.value }))
                    }
                    className="field"
                    placeholder="Ответ читателю..."
                  />
                  <button
                    type="button"
                    onClick={() => answer(ticket)}
                    disabled={busyId === ticket.id}
                    className="btn-primary shrink-0"
                  >
                    <Send className="h-4 w-4" aria-hidden="true" />
                    Ответить
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 border-t border-neutral-100 pt-3">
                  {ticket.status !== 'in_progress' && (
                    <button
                      type="button"
                      className="btn-ghost text-xs"
                      disabled={busyId === ticket.id}
                      onClick={() => changeStatus(ticket, 'in_progress')}
                    >
                      Взять в работу
                    </button>
                  )}
                  {ticket.status !== 'closed' && (
                    <button
                      type="button"
                      className="btn-outline text-xs"
                      disabled={busyId === ticket.id}
                      onClick={() => changeStatus(ticket, 'closed')}
                    >
                      Закрыть
                    </button>
                  )}
                  {ticket.status === 'closed' && (
                    <button
                      type="button"
                      className="btn-ghost text-xs"
                      disabled={busyId === ticket.id}
                      onClick={() => changeStatus(ticket, 'new')}
                    >
                      Открыть заново
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
