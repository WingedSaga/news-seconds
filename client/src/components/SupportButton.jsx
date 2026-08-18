import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function SupportButton({ className = '', children = 'Поддержать' }) {
  const [isOpening, setIsOpening] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const openCheckout = async () => {
    if (isOpening) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setIsOpening(true);

    try {
      const { data } = await api.post('/payments/stripe/checkout-session');
      if (!data?.url) throw new Error('Stripe did not return a checkout URL');
      window.location.assign(data.url);
    } catch (error) {
      window.alert(error.message || 'Не удалось открыть оплату. Попробуйте позже.');
      setIsOpening(false);
    }
  };

  return (
    <button type="button" onClick={openCheckout} disabled={isOpening} className={className}>
      <Heart className="h-4 w-4" aria-hidden="true" />
      {isOpening ? 'Открываем оплату…' : children}
    </button>
  );
}
