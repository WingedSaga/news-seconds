import { initials } from '../utils/format';

const SIZES = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-sm',
};

export default function Avatar({ user, size = 'sm', className = '' }) {
  const name = user?.username || 'Гость';
  const classes = `${SIZES[size]} ${className} shrink-0 rounded-full object-cover`;

  if (user?.avatar_url) {
    return <img src={user.avatar_url} alt={name} className={`${classes} border border-neutral-200`} />;
  }

  return (
    <span
      aria-hidden="true"
      className={`${classes} flex items-center justify-center bg-brand-accent font-semibold text-brand-dark`}
    >
      {initials(name)}
    </span>
  );
}
