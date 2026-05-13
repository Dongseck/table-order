import { forwardRef, type TextareaHTMLAttributes } from 'react';
import styles from './Form.module.css';

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, error, maxLength, className, id, value, ...rest },
  ref,
) {
  const taId = id ?? `textarea-${rest.name ?? Math.random().toString(36).slice(2, 8)}`;
  const count = typeof value === 'string' ? value.length : 0;
  return (
    <div className={styles.field}>
      {label ? (
        <label htmlFor={taId} className={styles.label}>
          {label}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={taId}
        value={value}
        maxLength={maxLength}
        className={`${styles.textarea} ${error ? styles.invalid : ''} ${className ?? ''}`}
        data-testid={rest['data-testid' as keyof typeof rest] ?? `textarea-${rest.name ?? 'field'}`}
        aria-invalid={error ? 'true' : 'false'}
        {...rest}
      />
      <div className={styles.metaRow}>
        {error ? <span className={styles.error}>{error}</span> : <span />}
        {maxLength ? (
          <span className={styles.counter}>
            {count} / {maxLength}
          </span>
        ) : null}
      </div>
    </div>
  );
});
