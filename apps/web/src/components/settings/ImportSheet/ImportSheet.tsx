import { Button, Sheet } from '../../../ui';
import { templatesLabel, workoutsLabel, type DataCounts } from '../../../utils/backup';
import styles from '../dataSheet.module.css';

export interface ImportSheetProps {
  fileName: string;
  incoming: DataCounts;
  current: DataCounts;
  onConfirm: () => void;
  onClose: () => void;
}

const summary = (c: DataCounts) => `${workoutsLabel(c.workouts)} e ${templatesLabel(c.templates)}`;

/** Confirmação de importar backup (#329): mostra o que está aqui e o que vem no arquivo. */
export function ImportSheet({ fileName, incoming, current, onConfirm, onClose }: ImportSheetProps) {
  return (
    <Sheet
      open
      onClose={onClose}
      title="Substituir os dados atuais?"
      actions={
        <>
          <Button variant="danger" block onClick={onConfirm}>Substituir dados</Button>
          <Button variant="link" block onClick={onClose}>Cancelar</Button>
        </>
      }
    >
      <div className={styles.body}>
        {/* tabIndex -1: o foco inicial cai no texto, e não direto no botão de substituir. */}
        <p className={styles.lead} tabIndex={-1}>
          Os treinos, as rotinas e as configurações deste aparelho são trocados pelos do arquivo.
        </p>
        <ul className={styles.list}>
          <li className={styles.stacked}>
            <span className={styles.caption}>Neste aparelho agora</span>
            <span className={styles.name}>{summary(current)}</span>
          </li>
          <li className={styles.stacked}>
            <span className={styles.caption}>No arquivo</span>
            <span className={styles.name}>{summary(incoming)}</span>
            <span className={styles.file}>{fileName}</span>
          </li>
        </ul>
      </div>
    </Sheet>
  );
}
