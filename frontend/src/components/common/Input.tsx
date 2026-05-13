import { forwardRef, type InputHTMLAttributes } from 'react';
import styles from './Form.module.css';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className, id, ...rest },
  ref,
) {
  const inputId = id ?? `input-${rest.name ?? Math.random().toString(36).slice(2, 8)}`;
  return (
    <div className={styles.field}>
      {label ? (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        className={`${styles.input} ${error ? styles.invalid : ''} ${className ?? ''}`}
        data-testid={rest['data-testid' as keyof typeof rest] ?? `input-${rest.name ?? 'field'}`}
        aria-invalid={error ? 'true' : 'false'}
        {...rest}
      />
      {error ? <span className={styles.error}>{error}</span> : null}
    </div>
  );
});
