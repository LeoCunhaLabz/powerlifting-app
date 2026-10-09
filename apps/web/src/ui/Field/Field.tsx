import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cx } from '../cx';
import styles from './Field.module.css';

export interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Rótulo sempre presente (placeholder nunca faz papel de rótulo). */
  label: string;
  error?: string;
  hint?: string;
  /** `set` = campo numérico grande da série atual. */
  variant?: 'default' | 'set';
  /** Esconde o rótulo visualmente, mantendo para leitor de tela (ex.: colunas da tabela de séries). */
  hideLabel?: boolean;
  /** Controle dentro do campo, à direita (ex.: IconButton de mostrar a senha). */
  trailing?: ReactNode;
}

/** Campo com rótulo acima e erro abaixo. */
export function Field({ label, error, hint, variant = 'default', hideLabel = false, trailing, id, className, ...rest }: FieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const messageId = `${inputId}-msg`;
  const message = error ?? hint;
  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={inputId} className={cx(styles.label, hideLabel && styles.srOnly)}>{label}</label>
      {trailing ? (
        <div className={styles.control}>
          <input
            id={inputId}
            className={cx(styles.input, styles.withTrailing, error && styles.invalid)}
            aria-invalid={error ? true : undefined}
            aria-describedby={message ? messageId : undefined}
            {...rest}
          />
          <span className={styles.trailing}>{trailing}</span>
        </div>
      ) : (
        <input
          id={inputId}
          className={cx(styles.input, variant === 'set' && styles.set, error && styles.invalid)}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          {...rest}
        />
      )}
      {message && <span id={messageId} className={cx(styles.message, error && styles.error)}>{message}</span>}
    </div>
  );
}
