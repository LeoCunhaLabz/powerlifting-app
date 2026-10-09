import { useState } from 'react';
import { Button, Field, Sheet } from '../../../ui';
import { parseDecimal } from '../../../utils/format';
import { parseMaxes } from '../../../utils/templateStart';
import styles from './MaxesSheet.module.css';

export interface MaxesSheetProps {
  /** Exercícios por %1RM sem máximo estimado. */
  names: string[];
  unit: string;
  /** Máximos válidos, por nome sem caixa. */
  onConfirm: (maxes: Record<string, number>) => void;
  /** "Não sei": começa com as cargas desses exercícios em branco. */
  onSkip: () => void;
  onClose: () => void;
}

/**
 * "Quanto você levanta hoje?" (#336): a rotina calcula a carga por %1RM e o app ainda não
 * sabe o máximo destes exercícios. O que a pessoa digita só calcula este treino.
 */
export function MaxesSheet({ names, unit, onConfirm, onSkip, onClose }: MaxesSheetProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const maxes = parseMaxes(values, parseDecimal);
  const invalid = (name: string) => {
    const text = values[name]?.trim();
    return !!text && !(parseDecimal(text) > 0);
  };
  const anyInvalid = names.some(invalid);

  const confirm = () => {
    setSubmitted(true);
    if (anyInvalid || Object.keys(maxes).length === 0) return;
    onConfirm(maxes);
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title="Quanto você levanta hoje?"
      actions={
        <>
          <Button variant="primary" size="lg" block onClick={confirm}>Começar o treino</Button>
          <Button variant="link" block onClick={onSkip}>Não sei, vou digitar as cargas</Button>
        </>
      }
    >
      <form
        className={styles.body}
        onSubmit={(event) => {
          event.preventDefault();
          confirm();
        }}
        noValidate
      >
        {/* tabIndex -1: o foco inicial cai na explicação, e não no primeiro campo (o teclado a cobriria). */}
        <p className={styles.lead} tabIndex={-1}>
          A rotina calcula as cargas pelo seu máximo de 1 repetição. Uma estimativa serve: depois deste treino, o app usa o que você registrar.
        </p>
        {names.map((name) => (
          <Field
            key={name}
            label={`${name} (${unit})`}
            inputMode="decimal"
            autoComplete="off"
            enterKeyHint="next"
            value={values[name] ?? ''}
            onChange={(event) => setValues((v) => ({ ...v, [name]: event.target.value }))}
            error={invalid(name) ? 'Digite só o número, por exemplo 120 ou 102,5.' : undefined}
          />
        ))}
        {submitted && !anyInvalid && Object.keys(maxes).length === 0 && (
          <p role="alert" className={styles.error}>Informe ao menos um máximo, ou toque em "Não sei".</p>
        )}
      </form>
    </Sheet>
  );
}
