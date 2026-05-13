import styles from './Form.module.css';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps {
  label?: string;
  options: SelectOption[];
  value: string | number;
  onChange: (value: string | number) => void;
  error?: string;
  name?: string;
  disabled?: boolean;
  'data-testid'?: string;
}

export function Select({
  label,
  options,
  value,
  onChange,
  error,
  name,
  disabled,
  'data-testid': testId,
}: SelectProps) {
  const id = `select-${name ?? Math.random().toString(36).slice(2, 8)}`;
  return (
    <div className={styles.field}>
      {label ? (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      ) : null}
      <select
        id={id}
        name={name}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const raw = e.target.value;
          const numeric = options.find((o) => String(o.value) === raw)?.value;
          onChange(numeric ?? raw);
        }}
        className={`${styles.input} ${error ? styles.invalid : ''}`}
        data-testid={testId ?? `select-${name ?? 'field'}`}
        aria-invalid={error ? 'true' : 'false'}
      >
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
      {error ? <span className={styles.error}>{error}</span> : null}
    </div>
  );
}
