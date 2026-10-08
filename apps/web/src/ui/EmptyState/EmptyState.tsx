import type { ReactNode } from 'react';
import styles from './EmptyState.module.css';

export interface EmptyStateProps {
  title: string;
  /** Uma frase: o que falta e o que fazer. */
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}

/** Estado vazio: diz que não há dado em vez de inventar número (#338). */
export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      {icon && <span className={styles.icon} aria-hidden="true">{icon}</span>}
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
