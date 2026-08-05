import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Home, MailX, RotateCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { verifyEmail, resendVerification } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState(token ? 'loading' : 'missing');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [resendState, setResendState] = useState('');

  // В StrictMode эффект вызывается дважды — токен одноразовый,
  // поэтому запрос отправляем только один раз.
  const requested = useRef(false);

  useEffect(() => {
    if (!token || requested.current) return;
    requested.current = true;

    verifyEmail(token)
      .then(() => {
        setStatus('success');
        setTimeout(() => navigate('/', { replace: true }), 2500);
      })
      .catch((err) => {
        setError(err.message);
        setStatus('error');
      });
  }, [token, verifyEmail, navigate]);

  const handleResend = async (event) => {
    event.preventDefault();
    setResendState('sending');
    setError('');
    try {
      await resendVerification(email.trim());
      setResendState('sent');
    } catch (err) {
      setError(err.message);
      setResendState('');
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="card space-y-5 p-6 text-center sm:p-8">
        {status === 'loading' && <Loader label="Подтверждаем адрес..." />}

        {status === 'success' && (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-brand" aria-hidden="true" />
            <h1 className="text-2xl font-extrabold text-neutral-900">Почта подтверждена</h1>
            <p className="text-sm text-neutral-500">
              Вы вошли в аккаунт. Сейчас переведём вас на главную страницу.
            </p>
            <Link to="/" className="btn-primary w-full">
              <Home className="h-4 w-4" aria-hidden="true" />
              На главную
            </Link>
          </>
        )}

        {(status === 'error' || status === 'missing') && (
          <>
            <MailX className="mx-auto h-12 w-12 text-neutral-400" aria-hidden="true" />
            <h1 className="text-2xl font-extrabold text-neutral-900">
              {status === 'missing' ? 'Ссылка неполная' : 'Не удалось подтвердить'}
            </h1>

            <ErrorMessage
              message={
                status === 'missing'
                  ? 'В адресе нет кода подтверждения. Откройте ссылку из письма целиком.'
                  : error
              }
            />

            {resendState === 'sent' ? (
              <p className="rounded-md border border-brand-accent bg-brand-accent/30 p-3 text-sm text-brand-dark">
                Если аккаунт с таким адресом существует и не подтверждён, письмо отправлено.
                Проверьте почту, в том числе папку «Спам».
              </p>
            ) : (
              <form onSubmit={handleResend} className="space-y-3 text-left">
                <label htmlFor="resend-email" className="text-sm font-semibold text-neutral-700">
                  Отправить письмо повторно
                </label>
                <input
                  id="resend-email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="field"
                  placeholder="you@example.com"
                />
                <button type="submit" className="btn-outline w-full" disabled={resendState === 'sending'}>
                  <RotateCw className="h-4 w-4" aria-hidden="true" />
                  {resendState === 'sending' ? 'Отправляем...' : 'Отправить ссылку'}
                </button>
              </form>
            )}

            <Link to="/login" className="block text-sm font-semibold text-brand hover:underline">
              Вернуться ко входу
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
