import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '../cx';
import styles from './IconButton.module.css';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> {
  /** Obrigatório: botão só de ícone precisa de nome para leitor de tela. */
  'aria-label': string;
  icon: ReactNode;
  variant?: 'filled' | 'plain';
}

export function IconButton({ icon, variant = 'filled', className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button type={type} className={cx(styles.iconButton, styles[variant], className)} {...rest}>
      <span className={styles.glyph} aria-hidden="true">{icon}</span>
    </button>
  );
}
