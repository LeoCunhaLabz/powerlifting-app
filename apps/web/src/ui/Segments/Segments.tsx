import { cx } from '../cx';
import { segmentStates, type SegmentsMode } from './segmentStates';
import styles from './Segments.module.css';

export interface SegmentsProps {
  total: number;
  filled: number;
  mode?: SegmentsMode;
  withCurrent?: boolean;
  size?: 'sm' | 'md';
  /** Descrição para leitor de tela, ex.: "5 de 17 séries concluídas". */
  label: string;
  className?: string;
}

/** Barra segmentada, a assinatura da identidade: progresso (feitos + atual) ou contagem regressiva. */
export function Segments({ total, filled, mode = 'progress', withCurrent = true, size = 'md', label, className }: SegmentsProps) {
  const states = segmentStates({ total, filled, mode, withCurrent });
  return (
    <div
      role="img"
      aria-label={label}
      className={cx(styles.segments, styles[size], className)}
      style={{ gridTemplateColumns: `repeat(${states.length}, minmax(0, 1fr))` }}
    >
      {states.map((state, i) => (
        <span key={i} className={cx(styles.segment, styles[state])} />
      ))}
    </div>
  );
}
