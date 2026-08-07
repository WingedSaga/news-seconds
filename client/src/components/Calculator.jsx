import { useCallback, useEffect, useRef, useState } from 'react';
import { Delete, X } from 'lucide-react';

const OPERATORS = { '+': '+', '-': '−', '*': '×', '/': '÷' };

function compute(a, b, op) {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '*':
      return a * b;
    case '/':
      return b === 0 ? null : a / b;
    default:
      return b;
  }
}

// Длинные хвосты вроде 0.30000000000000004 — след двоичной арифметики,
// а не результат, который человек ожидает увидеть.
function format(value) {
  if (value === null || Number.isNaN(value)) return 'Ошибка';
  if (!Number.isFinite(value)) return '∞';

  const rounded = Number(value.toPrecision(12));
  if (Math.abs(rounded) >= 1e12 || (Math.abs(rounded) < 1e-6 && rounded !== 0)) {
    return rounded.toExponential(6).replace('.', ',');
  }
  return String(rounded).replace('.', ',');
}

// После «Ошибки» на экране нет числа: продолжать счёт от неё нельзя,
// поэтому такое значение считаем нулём, а не NaN.
function toNumber(text) {
  const value = Number(String(text).replace(',', '.'));
  return Number.isNaN(value) ? 0 : value;
}

export default function Calculator({ onClose }) {
  const [current, setCurrent] = useState('0');
  const [stored, setStored] = useState(null);
  const [operator, setOperator] = useState(null);
  const [overwrite, setOverwrite] = useState(true);
  const [history, setHistory] = useState([]);
  const [flash, setFlash] = useState(false);
  const dialogRef = useRef(null);

  const digit = useCallback(
    (d) => {
      setCurrent((prev) => {
        if (overwrite) return d === ',' ? '0,' : d;
        if (d === ',' && prev.includes(',')) return prev;
        if (prev === '0' && d !== ',') return d;
        return prev.length < 15 ? prev + d : prev;
      });
      setOverwrite(false);
    },
    [overwrite]
  );

  const applyOperator = useCallback(
    (op) => {
      const value = toNumber(current);

      if (stored !== null && operator && !overwrite) {
        const result = compute(stored, value, operator);
        setHistory((prev) => [
          `${format(stored)} ${OPERATORS[operator]} ${format(value)} = ${format(result)}`,
          ...prev.slice(0, 7),
        ]);
        setStored(result);
        setCurrent(format(result));
      } else {
        setStored(value);
      }

      setOperator(op);
      setOverwrite(true);
    },
    [current, operator, overwrite, stored]
  );

  const equals = useCallback(() => {
    if (stored === null || !operator) return;

    const value = toNumber(current);
    const result = compute(stored, value, operator);

    setHistory((prev) => [
      `${format(stored)} ${OPERATORS[operator]} ${format(value)} = ${format(result)}`,
      ...prev.slice(0, 7),
    ]);
    setCurrent(format(result));
    setStored(null);
    setOperator(null);
    setOverwrite(true);
    setFlash(true);
    setTimeout(() => setFlash(false), 220);
  }, [current, operator, stored]);

  const clearAll = () => {
    setCurrent('0');
    setStored(null);
    setOperator(null);
    setOverwrite(true);
  };

  const backspace = useCallback(() => {
    setCurrent((prev) => (prev.length <= 1 || overwrite ? '0' : prev.slice(0, -1)));
  }, [overwrite]);

  const negate = () => {
    setCurrent((prev) => (prev.startsWith('-') ? prev.slice(1) : prev === '0' ? prev : `-${prev}`));
  };

  const percent = () => {
    setCurrent((prev) => format(toNumber(prev) / 100));
    setOverwrite(true);
  };

  useEffect(() => {
    dialogRef.current?.focus();

    const onKey = (event) => {
      const { key } = event;
      if (key >= '0' && key <= '9') return digit(key);
      if (key === '.' || key === ',') return digit(',');
      if (['+', '-', '*', '/'].includes(key)) return applyOperator(key);
      if (key === 'Enter' || key === '=') {
        event.preventDefault();
        return equals();
      }
      if (key === 'Backspace') return backspace();
      if (key === 'Escape') return onClose();
      if (key.toLowerCase() === 'c') return clearAll();
      return undefined;
    };

    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [applyOperator, backspace, digit, equals, onClose]);

  const Key = ({ label, onPress, tone = 'plain', wide = false, title }) => {
    const tones = {
      plain: 'bg-white text-neutral-800 hover:bg-neutral-100 active:bg-neutral-200',
      soft: 'bg-neutral-200/70 text-neutral-700 hover:bg-neutral-300/70 active:bg-neutral-300',
      accent: 'bg-brand text-white hover:bg-brand-hover active:bg-brand-dark',
    };

    return (
      <button
        type="button"
        onClick={onPress}
        title={title}
        className={`flex h-14 items-center justify-center rounded-xl text-xl font-semibold shadow-sm
          transition-all active:scale-95 ${tones[tone]} ${wide ? 'col-span-2' : ''}`}
      >
        {label}
      </button>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Калькулятор"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm overflow-hidden rounded-2xl bg-neutral-100 shadow-2xl outline-none"
      >
        <div className="flex items-center justify-between bg-brand-dark px-4 py-2.5 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-accent">
            Секретный калькулятор
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-white/15"
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="bg-ink px-4 py-5 text-right">
          <p className="h-5 text-sm text-neutral-400">
            {stored !== null && operator ? `${format(stored)} ${OPERATORS[operator]}` : ' '}
          </p>
          <p
            className={`truncate font-serif text-4xl font-bold text-white transition-transform duration-200 ${
              flash ? 'scale-105' : 'scale-100'
            }`}
            aria-live="polite"
          >
            {current}
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2 p-3">
          <Key label="C" tone="soft" onPress={clearAll} title="Очистить" />
          <Key label="±" tone="soft" onPress={negate} title="Сменить знак" />
          <Key label="%" tone="soft" onPress={percent} title="Процент" />
          <Key label="÷" tone="accent" onPress={() => applyOperator('/')} />

          <Key label="7" onPress={() => digit('7')} />
          <Key label="8" onPress={() => digit('8')} />
          <Key label="9" onPress={() => digit('9')} />
          <Key label="×" tone="accent" onPress={() => applyOperator('*')} />

          <Key label="4" onPress={() => digit('4')} />
          <Key label="5" onPress={() => digit('5')} />
          <Key label="6" onPress={() => digit('6')} />
          <Key label="−" tone="accent" onPress={() => applyOperator('-')} />

          <Key label="1" onPress={() => digit('1')} />
          <Key label="2" onPress={() => digit('2')} />
          <Key label="3" onPress={() => digit('3')} />
          <Key label="+" tone="accent" onPress={() => applyOperator('+')} />

          <Key label="0" wide onPress={() => digit('0')} />
          <Key label="," onPress={() => digit(',')} />
          <Key label="=" tone="accent" onPress={equals} />

          <Key
            label={<Delete className="h-5 w-5" aria-hidden="true" />}
            tone="soft"
            wide
            onPress={backspace}
            title="Удалить последний знак"
          />
          <div className="col-span-2 flex items-center justify-center text-[11px] text-neutral-400">
            Работают и клавиши
          </div>
        </div>

        {history.length > 0 && (
          <div className="max-h-32 overflow-y-auto border-t border-neutral-200 bg-white px-4 py-2">
            <ul className="space-y-1 text-right text-xs text-neutral-500">
              {history.map((line, index) => (
                <li key={`${line}-${index}`} className="tabular-nums">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
