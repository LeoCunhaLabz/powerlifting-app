import type { SetState } from '@powerlifting/shared';
import { Check } from 'lucide-react';
import { cx } from '../../../ui/cx';
import { formatCompact } from '../../../utils/format';
import styles from './SetRow.module.css';

const RPE_OPTIONS = [10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5];
const TYPE_NAME: Record<SetState['type'], string> = { N: 'Série normal', W: 'Aquecimento', D: 'Drop set' };

export interface SetRowProps {
  set: SetState;
  /** "1", "Aq" ou "D" (ver setLabel em utils/workoutSets). */
  label: string;
  /** Série atual do treino: linha ampliada e check dourado. */
  current: boolean;
  units: 'kg' | 'lbs';
  /** Desempenho da mesma série no último treino ("147,5 × 4"); aparece só na série atual. */
  previous?: string | null;
  onChange: (fields: Partial<SetState>) => void;
  onCycleType: () => void;
}

/** Cabeçalho das colunas da tabela de séries, na mesma grade do SetRow. */
export function SetRowHeader({ units }: { units: 'kg' | 'lbs' }) {
  return (
    <div className={cx(styles.grid, styles.head)} aria-hidden="true">
      <span>Série</span>
      <span>{units}</span>
      <span>Reps</span>
      <span>RPE</span>
      <span />
    </div>
  );
}

/**
 * Linha de uma série no treino ativo, em três estados: feita (valores como texto e check recuado),
 * atual (campos grandes, check dourado e o "Anterior") e pendente (campos discretos, editáveis).
 */
export function SetRow({ set, label, current, units, previous, onChange, onCycleType }: SetRowProps) {
  const done = set.completed;
  const state = done ? 'done' : current ? 'current' : 'pending';
  const name = set.type === 'N' ? `Série ${label}` : TYPE_NAME[set.type];
  // Carga com 6+ caracteres no campo ("1102,5") desce um degrau para caber em 360 px.
  const longWeight = String(set.weight).length > 5;

  return (
    <div role="group" aria-label={name} className={cx(styles.grid, styles.row, styles[state], set.type === 'W' && styles.warmup)}>
      <button
        type="button"
        className={cx(styles.type, set.type !== 'N' && styles.typeLetter)}
        onClick={onCycleType}
        aria-label={`${name}. Toque para trocar o tipo`}
        title="Tipo: Normal / Aquecimento / Drop"
      >
        {label}
      </button>

      {done ? (
        <>
          <span className={styles.value}>{formatCompact(set.weight)}</span>
          <span className={styles.value}>{set.reps}</span>
          <span className={cx(styles.value, styles.rpeValue)}>{set.rpe ? formatCompact(set.rpe) : ''}</span>
        </>
      ) : (
        <>
          <input
            type="number"
            inputMode="decimal"
            aria-label={`Carga em ${units}`}
            className={cx(styles.input, longWeight && styles.long)}
            value={set.weight || ''}
            onChange={(e) => onChange({ weight: Number(e.target.value) })}
            placeholder="0"
          />
          <input
            type="number"
            inputMode="numeric"
            aria-label="Repetições"
            className={styles.input}
            value={set.reps || ''}
            onChange={(e) => onChange({ reps: Number(e.target.value) })}
            placeholder="0"
          />
          <select
            aria-label="RPE"
            className={cx(styles.rpe, !set.rpe && styles.rpeEmpty)}
            value={set.rpe || ''}
            onChange={(e) => onChange({ rpe: e.target.value ? Number(e.target.value) : undefined })}
          >
            <option value="">Sem RPE</option>
            {RPE_OPTIONS.map((r) => <option key={r} value={r}>{formatCompact(r)}</option>)}
          </select>
        </>
      )}

      <button
        type="button"
        className={styles.check}
        onClick={() => onChange({ completed: !done })}
        aria-label={done ? 'Desmarcar série' : 'Concluir série'}
      >
        <Check size={current && !done ? 22 : 18} strokeWidth={3} aria-hidden="true" />
      </button>

      {state === 'current' && previous && (
        <span className={styles.previous}>Anterior {previous}</span>
      )}
    </div>
  );
}
