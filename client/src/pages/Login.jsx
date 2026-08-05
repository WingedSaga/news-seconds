import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, Lock, Mail, MailCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ErrorMessage from '../components/ErrorMessage';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { login, resendVerification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendState, setResendState] = useState('');

  const update = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const errors = {};
    if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Введите корректный email';
    if (form.password.length < 6) errors.password = 'Пароль должен быть не короче 6 символов';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!validateForm()) return;

    setSubmitting(true);
    setNeedsVerification(false);
    try {
      await login({ email: form.email.trim(), password: form.password });
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err.message);
      // Сервер отдельно помечает неподтверждённую почту, чтобы можно было
      // предложить повторную отправку письма прямо здесь.
      if (err.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        setNeedsVerification(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResendState('sending');
    try {
      await resendVerification(form.email.trim());
      setResendState('sent');
    } catch (err) {
      setError(err.message);
      setResendState('');
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="card space-y-6 p-6 sm:p-8">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-extrabold text-neutral-900">Вход</h1>
          <p className="text-sm text-neutral-500">Войдите, чтобы предлагать новости и комментировать.</p>
        </div>

        <ErrorMessage message={error} />

        {needsVerification &&
          (resendState === 'sent' ? (
            <p className="rounded-md border border-brand-accent bg-brand-accent/30 p-3 text-sm text-brand-dark">
              Письмо отправлено повторно. Проверьте почту, в том числе папку «Спам».
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendState === 'sending'}
              className="btn-outline w-full"
            >
              <MailCheck className="h-4 w-4" aria-hidden="true" />
              {resendState === 'sending' ? 'Отправляем...' : 'Отправить письмо повторно'}
            </button>
          ))}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-semibold text-neutral-700">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={update('email')}
                className="field pl-9"
                placeholder="you@example.com"
              />
            </div>
            {fieldErrors.email && <p className="text-xs text-red-600">{fieldErrors.email}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-semibold text-neutral-700">
              Пароль
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={update('password')}
                className="field pl-9"
                placeholder="Не менее 6 символов"
              />
            </div>
            {fieldErrors.password && <p className="text-xs text-red-600">{fieldErrors.password}</p>}
          </div>

          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            <LogIn className="h-4 w-4" aria-hidden="true" />
            {submitting ? 'Входим...' : 'Войти'}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-500">
          Нет аккаунта?{' '}
          <Link to="/register" className="font-semibold text-brand hover:underline">
            Зарегистрируйтесь
          </Link>
        </p>
      </div>
    </div>
  );
}
