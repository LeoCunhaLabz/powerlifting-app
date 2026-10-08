import { useState } from 'react';
import { ChevronRight, Pencil, RotateCcw } from 'lucide-react';
import type { WorkoutSession, WorkoutTemplate } from '@powerlifting/shared';
import { Button, Sheet } from '../../../ui';
import { SessionDetail } from '../../SessionDetail';
import styles from './SessionSheet.module.css';

export interface SessionSheetProps {
  session: WorkoutSession;
  /** "Terça, 52 min, 14,2 t". */
  meta: string;
  templates: WorkoutTemplate[];
  units: 'kg' | 'lbs';
  hasActiveWorkout: boolean;
  onRepeat: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpenHistory: () => void;
  onClose: () => void;
}

/**
 * Detalhe de um treino do histórico no Início (#343). Repetir só pede confirmação quando
 * descarta um treino em andamento; excluir sempre pede.
 */
export function SessionSheet({
  session, meta, templates, units, hasActiveWorkout, onRepeat, onEdit, onDelete, onOpenHistory, onClose,
}: SessionSheetProps) {
  const [confirm, setConfirm] = useState<'repeat' | 'delete' | null>(null);
  const back = <Button variant="link" block onClick={() => setConfirm(null)}>Voltar</Button>;

  if (confirm === 'repeat') {
    return (
      <Sheet
        open
        onClose={onClose}
        title="Descartar o treino atual?"
        actions={<><Button variant="danger" block onClick={onRepeat}>Descartar e repetir</Button>{back}</>}
      >
        Há um treino em andamento. Repetir {session.name} descarta o que você registrou nele.
      </Sheet>
    );
  }

  if (confirm === 'delete') {
    return (
      <Sheet
        open
        onClose={onClose}
        title="Excluir treino?"
        actions={<><Button variant="danger" block onClick={onDelete}>Excluir treino</Button>{back}</>}
      >
        {session.name} sai do histórico e os recordes são recalculados.
      </Sheet>
    );
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={session.name}
      actions={
        <>
          <div className={styles.row}>
            <Button
              variant="secondary"
              block
              icon={<RotateCcw size={16} />}
              onClick={() => (hasActiveWorkout ? setConfirm('repeat') : onRepeat())}
            >
              Repetir
            </Button>
            <Button variant="secondary" block icon={<Pencil size={16} />} onClick={onEdit}>Editar</Button>
          </div>
          <Button variant="link" block className={styles.delete} onClick={() => setConfirm('delete')}>Excluir treino</Button>
          <Button variant="link" block onClick={onOpenHistory}>
            Ver histórico completo <ChevronRight size={16} aria-hidden="true" />
          </Button>
        </>
      }
    >
      <p className={styles.meta}>{meta}</p>
      <SessionDetail session={session} templates={templates} units={units} />
    </Sheet>
  );
}
