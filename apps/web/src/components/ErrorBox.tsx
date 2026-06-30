import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Caixa de erro padronizada do app: ícone + mensagem centralizados horizontalmente.
 * Centraliza a exibição de erros em todas as telas (Auth, Configurações, etc.).
 */
export const ErrorBox: React.FC<{ children: string; style?: React.CSSProperties }> = ({ children, style }) => (
  <div role="alert" style={{ ...boxStyle, ...style }}>
    <AlertTriangle size={16} style={{ flexShrink: 0 }} />
    <span>{children}</span>
  </div>
);

const boxStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  textAlign: 'center',
  background: 'rgba(229, 84, 75, 0.12)',
  border: '1px solid rgba(229, 84, 75, 0.35)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--error)',
  fontSize: '13px',
  fontWeight: 500,
  padding: '10px 14px',
};

export default ErrorBox;
