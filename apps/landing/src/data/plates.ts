/**
 * Aparência das anilhas na visualização da barra (cores oficiais IPF em kg).
 * Espelha apps/web/src/components/PlateVisualizer.tsx, em proporções para a landing.
 */

export interface PlateStyle {
  /** Variável CSS da cor (definida em tokens.css). */
  color: string;
  /** Altura relativa (0–1) em relação à anilha de 25 kg. */
  height: number;
  /** Largura relativa (0–1) em relação à anilha de 25 kg. */
  width: number;
  /** Cor do rótulo em cima da anilha. */
  label: 'dark' | 'light';
}

export const BAR_WEIGHTS_KG = [20, 15] as const;

export function getPlateStyle(plateWeight: number): PlateStyle {
  switch (plateWeight) {
    case 25:
      return { color: 'var(--plate-25)', height: 1, width: 1, label: 'light' };
    case 20:
      return { color: 'var(--plate-20)', height: 0.94, width: 0.9, label: 'light' };
    case 15:
      return { color: 'var(--plate-15)', height: 0.86, width: 0.85, label: 'dark' };
    case 10:
      return { color: 'var(--plate-10)', height: 0.78, width: 0.8, label: 'light' };
    case 5:
      return { color: 'var(--plate-5)', height: 0.64, width: 0.7, label: 'dark' };
    case 2.5:
      return { color: 'var(--plate-2-5)', height: 0.52, width: 0.6, label: 'light' };
    default:
      // 1,25 / 0,5 / 0,25 kg — fracionárias em cinza
      return { color: 'var(--plate-frac)', height: 0.42, width: 0.5, label: 'light' };
  }
}
