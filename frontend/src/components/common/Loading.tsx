import styles from './Loading.module.css';

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  fullscreen?: boolean;
  message?: string;
}

export function Loading({ size = 'md', fullscreen = false, message }: LoadingProps) {
  const wrapClass = fullscreen ? styles.fullscreen : styles.inline;
  return (
    <div className={wrapClass} data-testid="loading">
      <div className={`${styles.spinner} ${styles[`s-${size}`]}`} />
      {message ? <p className={styles.message}>{message}</p> : null}
    </div>
  );
}
