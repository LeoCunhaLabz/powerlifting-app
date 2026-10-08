import { useEffect, useRef, useState } from 'react';
import type { ExerciseState, SetState } from '@powerlifting/shared';
import { MessageSquare, MoreVertical, Plus, Trash2 } from 'lucide-react';
import { Block, Button, IconButton, Sheet } from '../../../ui';
import { formatCompact } from '../../../utils/format';
import { TYPE_CYCLE } from '../../../utils/setTypeCycle';
import { setLabel } from '../../../utils/workoutSets';
import { SetRow, SetRowHeader } from '../SetRow/SetRow';
import styles from './ExerciseCard.module.css';

export interface ExerciseCardProps {
  exercise: ExerciseState;
  units: 'kg' | 'lbs';
  /** Maior e1RM do histórico (0 = sem registro). */
  e1rm: number;
  /** Índice da série atual do treino neste exercício; -1 quando ela está em outro exercício. */
  currentSetIdx: number;
  /** Desempenho da mesma série no último treino ("147,5 × 4"). */
  previousFor: (setIdx: number) => string | null;
  onUpdateSet: (setIdx: number, fields: Partial<SetState>) => void;
  onAddSet: () => void;
  onRemoveLastSet: () => void;
  onNotesChange: (notes: string) => void;
  onRemove: () => void;
  onOpenPlates: () => void;
}

function subtitle(exercise: ExerciseState, e1rm: number, u: string): string {
  if (!e1rm) return 'Sem e1RM registrado';
  const ws = exercise.sets.find((s) => s.type !== 'W');
  const target = ws?.percentage ? Math.round((e1rm * ws.percentage) / 100 / 2.5) * 2.5 : null;
  const e1rmText = `e1RM ${formatCompact(e1rm, 1)} ${u}`;
  return target ? `Alvo ${formatCompact(target)} ${u} · ${e1rmText}` : e1rmText;
}

/** Card de um exercício no treino ativo: cabeçalho com Anilhas e opções, tabela de séries e ações. */
export function ExerciseCard({
  exercise, units, e1rm, currentSetIdx, previousFor,
  onUpdateSet, onAddSet, onRemoveLastSet, onNotesChange, onRemove, onOpenPlates,
}: ExerciseCardProps) {
  const [menu, setMenu] = useState<'options' | 'remove' | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const focusNotes = useRef(false);

  // Foca a nota depois que a folha fecha (o <dialog> devolve o foco ao botão de opções antes).
  useEffect(() => {
    if (focusNotes.current && notesRef.current) {
      focusNotes.current = false;
      notesRef.current.focus();
    }
  });

  const showNotes = notesOpen || !!exercise.notes;
  const setCount = exercise.sets.length;

  return (
    <Block>
      <div className={styles.head}>
        <div className={styles.titles}>
          <h2 className={styles.name}>{exercise.name}</h2>
          <p className={styles.sub}>{subtitle(exercise, e1rm, units)}</p>
        </div>
        <div className={styles.tools}>
          <Button variant="secondary" onClick={onOpenPlates}>Anilhas</Button>
          <IconButton
            variant="plain"
            aria-label={`Opções de ${exercise.name}`}
            icon={<MoreVertical size={20} />}
            onClick={() => setMenu('options')}
          />
        </div>
      </div>

      {showNotes && (
        <textarea
          ref={notesRef}
          className={styles.notes}
          aria-label={`Notas de ${exercise.name}`}
          placeholder="Técnica, sensação, ajustes"
          value={exercise.notes || ''}
          onChange={(e) => onNotesChange(e.target.value)}
          onBlur={(e) => { if (!e.target.value.trim()) setNotesOpen(false); }}
        />
      )}

      <div className={styles.sets}>
        <SetRowHeader units={units} />
        {exercise.sets.map((set, setIdx) => (
          <SetRow
            key={set.id}
            set={set}
            label={setLabel(exercise.sets, setIdx)}
            current={setIdx === currentSetIdx}
            units={units}
            previous={setIdx === currentSetIdx ? previousFor(setIdx) : null}
            onChange={(fields) => onUpdateSet(setIdx, fields)}
            onCycleType={() => onUpdateSet(setIdx, { type: TYPE_CYCLE[set.type] })}
          />
        ))}
      </div>

      <div className={styles.actions}>
        <Button variant="secondary" className={styles.addSet} icon={<Plus size={16} />} onClick={onAddSet}>
          Adicionar série
        </Button>
        <Button variant="link" className={styles.removeSet} onClick={onRemoveLastSet} disabled={setCount <= 1}>
          Remover
        </Button>
      </div>

      <Sheet
        open={menu !== null}
        onClose={() => setMenu(null)}
        title={menu === 'remove' ? `Remover ${exercise.name}?` : exercise.name}
        actions={menu === 'remove' ? (
          <>
            <Button variant="danger" block onClick={() => { setMenu(null); onRemove(); }}>Remover exercício</Button>
            <Button variant="link" block onClick={() => setMenu(null)}>Voltar</Button>
          </>
        ) : (
          <Button variant="link" block onClick={() => setMenu(null)}>Fechar</Button>
        )}
      >
        {menu === 'remove' ? (
          `O exercício e ${setCount === 1 ? 'a série dele saem' : `as ${setCount} séries dele saem`} deste treino.`
        ) : (
          <div className={styles.menu}>
            <Button
              variant="secondary"
              block
              icon={<MessageSquare size={16} />}
              onClick={() => { focusNotes.current = true; setNotesOpen(true); setMenu(null); }}
            >
              Notas do exercício
            </Button>
            <Button variant="secondary" block icon={<Trash2 size={16} />} onClick={() => setMenu('remove')}>
              Remover exercício
            </Button>
          </div>
        )}
      </Sheet>
    </Block>
  );
}
