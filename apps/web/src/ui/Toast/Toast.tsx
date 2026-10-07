import type { ReactNode } from 'react';
import { cx } from '../cx';
import styles from './Toast.module.css';

export interface ToastProps {
  message: ReactNode;
  icon?: ReactNode;
  tone?: 'neutral' | 'danger';
  /** Ex.: um IconButton para dispensar. */
  action?: ReactNode;
}

/** Aviso curto. A posição (acima da barra) é de quem usa. */
export function Toast({ message, icon, tone = 'neutral', action }: ToastProps) {
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cx(styles.toast, tone === 'danger' && styles.danger)}>
      {icon && <span className={styles.icon} aria-hidden="true">{icon}</span>}
      <span className={styles.message}>{message}</span>
      {action}
    </div>
  );
}
