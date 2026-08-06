import { useCallback, useEffect, useState } from 'react';
import { MailWarning, Save, ShieldPlus } from 'lucide-react';
import api from '../../api/axios';
import Loader from '../../components/Loader';
import ErrorMessage from '../../components/ErrorMessage';

const TOGGLES = [
  {
    key: 'registration_open',
    label: 'Регистрация открыта',
    hint: 'Когда выключено, новые пользователи зарегистрироваться не могут.',
  },
  {
    key: 'email_verification',
    label: 'Подтверждение почты',
    hint: 'Требовать переход по ссылке из письма перед первым входом.',
    needsMail: true,
  },
  {
    key: 'comments_enabled',
    label: 'Комментарии',
    hint: 'Когда выключено, оставлять новые комментарии нельзя.',
  },
  {
    key: 'auto_approve_articles',
    label: 'Публикация без модерации',
    hint: 'Присланные материалы попадают в ленту сразу, минуя очередь проверки.',
  },
];

function Toggle({ checked, disabled, onChange, label, hint }) {
  return (
    <label
      className={`flex items-start justify-between gap-4 border-b border-neutral-100 py-4 last:border-0 ${
        disabled ? 'opacity-60' : 'cursor-pointer'
      }`}
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-neutral-800">{label}</span>
        <span className="block text-xs text-neutral-500">{hint}</span>
      </span>

      <span className="relative mt-1 shrink-0">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="block h-6 w-11 rounded-full bg-neutral-300 transition-colors peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand peer-focus-visible:ring-offset-2" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [mail, setMail] = useState({ available: false, provider: 'none' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  const [tagline, setTagline] = useState('');
  const [savingTagline, setSavingTagline] = useState(false);

  const [promoteEmail, setPromoteEmail] = useState('');
  const [promoting, setPromoting] = useState(false);
  const [promoteResult, setPromoteResult] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    return api
      .get('/admin/settings')
      .then(({ data }) => {
        setSettings(data.settings);
        setMail(data.mail);
        setTagline(data.settings.site_tagline || '');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (patch) => {
    setError('');
    setSaved('');
    // Показываем новое положение сразу, при ошибке возвращаем прежнее.
    const previous = settings;
    setSettings({ ...settings, ...patch });

    try {
      const { data } = await api.patch('/admin/settings', patch);
      setSettings(data.settings);
      setSaved('Сохранено');
      setTimeout(() => setSaved(''), 2000);
    } catch (err) {
      setSettings(previous);
      setError(err.message);
    }
  };

  const saveTagline = async (event) => {
    event.preventDefault();
    setSavingTagline(true);
    await save({ site_tagline: tagline.trim() });
    setSavingTagline(false);
  };

  const promote = async (event) => {
    event.preventDefault();
    setPromoteResult('');
    setError('');
    setPromoting(true);

    try {
      const { data } = await api.post('/admin/users/promote', { email: promoteEmail.trim() });
      setPromoteResult(`${data.item.username} теперь администратор`);
      setPromoteEmail('');
    } catch (err) {
      setError(err.message);
    } finally {
      setPromoting(false);
    }
  };

  if (loading) return <Loader label="Загружаем настройки..." />;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900">Управление сайтом</h1>
        <p className="text-sm text-neutral-500">Настройки применяются сразу, без передеплоя.</p>
      </div>

      <ErrorMessage message={error} onRetry={load} />

      {saved && (
        <p className="rounded-md border border-brand-accent bg-brand-accent/30 p-3 text-sm text-brand-dark">
          {saved}
        </p>
      )}

      {settings && (
        <>
          <section className="card px-5">
            {TOGGLES.map((toggle) => (
              <Toggle
                key={toggle.key}
                label={toggle.label}
                hint={toggle.hint}
                checked={Boolean(settings[toggle.key])}
                disabled={toggle.needsMail && !mail.available}
                onChange={(value) => save({ [toggle.key]: value })}
              />
            ))}
          </section>

          {!mail.available && (
            <p className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <MailWarning className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Подтверждение почты недоступно: на сервере не настроен сервис отправки писем.
              Задайте BREVO_API_KEY или RESEND_API_KEY в переменных окружения.
            </p>
          )}

          <section className="card space-y-3 p-5">
            <h2 className="text-base font-bold text-neutral-900">Подзаголовок газеты</h2>
            <form onSubmit={saveTagline} className="flex flex-col gap-2 sm:flex-row">
              <input
                value={tagline}
                onChange={(event) => setTagline(event.target.value)}
                maxLength={200}
                className="field"
                placeholder="Строка под названием на главной"
              />
              <button type="submit" className="btn-primary shrink-0" disabled={savingTagline}>
                <Save className="h-4 w-4" aria-hidden="true" />
                Сохранить
              </button>
            </form>
          </section>

          <section className="card space-y-3 p-5">
            <h2 className="text-base font-bold text-neutral-900">Назначить администратора</h2>
            <p className="text-xs text-neutral-500">
              Пользователь должен быть уже зарегистрирован. Снять права можно в разделе
              «Пользователи».
            </p>

            <form onSubmit={promote} className="flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                required
                value={promoteEmail}
                onChange={(event) => setPromoteEmail(event.target.value)}
                className="field"
                placeholder="admin@example.com"
              />
              <button type="submit" className="btn-primary shrink-0" disabled={promoting}>
                <ShieldPlus className="h-4 w-4" aria-hidden="true" />
                {promoting ? 'Назначаем...' : 'Назначить'}
              </button>
            </form>

            {promoteResult && (
              <p className="rounded-md border border-brand-accent bg-brand-accent/30 p-3 text-sm text-brand-dark">
                {promoteResult}
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
