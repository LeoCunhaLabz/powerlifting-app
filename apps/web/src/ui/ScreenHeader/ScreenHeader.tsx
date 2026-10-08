import type { ReactNode } from 'react';
import styles from './ScreenHeader.module.css';

export interface ScreenHeaderProps {
  title: string;
  /** Uma frase de apoio abaixo do título. */
  meta?: ReactNode;
  /** Ações à direita (ex.: botão "Nova rotina"). */
  actions?: ReactNode;
}

/** Título de tela: o único estilo de h1 do app (#352). */
export function ScreenHeader({ title, meta, actions }: ScreenHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.texts}>
        <h1 className={styles.title}>{title}</h1>
        {meta && <p className={styles.meta}>{meta}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}
