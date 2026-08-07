// Знак издания — тот же, что на вкладке браузера. Нарисован линиями,
// а не текстом: так он одинаков всюду, независимо от шрифтов.
export default function BrandMark({ className = 'h-7 w-7' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="13" fill="currentColor" />
      <g fill="none" stroke="#FFFFFF" strokeWidth="5.5" strokeLinecap="round">
        <path d="M14 20 V44 M26 20 V44 M14 32 H26" />
        <path d="M49.7 26.3 A8 8 0 1 0 49.7 37.7" />
      </g>
    </svg>
  );
}
