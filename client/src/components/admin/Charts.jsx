// Показатель одним числом: если данных всего одно значение, график не нужен.
export function StatTile({ label, value, hint, icon: Icon, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-accent text-brand-dark',
    neutral: 'bg-neutral-100 text-neutral-600',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-700',
  };

  return (
    <div className="card flex items-center gap-4 p-4">
      {Icon && (
        <span className={`rounded-md p-2.5 ${tones[tone]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-2xl font-extrabold leading-tight text-neutral-900">{value}</p>
        <p className="truncate text-sm text-neutral-600">{label}</p>
        {hint && <p className="truncate text-xs text-neutral-400">{hint}</p>}
      </div>
    </div>
  );
}

// Горизонтальные полосы для сравнения величин. Одна серия — один тон,
// поэтому легенда не нужна: значение подписано прямо у полосы.
export function BarList({ title, items, empty = 'Нет данных' }) {
  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <section className="card space-y-3 p-5">
      <h2 className="text-base font-bold text-neutral-900">{title}</h2>

      {items.length === 0 ? (
        <p className="text-sm text-neutral-500">{empty}</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li key={item.label} className="space-y-1">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate text-neutral-700">{item.label}</span>
                <span className="shrink-0 font-semibold tabular-nums text-neutral-900">
                  {item.value}
                </span>
              </div>
              <div className="h-2 rounded-full bg-neutral-100">
                <div
                  className="h-2 rounded-full bg-brand"
                  style={{ width: `${Math.max(2, (item.value / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// Публикации по дням: столбцы одной высотной шкалы, подписи только по краям,
// точное значение доступно по наведению.
export function TimelineChart({ title, points }) {
  const max = Math.max(1, ...points.map((point) => point.count));
  const total = points.reduce((sum, point) => sum + point.count, 0);

  const dayLabel = (iso) =>
    new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

  return (
    <section className="card space-y-4 p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-bold text-neutral-900">{title}</h2>
        <span className="text-sm text-neutral-500">всего {total}</span>
      </div>

      <div className="flex h-32 items-end gap-1.5">
        {points.map((point) => (
          <div
            key={point.date}
            className="group flex h-full flex-1 items-end"
            title={`${dayLabel(point.date)}: ${point.count}`}
          >
            <div
              className="w-full rounded-t bg-brand transition-colors group-hover:bg-brand-hover"
              style={{ height: `${Math.max(3, (point.count / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>

      <div className="flex justify-between text-xs text-neutral-400">
        <span>{dayLabel(points[0]?.date)}</span>
        <span>{dayLabel(points[points.length - 1]?.date)}</span>
      </div>
    </section>
  );
}
