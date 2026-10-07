import { createContext, useContext, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../cx';
import styles from './Block.module.css';

const InsideBlock = createContext(false);

export interface BlockProps extends HTMLAttributes<HTMLElement> {
  /** Rótulo do cabeçalho, à esquerda. */
  label?: ReactNode;
  /** Meta ou ação à direita do cabeçalho. */
  aside?: ReactNode;
}

/** Bloco de superfície. Nunca dentro de outro Block: use ListRow ou divisória. */
export function Block({ label, aside, className, children, ...rest }: BlockProps) {
  const nested = useContext(InsideBlock);
  if (nested && import.meta.env.DEV) {
    console.error('ONYX: Block dentro de Block. Use ListRow ou uma divisória no lugar.');
  }
  return (
    <InsideBlock.Provider value={true}>
      <section className={cx(styles.block, className)} {...rest}>
        {(label || aside) && (
          <header className={styles.header}>
            {label && <span className={styles.label}>{label}</span>}
            {aside && <span className={styles.aside}>{aside}</span>}
          </header>
        )}
        {children}
      </section>
    </InsideBlock.Provider>
  );
}
