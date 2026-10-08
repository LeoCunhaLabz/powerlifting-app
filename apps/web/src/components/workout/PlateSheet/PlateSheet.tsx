import type { SetState } from '@powerlifting/shared';
import { Button, Sheet } from '../../../ui';
import { formatCompact } from '../../../utils/format';
import PlateVisualizer from '../../PlateVisualizer';
import styles from './PlateSheet.module.css';

const STEP = 2.5;

export interface PlateSheetProps {
  exerciseName: string;
  /** Série que recebe a carga (a próxima pendente do exercício); null quando todas já foram feitas. */
  target: { type: SetState['type']; label: string } | null;
  weight: number;
  onWeightChange: (weight: number) => void;
  barWeight: number;
  plates: number[];
  units: 'kg' | 'lbs';
  onApply: () => void;
  onClose: () => void;
}

function targetName(target: NonNullable<PlateSheetProps['target']>): { of: string; apply: string } {
  if (target.type === 'W') return { of: 'aquecimento', apply: 'Usar no aquecimento' };
  if (target.type === 'D') return { of: 'drop set', apply: 'Usar no drop set' };
  return { of: `série ${target.label}`, apply: `Usar na série ${target.label}` };
}

/** Calculadora de anilhas do exercício, aberta pelo botão "Anilhas" do cabeçalho (#339). */
export function PlateSheet({
  exerciseName, target, weight, onWeightChange, barWeight, plates, units, onApply, onClose,
}: PlateSheetProps) {
  const name = target ? targetName(target) : null;
  return (
    <Sheet
      open
      onClose={onClose}
      title="Anilhas"
      actions={name ? (
        <>
          <Button variant="primary" size="lg" block onClick={onApply}>{name.apply}</Button>
          <Button variant="link" block onClick={onClose}>Fechar</Button>
        </>
      ) : (
        <Button variant="secondary" block onClick={onClose}>Fechar</Button>
      )}
    >
      <p className={styles.context}>
        {name ? `${exerciseName}, ${name.of}` : `${exerciseName}: todas as séries já foram feitas`}
      </p>
      <div className={styles.adjust}>
        <Button
          variant="secondary"
          className={styles.step}
          aria-label={`Tirar ${formatCompact(STEP)} ${units}`}
          onClick={() => onWeightChange(Math.max(barWeight, weight - STEP))}
        >
          −{formatCompact(STEP)}
        </Button>
        <output className={styles.weight} aria-live="polite">
          {formatCompact(weight)} <span className={styles.unit}>{units}</span>
        </output>
        <Button
          variant="secondary"
          className={styles.step}
          aria-label={`Somar ${formatCompact(STEP)} ${units}`}
          onClick={() => onWeightChange(weight + STEP)}
        >
          +{formatCompact(STEP)}
        </Button>
      </div>
      <PlateVisualizer weight={weight} barWeight={barWeight} availablePlates={plates} units={units} showTotal={false} />
    </Sheet>
  );
}
