import { useRef } from 'react';
import { trackCalculatorUse, type PublicCalculator } from '../lib/analytics';

/** Dispara o evento `calculadora-publica` uma única vez, na primeira edição real. */
export function useFirstUse(tipo: PublicCalculator): () => void {
  const fired = useRef(false);
  return () => {
    if (fired.current) return;
    fired.current = true;
    trackCalculatorUse(tipo);
  };
}
