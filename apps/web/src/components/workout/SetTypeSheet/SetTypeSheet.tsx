import { useState } from 'react';
import type { SetState } from '@powerlifting/shared';
import { Trash2 } from 'lucide-react';
import { Button, SegmentedControl, Sheet } from '../../../ui';
import { formatCompact } from '../../../utils/format';
import styles from './SetTypeSheet.module.css';

const TYPE_OPTIONS = [
  { value: 'N', label: 'Normal' },
  { value: 'W', label: 'Aquecimento' },
  { value: 'D', label: 'Drop set' },
] as const;

export interface SetTypeSheetProps {
  exerciseName: string;
  set: SetState;
  /** "3", "Aq" ou "D" (ver setLabel em utils/workoutSets). */
  label: string;
  units: 'kg' | 'lbs';
  /** false quando é a única série do exercício. */
  canRemove: boolean;
  onChangeType: (type: SetState['type']) => void;
  onRemove: () => void;
  onClose: () => void;
}

function setName(set: SetState, label: string): string {
  if (set.type === 'W') return 'aquecimento';
  if (set.type === 'D') return 'drop set';
  return `série ${label}`;
}

/**
 * Folha do número da série (#340): escolher o tipo pelo nome, em português, e remover esta série.
 * Série já concluída só sai depois de confirmar.
 */
export function SetTypeSheet({ exerciseName, set, label, units, canRemove, onChangeType, onRemove, onClose }: SetTypeSheetProps) {
  const [confirming, setConfirming] = useState(false);
  const remove = () => {
    onRemove();
    onClose();
  };

  if (confirming) {
    return (
      <Sheet
        open
        onClose={onClose}
        title="Remover esta série?"
        actions={
          <>
            <Button variant="danger" block onClick={remove}>Remover série</Button>
            <Button variant="link" block onClick={() => setConfirming(false)}>Voltar</Button>
          </>
        }
      >
        {`Ela já tem check (${formatCompact(set.weight)} ${units} × ${set.reps}) e sai deste treino.`}
      </Sheet>
    );
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title="Tipo da série"
      actions={
        <>
          <Button
            variant="secondary"
            block
            icon={<Trash2 size={16} />}
            disabled={!canRemove}
            onClick={() => (set.completed ? setConfirming(true) : remove())}
          >
            Remover esta série
          </Button>
          <Button variant="link" block onClick={onClose}>Fechar</Button>
        </>
      }
    >
      <div className={styles.body}>
        <p className={styles.context}>{`${exerciseName}, ${setName(set, label)}`}</p>
        <SegmentedControl
          label="Tipo da série"
          options={TYPE_OPTIONS}
          value={set.type}
          onChange={(type) => {
            onChangeType(type);
            onClose();
          }}
        />
        {!canRemove && <p className={styles.hint}>É a única série. Para tirá-la, remova o exercício no menu de opções.</p>}
      </div>
    </Sheet>
  );
}
