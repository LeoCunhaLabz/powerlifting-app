import { useId, type ReactNode } from 'react';
import './calc.css';

/* Peças compartilhadas pelas calculadoras públicas. */

interface NumberFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
  placeholder?: string;
  accent?: boolean;
  /** `decimal` (padrão) ou `numeric` para inteiros (reps). */
  inputMode?: 'decimal' | 'numeric';
  autoComplete?: string;
}

export function NumberField({
  label,
  value,
  onChange,
  suffix,
  placeholder,
  accent = false,
  inputMode = 'decimal',
}: NumberFieldProps) {
  const id = useId();
  return (
    <div className={`field${accent ? ' field--accent' : ''}`}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <div className="field__control">
        <input
          id={id}
          className="field__input"
          type="text"
          inputMode={inputMode}
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix && <span className="field__suffix">{suffix}</span>}
      </div>
    </div>
  );
}

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}

export function Segmented<T extends string>({ options, value, onChange, ariaLabel }: SegmentedProps<T>) {
  return (
    <div className="seg" role="group" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className="seg__btn"
          aria-pressed={opt.value === value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

interface StatProps {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}

export function Stat({ label, value, sub, accent = false }: StatProps) {
  return (
    <div className={`stat${accent ? ' stat--accent' : ''}`}>
      <span className="stat__label">{label}</span>
      <span className="stat__num">{value}</span>
      {sub && <span className="stat__sub">{sub}</span>}
    </div>
  );
}

interface ResultProps {
  label: string;
  unit?: string;
  hint?: string;
  children: ReactNode;
}

export function Result({ label, unit, hint, children }: ResultProps) {
  return (
    <div className="result" aria-live="polite">
      <span className="result__label">{label}</span>
      <div className="result__value">
        <span className="result__num">{children}</span>
        {unit && <span className="result__unit">{unit}</span>}
      </div>
      {hint && <span className="result__hint">{hint}</span>}
    </div>
  );
}
