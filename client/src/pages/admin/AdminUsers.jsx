import { useEffect, useState } from 'react';
import { Ban, KeyRound, Pencil, ShieldCheck, ShieldOff, Trash2, Undo2, Users } from 'lucide-react';
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

  const removeUser = async (user) => {
    // eslint-disable-next-line no-alert
    if (
      !window.confirm(
        `Удалить пользователя ${user.username}? Вместе с ним удалятся его комментарии и закладки.`
      )
    ) {
      return;
    }

    setBusyId(user.id);
    setError('');
    try {
      await api.delete(`/admin/users/${user.id}`);
      setItems((prev) => prev.filter((item) => item.id !== user.id));
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

  const changeUsername = async (user) => {
    // Администратор выбирает новое имя сам: это позволяет быстро убрать оскорбительные ники.
    // eslint-disable-next-line no-alert
    const value = window.prompt('Новое имя пользователя', user.username);
    if (value === null) return;

    const username = value.trim();
    if (!username || username === user.username) return;

    setBusyId(user.id);
    setError('');
    try {
      const { data } = await api.patch(`/admin/users/${user.id}/username`, { username });
      applyUpdate(data.item);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const resetPassword = async (user) => {
    // eslint-disable-next-line no-alert
    const password = window.prompt(`Новый пароль для ${user.username} (минимум 8 символов)`);
    if (password === null) return;
    if (password.length < 8) { setError('Пароль должен быть не короче 8 символов'); return; }
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Изменить пароль пользователя ${user.username}?`)) return;
    setBusyId(user.id); setError('');
    try {
      await api.patch(`/admin/users/${user.id}/password`, { password });
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
        <>
        {/* На телефоне действия в таблице оказываются за краем экрана,
            поэтому там список превращается в карточки. */}
        <ul className="space-y-3 sm:hidden">
          {items.map((user) => {
            const isSelf = user.id === currentUser?.id;

            return (
              <li key={user.id} className="card space-y-3 p-4">
                <div className="flex items-center gap-2">
                  <Avatar user={user} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-neutral-800">
                      {user.username}
                      {isSelf && <span className="ml-1 text-xs font-normal text-neutral-400">(вы)</span>}
                    </p>
                    <p className="truncate text-xs text-neutral-500">{user.email}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={`rounded-full px-2.5 py-1 font-semibold ${
                      user.role === 'admin' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 font-semibold ${
                      user.is_banned ? 'bg-red-100 text-red-700' : 'bg-brand-accent text-brand-dark'
                    }`}
                  >
                    {user.is_banned ? 'Заблокирован' : 'Активен'}
                  </span>
                  <span className="text-neutral-400">{formatDateTime(user.created_at)}</span>
                </div>

                {!isSelf && (
                  <div className="flex flex-wrap gap-2 border-t border-neutral-100 pt-3">
                    <button
                      type="button"
                      onClick={() => changeUsername(user)}
                      disabled={busyId === user.id}
                      className="btn-ghost text-xs"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      Изменить ник
                    </button>

                    <button type="button" onClick={() => resetPassword(user)} disabled={busyId === user.id} className="btn-ghost text-xs">
                      <KeyRound className="h-4 w-4" aria-hidden="true" />
                      Сменить пароль
                    </button>

                    <button
                      type="button"
                      onClick={() => changeRole(user)}
                      disabled={busyId === user.id}
                      className="btn-ghost text-xs"
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
                      disabled={busyId === user.id}
                      className={`${user.is_banned ? 'btn-outline' : 'btn-danger'} text-xs`}
                    >
                      {user.is_banned ? (
                        <Undo2 className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Ban className="h-4 w-4" aria-hidden="true" />
                      )}
                      {user.is_banned ? 'Разблокировать' : 'Заблокировать'}
                    </button>

                    <button
                      type="button"
                      onClick={() => removeUser(user)}
                      disabled={busyId === user.id}
                      className="btn-ghost text-xs text-red-600"
                      aria-label="Удалить пользователя"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <div className="card hidden overflow-x-auto sm:block">
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
                          onClick={() => changeUsername(user)}
                          disabled={isSelf || busyId === user.id}
                          className="btn-ghost text-xs"
                          title="Изменить имя пользователя"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                          Изменить ник
                        </button>

                        <button type="button" onClick={() => resetPassword(user)} disabled={isSelf || busyId === user.id} className="btn-ghost text-xs" title="Задать новый пароль пользователю">
                          <KeyRound className="h-4 w-4" aria-hidden="true" />
                          Сменить пароль
                        </button>

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

                        <button
                          type="button"
                          onClick={() => removeUser(user)}
                          disabled={isSelf || busyId === user.id}
                          className="rounded p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600 disabled:hover:bg-transparent disabled:hover:text-neutral-400"
                          aria-label={`Удалить ${user.username}`}
                          title="Удалить пользователя"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}
