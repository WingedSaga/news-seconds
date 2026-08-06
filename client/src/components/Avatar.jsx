import { initials } from '../utils/format';

const SIZES = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-sm',
  xl: 'h-24 w-24 text-xl',
};

// Запасные аватарки: цвет выводится из имени, поэтому у одного человека он
// всегда один и тот же, а разные люди различаются с первого взгляда.
// Все тона достаточно тёмные, чтобы белые инициалы читались.
const TONES = [
  'bg-[#2E7D32]',
  'bg-[#00695C]',
  'bg-[#1565C0]',
  'bg-[#4527A0]',
  'bg-[#AD1457]',
  'bg-[#C62828]',
  'bg-[#EF6C00]',
  'bg-[#37474F]',
];

function toneFor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % 1000003;
  }
  return TONES[hash % TONES.length];
}

export default function Avatar({ user, size = 'sm', className = '' }) {
  const name = user?.username || 'Гость';
  const classes = `${SIZES[size]} ${className} shrink-0 rounded-full object-cover`;

  if (user?.avatar_url) {
    return <img src={user.avatar_url} alt={name} className={`${classes} border border-neutral-200`} />;
  }

  return (
    <span
      aria-hidden="true"
      className={`${classes} flex items-center justify-center font-semibold text-white ${toneFor(name)}`}
    >
      {initials(name)}
    </span>
  );
}
