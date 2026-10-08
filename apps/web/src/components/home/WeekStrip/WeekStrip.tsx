import { cx } from '../../../ui/cx';
import styles from './WeekStrip.module.css';

const LETTERS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
const NAMES = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export interface WeekStripProps {
  /** Segunda a domingo: treinou no dia. */
  days: boolean[];
  /** 0 = segunda. */
  todayIdx: number;
}

/** Os sete dias da semana: treinado em branco, hoje em dourado (spec 2026-10-06 §2). */
export function WeekStrip({ days, todayIdx }: WeekStripProps) {
  return (
    <ol className={styles.strip} aria-label="Dias desta semana">
      {LETTERS.map((letter, i) => {
        const trained = days[i] ?? false;
        const today = i === todayIdx;
        const status = [today && 'hoje', trained && 'treinou'].filter(Boolean).join(', ');
        return (
          <li
            key={i}
            className={cx(styles.day, trained && styles.trained, today && styles.today)}
            aria-label={status ? `${NAMES[i]}, ${status}` : NAMES[i]}
          >
            <span aria-hidden="true">{letter}</span>
          </li>
        );
      })}
    </ol>
  );
}
