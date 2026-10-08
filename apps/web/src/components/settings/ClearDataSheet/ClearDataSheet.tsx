import { useState } from 'react';
import { Check, Download } from 'lucide-react';
import { Button, Field, Sheet } from '../../../ui';
import { CLEAR_CONFIRMATION, confirmsClear, type DataCounts } from '../../../utils/backup';
import { formatCompact } from '../../../utils/format';
import styles from '../dataSheet.module.css';

export interface ClearDataSheetProps {
  counts: DataCounts;
  hasActiveWorkout: boolean;
  onExport: () => void;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Folha de "Limpar todos os dados" (#329). Diz o que some na conta e o que some só aqui,
 * oferece exportar antes e só libera o botão com a palavra digitada.
 */
export function ClearDataSheet({ counts, hasActiveWorkout, onExport, onConfirm, onClose }: ClearDataSheetProps) {
  const [typed, setTyped] = useState('');
  const [exported, setExported] = useState(false);
  const confirmed = confirmsClear(typed);

  const account = [
    { label: 'Treinos e recordes', value: counts.workouts },
    { label: 'Rotinas que você criou', value: counts.templates },
    { label: 'Programas', value: counts.programs },
    { label: 'Exercícios personalizados', value: counts.customExercises },
  ];

  return (
    <Sheet
      open
      onClose={onClose}
      title="Apagar todos os dados?"
      actions={
        <>
          <Button variant="danger" block disabled={!confirmed} onClick={onConfirm}>Apagar tudo</Button>
          <Button
            variant="secondary"
            block
            icon={exported ? <Check size={16} /> : <Download size={16} />}
            onClick={() => {
              onExport();
              setExported(true);
            }}
          >
            {exported ? 'Backup exportado' : 'Exportar antes'}
          </Button>
          <Button variant="link" block onClick={onClose}>Cancelar</Button>
        </>
      }
    >
      <div className={styles.body}>
        {/* tabIndex -1: o foco inicial da folha cai aqui, e não no campo (o teclado cobriria a lista). */}
        <p className={styles.lead} tabIndex={-1}>Some deste aparelho e da sua conta:</p>
        <ul className={styles.list}>
          {account.map((row) => (
            <li key={row.label} className={styles.item}>
              <span className={styles.name}>{row.label}</span>
              <span className={styles.count}>{formatCompact(row.value, 0)}</span>
            </li>
          ))}
        </ul>

        <p className={styles.line}>Some só deste aparelho:</p>
        <ul className={styles.list}>
          <li className={styles.item}>
            <span className={styles.name}>Registros de peso corporal</span>
            <span className={styles.count}>{formatCompact(counts.bodyweight, 0)}</span>
          </li>
          {hasActiveWorkout && (
            <li className={styles.item}>
              <span className={styles.name}>Treino em andamento</span>
            </li>
          )}
        </ul>

        <p className={styles.line}>Suas configurações e a conta continuam.</p>

        <Field
          label={`Para confirmar, digite ${CLEAR_CONFIRMATION}`}
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="done"
          className={styles.field}
        />
      </div>
    </Sheet>
  );
}
