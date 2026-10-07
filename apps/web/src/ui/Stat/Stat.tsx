import type { ReactNode } from 'react';
import { cx } from '../cx';
import { EMPTY_VALUE, formatCompact, formatNumber } from '../../utils/format';
import styles from './Stat.module.css';

export type StatSize = 'xl' | 'lg' | 'md' | 'sm';

export interface StatProps {
  /** Passe NaN quando não houver dado: o Stat mostra "sem dado" em vez de inventar número. */
  value: number;
  /** Casas fixas (ex.: 1 para e1RM). Sem isso, até 2 casas sem zero à direita. */
  decimals?: number;
  unit?: string;
  size?: StatSize;
  label?: ReactNode;
  delta?: ReactNode;
  className?: string;
}

/** Número de placar: valor, unidade, legenda e variação. */
export function Stat({ value, decimals, unit, size = 'md', label, delta, className }: StatProps) {
  const hasValue = Number.isFinite(value);
  const text = decimals === undefined ? formatCompact(value) : formatNumber(value, decimals);
  return (
    <div className={cx(styles.stat, styles[size], className)}>
      {label && <span className={styles.label}>{label}</span>}
      {hasValue ? (
        <span className={styles.figure}>
          <span className={styles.value}>{text}</span>
          {unit && <span className={styles.unit}>{unit}</span>}
        </span>
      ) : (
        <span className={styles.empty}>{EMPTY_VALUE}</span>
      )}
      {delta && <span className={styles.delta}>{delta}</span>}
    </div>
  );
}
