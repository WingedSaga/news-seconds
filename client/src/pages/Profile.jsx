import { useState } from 'react';
import { Check, Crown, ImagePlus, Save, Trash2 } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import AvatarCropper from '../components/AvatarCropper';
import ErrorMessage from '../components/ErrorMessage';
import { formatDateTime } from '../utils/format';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export default function Profile() {
  const { user, updateProfile } = useAuth();

  const [username, setUsername] = useState(user?.username || '');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cropping, setCropping] = useState(null);

  const flash = (message) => {
    setSaved(message);
    setTimeout(() => setSaved(''), 2500);
  };

  // Выбранный файл сначала показываем в окне кадрирования: на сервер
  // уходит уже квадратный кусок, а не то, что сняла камера.
  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setError('');

    if (!file.type.startsWith('image/')) {
      setError('Можно загрузить только изображение');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Размер изображения не должен превышать 5 МБ');
      return;
    }

    setCropping(file);
  };

  const uploadCropped = async (blob) => {
    setCropping(null);
    setError('');

    const formData = new FormData();
    formData.append('image', blob, 'avatar.jpg');

    setUploading(true);
    try {
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await updateProfile({ avatar_url: data.url });
      flash('Аватар обновлён');
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    setError('');
    try {
      await updateProfile({ avatar_url: '' });
      flash('Аватар удалён');
    } catch (err) {
      setError(err.message);
    }
  };

  const saveUsername = async (event) => {
    event.preventDefault();
    setError('');

    const value = username.trim();
    if (value.length < 3 || value.length > 30) {
      setError('Имя пользователя должно быть от 3 до 30 символов');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({ username: value });
      flash('Имя обновлено');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="section-title">Профиль</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Аватар и имя видны под вашими новостями и комментариями.
        </p>
      </div>

      {cropping && (
        <AvatarCropper file={cropping} onCancel={() => setCropping(null)} onDone={uploadCropped} />
      )}

      <ErrorMessage message={error} />

      {saved && (
        <p className="flex items-center gap-2 rounded-md border border-brand-accent bg-brand-accent/30 p-3 text-sm text-brand-dark">
          <Check className="h-4 w-4" aria-hidden="true" />
          {saved}
        </p>
      )}

      <section className="card flex flex-col items-center gap-4 p-6 sm:flex-row sm:items-start">
        <Avatar user={user} size="xl" />

        <div className="flex-1 space-y-3 text-center sm:text-left">
          <div>
            <p className="text-lg font-bold text-neutral-900">{user.username}</p>
            <p className="text-sm text-neutral-500">{user.email}</p>
            <p className="text-xs text-neutral-400">
              {user.role === 'admin' ? 'Администратор' : 'Читатель'} · с{' '}
              {formatDateTime(user.created_at)}
            </p>
            {user.subscription?.is_active && (
              <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                <Crown className="h-3.5 w-3.5" aria-hidden="true" />
                Подписчик{user.subscription.expires_at ? ` · до ${formatDateTime(user.subscription.expires_at)}` : ''}
              </p>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            <label className="btn-outline cursor-pointer">
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
              {uploading ? 'Загружаем...' : user.avatar_url ? 'Заменить аватар' : 'Загрузить аватар'}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={uploading}
                className="hidden"
              />
            </label>

            {user.avatar_url && (
              <button type="button" onClick={removeAvatar} className="btn-danger">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Удалить
              </button>
            )}
          </div>

          <p className="text-xs text-neutral-400">
            JPG, PNG, WEBP или GIF, до 5 МБ. Перед сохранением можно выбрать область.
            Без своей картинки показываются инициалы.
          </p>
        </div>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="text-base font-bold text-neutral-900">Имя пользователя</h2>
        <form onSubmit={saveUsername} className="flex flex-col gap-2 sm:flex-row">
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            maxLength={30}
            className="field"
            placeholder="Как вас подписывать"
          />
          <button type="submit" className="btn-primary shrink-0" disabled={saving}>
            <Save className="h-4 w-4" aria-hidden="true" />
            Сохранить
          </button>
        </form>
      </section>
    </div>
  );
}
