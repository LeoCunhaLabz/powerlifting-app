import { useId } from 'react';
import { Minus, Plus } from 'lucide-react';
import { IconButton } from '../../ui';
import { clampRestSeconds, formatClock } from '../../utils/restTimer';
import styles from './RestDefaultSetting.module.css';

const STEP = 15;

export interface RestDefaultSettingProps {
  seconds: number;
  onChange: (seconds: number) => void;
}

/** Duração padrão do descanso (#342): de 30 s a 10 min, em passos de 15 s. Salva só no aparelho. */
export function RestDefaultSetting({ seconds, onChange }: RestDefaultSettingProps) {
  const id = useId();
  const value = clampRestSeconds(seconds);
  return (
    <div className={styles.row}>
      <div className={styles.info}>
        <span id={id} className={styles.label}>Descanso padrão</span>
        <span className={styles.hint}>Vale quando a rotina não define o descanso do exercício.</span>
      </div>
      <div className={styles.stepper} role="group" aria-labelledby={id}>
        <IconButton
          aria-label="Diminuir 15 segundos"
          icon={<Minus size={18} />}
          disabled={value <= 30}
          onClick={() => onChange(clampRestSeconds(value - STEP))}
        />
        <output className={styles.value} aria-live="polite">{formatClock(value)}</output>
        <IconButton
          aria-label="Aumentar 15 segundos"
          icon={<Plus size={18} />}
          disabled={value >= 600}
          onClick={() => onChange(clampRestSeconds(value + STEP))}
        />
      </div>
    </div>
  );
}
