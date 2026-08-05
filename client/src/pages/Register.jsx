import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, User, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ErrorMessage from '../components/ErrorMessage';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-zA-Zа-яА-ЯёЁ0-9_-]+$/;

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const errors = {};
    const username = form.username.trim();

    if (username.length < 3 || username.length > 30) {
      errors.username = 'Имя пользователя должно быть от 3 до 30 символов';
    } else if (!USERNAME_PATTERN.test(username)) {
      errors.username = 'Допустимы буквы, цифры, дефис и подчёркивание';
    }

    if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Введите корректный email';
    if (form.password.length < 6) errors.password = 'Пароль должен быть не короче 6 символов';
    if (form.password !== form.confirm) errors.confirm = 'Пароли не совпадают';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fields = [
    { name: 'username', label: 'Имя пользователя', type: 'text', icon: User, placeholder: 'Иван', autoComplete: 'username' },
    { name: 'email', label: 'Email', type: 'email', icon: Mail, placeholder: 'you@example.com', autoComplete: 'email' },
    { name: 'password', label: 'Пароль', type: 'password', icon: Lock, placeholder: 'Не менее 6 символов', autoComplete: 'new-password' },
    { name: 'confirm', label: 'Повторите пароль', type: 'password', icon: Lock, placeholder: 'Ещё раз', autoComplete: 'new-password' },
  ];

  return (
    <div className="mx-auto max-w-md">
      <div className="card space-y-6 p-6 sm:p-8">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-extrabold text-neutral-900">Регистрация</h1>
          <p className="text-sm text-neutral-500">Создайте аккаунт, чтобы публиковать свои новости.</p>
        </div>

        <ErrorMessage message={error} />

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {fields.map(({ name, label, type, icon: Icon, placeholder, autoComplete }) => (
            <div key={name} className="space-y-1">
              <label htmlFor={name} className="text-sm font-semibold text-neutral-700">
                {label}
              </label>
              <div className="relative">
                <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
                <input
                  id={name}
                  type={type}
                  autoComplete={autoComplete}
                  value={form[name]}
                  onChange={update(name)}
                  className="field pl-9"
                  placeholder={placeholder}
                />
              </div>
              {fieldErrors[name] && <p className="text-xs text-red-600">{fieldErrors[name]}</p>}
            </div>
          ))}

          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            {submitting ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-500">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="font-semibold text-brand hover:underline">
            Войдите
          </Link>
        </p>
      </div>
    </div>
  );
}
