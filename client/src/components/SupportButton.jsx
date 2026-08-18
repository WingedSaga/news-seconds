import { Heart } from 'lucide-react';
import { DONATION_URL } from '../constants';

export default function SupportButton({ className = '', children = 'Поддержать' }) {
  return (
    <a href={DONATION_URL} target="_blank" rel="noreferrer" className={className}>
      <Heart className="h-4 w-4" aria-hidden="true" />
      {children}
    </a>
  );
}
