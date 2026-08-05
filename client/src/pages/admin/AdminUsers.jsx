import { useEffect, useState } from 'react';
import { Ban, ShieldCheck, ShieldOff, Undo2, Users } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/Loader';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import SearchBar from '../../components/SearchBar';
import Avatar from '../../components/Avatar';
import { formatDateTime } from '../../utils/format';

export default function AdminUsers() {
  const { user: currentUser } = useAuth();

  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    api
      .get('/admin/users', { params: debouncedSearch ? { search: debouncedSearch } : {} })
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
  }, [debouncedSearch, reloadToken]);

  const applyUpdate = (updated) => {
    setItems((prev) => prev.map((user) => (user.id === updated.id ? updated : user)));
  };

  const changeRole = async (user) => {
    const role = user.role === 'admin' ? 'user' : 'admin';
    setBusyId(user.id);
    setError('');
    try {
      const { data } = await api.patch(`/admin/users/${user.id}/role`, { role });
      applyUpdate(data.item);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const changeBan = async (user) => {
    setBusyId(user.id);
    setError('');
    try {
      const { data } = await api.patch(`/admin/users/${user.id}/ban`, { is_banned: !user.is_banned });
      applyUpdate(data.item);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900">Пользователи</h1>
        <p className="text-sm text-neutral-500">Роли и блокировки аккаунтов.</p>
      </div>

      <div className="sm:max-w-sm">
        <SearchBar value={search} onChange={setSearch} placeholder="Поиск по имени или email..." />
      </div>

      <ErrorMessage message={error} onRetry={() => setReloadToken((token) => token + 1)} />

      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
        !error && <EmptyState title="Пользователи не найдены" icon={Users} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Пользователь</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Роль</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3">Регистрация</th>
                <th className="px-4 py-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {items.map((user) => {
                const isSelf = user.id === currentUser?.id;

                return (
                  <tr key={user.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2 font-semibold text-neutral-800">
                        <Avatar user={user} size="md" />
                        {user.username}
                        {isSelf && <span className="text-xs font-normal text-neutral-400">(вы)</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          user.role === 'admin' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          user.is_banned ? 'bg-red-100 text-red-700' : 'bg-brand-accent text-brand-dark'
                        }`}
                      >
                        {user.is_banned ? 'Заблокирован' : 'Активен'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{formatDateTime(user.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => changeRole(user)}
                          disabled={isSelf || busyId === user.id}
                          className="btn-ghost text-xs"
                          title={user.role === 'admin' ? 'Снять права администратора' : 'Назначить администратором'}
                        >
                          {user.role === 'admin' ? (
                            <ShieldOff className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                          )}
                          {user.role === 'admin' ? 'Снять роль' : 'Сделать админом'}
                        </button>

                        <button
                          type="button"
                          onClick={() => changeBan(user)}
                          disabled={isSelf || busyId === user.id}
                          className={`${user.is_banned ? 'btn-outline' : 'btn-danger'} text-xs`}
                        >
                          {user.is_banned ? (
                            <Undo2 className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <Ban className="h-4 w-4" aria-hidden="true" />
                          )}
                          {user.is_banned ? 'Разблокировать' : 'Заблокировать'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
