import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { cx } from '../cx';
import styles from './ListRow.module.css';

export interface ListRowProps {
  title: ReactNode;
  meta?: ReactNode;
  /** Substitui o chevron padrão das linhas tocáveis. */
  trailing?: ReactNode;
  onClick?: () => void;
  className?: string;
}

/** Linha de lista com divisória entre linhas vizinhas. Com onClick vira botão com chevron. */
export function ListRow({ title, meta, trailing, onClick, className }: ListRowProps) {
  const content = (
    <>
      <span className={styles.title}>{title}</span>
      {meta && <span className={styles.meta}>{meta}</span>}
      {trailing ?? (onClick ? <ChevronRight size={18} className={styles.chevron} aria-hidden="true" /> : null)}
    </>
  );
  if (onClick) {
    return (
      <button type="button" className={cx(styles.row, styles.interactive, className)} onClick={onClick}>
        {content}
      </button>
    );
  }
  return <div className={cx(styles.row, className)}>{content}</div>;
}
