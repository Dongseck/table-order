import { useEffect, type ReactNode } from 'react';
import styles from './Modal.module.css';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  footer?: ReactNode;
  children: ReactNode;
}

export function Modal({ open, onClose, title, footer, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.backdrop} data-testid="modal-backdrop" onClick={onClose}>
      <div
        className={styles.dialog}
        data-testid="modal-dialog"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {title ? (
          <header className={styles.header}>
            <h2 className={styles.title}>{title}</h2>
            <button
              type="button"
              className={styles.close}
              aria-label="Close"
              data-testid="modal-close"
              onClick={onClose}
            >
              ×
            </button>
          </header>
        ) : null}
        <div className={styles.body}>{children}</div>
        {footer ? <footer className={styles.footer}>{footer}</footer> : null}
      </div>
    </div>
  );
}
