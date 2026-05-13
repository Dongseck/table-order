import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  type = 'button',
  className,
  ...rest
}: ButtonProps) {
  const classes = [
    styles.btn,
    styles[`v-${variant}`],
    styles[`s-${size}`],
    loading ? styles.loading : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || loading}
      data-testid={rest['data-testid' as keyof typeof rest] ?? 'button'}
      className={classes}
    >
      {loading ? '...' : children}
    </button>
  );
}
