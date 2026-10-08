import { useState } from 'react';
import { Button, Sheet } from '../../../ui';
import type { FinishSummary } from '../../../utils/workoutSets';
import styles from './FinishSheet.module.css';

export interface FinishSheetProps {
  summary: FinishSummary;
  onFinish: () => void;
  /** Fecha a folha e leva à primeira série sem check. */
  onReview: () => void;
  onDiscard: () => void;
  onClose: () => void;
}

const series = (n: number) => (n === 1 ? '1 série' : `${n} séries`);

/**
 * Folha de finalizar (#340, #328). Diz quantas séries sem check ficam fora do histórico,
 * oferece revisar e guarda o descartar, que pede confirmação.
 */
export function FinishSheet({ summary, onFinish, onReview, onDiscard, onClose }: FinishSheetProps) {
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const { done, total, pending } = summary;
  const left = total - done;

  if (confirmDiscard) {
    return (
      <Sheet
        open
        onClose={onClose}
        title="Descartar treino?"
        actions={
          <>
            <Button variant="danger" block onClick={onDiscard}>Descartar treino</Button>
            <Button variant="link" block onClick={() => setConfirmDiscard(false)}>Voltar</Button>
          </>
        }
      >
        Tudo o que você registrou nesta sessão será perdido.
      </Sheet>
    );
  }

  const discard = (
    <Button variant="link" block className={styles.discard} onClick={() => setConfirmDiscard(true)}>
      Descartar treino
    </Button>
  );
  const back = <Button variant="link" block onClick={onClose}>Voltar</Button>;

  if (done === 0) {
    return (
      <Sheet
        open
        onClose={onClose}
        title="Nenhuma série com check"
        actions={
          <>
            <Button variant="primary" size="lg" block onClick={onReview}>Revisar séries</Button>
            {discard}
            {back}
          </>
        }
      >
        Só séries com check vão para o histórico. Finalizar agora descarta o treino.
      </Sheet>
    );
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title="Finalizar treino?"
      actions={
        <>
          <Button variant="primary" size="lg" block onClick={onFinish}>Finalizar treino</Button>
          {left > 0 && <Button variant="secondary" block onClick={onReview}>Revisar séries</Button>}
          {discard}
          {back}
        </>
      }
    >
      <div className={styles.body}>
        <p className={styles.line}>{total === 1 ? '1 de 1 série concluída.' : `${done} de ${total} séries concluídas.`}</p>
        {left > 0 && (
          <>
            <p className={styles.warning}>
              {left === 1 ? '1 série sem check não vai para o histórico:' : `${left} séries sem check não vão para o histórico:`}
            </p>
            <ul className={styles.list}>
              {pending.map((p, i) => (
                <li key={`${p.name}-${i}`} className={styles.item}>
                  <span className={styles.name}>{p.name}</span>
                  <span className={styles.count}>{`${series(p.count)} sem check`}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Sheet>
  );
}
