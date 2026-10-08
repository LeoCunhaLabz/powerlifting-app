import { useState } from 'react';
import { Button, Field, Sheet } from '../../../ui';
import { parseDecimal } from '../../../utils/format';

export interface WeightSheetProps {
  unit: string;
  onSave: (weight: number) => void;
  onClose: () => void;
}

/** Registrar o peso de hoje (#343, #334): campo de 16 px, vírgula ou ponto. */
export function WeightSheet({ unit, onSave, onClose }: WeightSheetProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string>();

  const save = () => {
    const value = parseDecimal(text);
    if (!(value > 0)) {
      setError(`Informe o peso em ${unit}, por exemplo 82,5.`);
      return;
    }
    onSave(value);
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title="Registrar peso"
      actions={
        <>
          <Button variant="primary" size="lg" block onClick={save}>Registrar</Button>
          <Button variant="link" block onClick={onClose}>Cancelar</Button>
        </>
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <Field
          label={`Peso de hoje (${unit})`}
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          value={text}
          error={error}
          onChange={(event) => {
            setText(event.target.value);
            setError(undefined);
          }}
        />
      </form>
    </Sheet>
  );
}
