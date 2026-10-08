import SessionClock from '../../SessionClock';
import { Button, Segments } from '../../../ui';
import styles from './WorkoutHeader.module.css';

export interface WorkoutHeaderProps {
  name: string;
  startIso: string;
  done: number;
  total: number;
  onFinish: () => void;
}

/**
 * Cabeçalho do treino ativo (#340): nome, tempo em cinza, progresso em segmentos e "Finalizar"
 * neutro. A ação principal (dourada) é o "Finalizar treino" no fim da lista.
 */
export function WorkoutHeader({ name, startIso, done, total, onFinish }: WorkoutHeaderProps) {
  const progress = total === 1 ? `${done} de 1 série` : `${done} de ${total} séries`;
  return (
    <header className={styles.header}>
      <div className={styles.top}>
        <h1 className={styles.title}>{name}</h1>
        <Button variant="secondary" onClick={onFinish}>Finalizar</Button>
      </div>
      <p className={styles.meta}>
        {/* O SessionClock re-renderiza sozinho a cada segundo (#267). */}
        <span className={styles.clock}>
          <span className={styles.srOnly}>Tempo de treino </span>
          <SessionClock startIso={startIso} />
        </span>
        <span>{progress}</span>
      </p>
      <Segments total={total} filled={done} label={total === 1 ? `${done} de 1 série concluída` : `${progress} concluídas`} />
    </header>
  );
}
