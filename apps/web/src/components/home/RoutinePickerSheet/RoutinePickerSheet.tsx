import { ChevronRight } from 'lucide-react';
import type { WorkoutTemplate } from '@powerlifting/shared';
import { Button, Sheet } from '../../../ui';
import { templateMeta } from '../../../utils/home';
import styles from './RoutinePickerSheet.module.css';

export interface RoutinePickerSheetProps {
  templates: WorkoutTemplate[];
  onPick: (templateId: string) => void;
  onClose: () => void;
}

/** "Usar uma rotina pronta" (#336): as rotinas que vêm com o app, com o que cada uma faz. */
export function RoutinePickerSheet({ templates, onPick, onClose }: RoutinePickerSheetProps) {
  return (
    <Sheet
      open
      onClose={onClose}
      title="Rotinas prontas"
      actions={<Button variant="link" block onClick={onClose}>Voltar</Button>}
    >
      <ul className={styles.list}>
        {templates.map((t) => (
          <li key={t.id}>
            <button type="button" className={styles.row} onClick={() => onPick(t.id)}>
              <span className={styles.texts}>
                <span className={styles.name}>{t.name}</span>
                <span className={styles.meta}>{templateMeta(t)}</span>
                {t.description && <span className={styles.description}>{t.description}</span>}
              </span>
              <ChevronRight size={18} className={styles.chevron} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
