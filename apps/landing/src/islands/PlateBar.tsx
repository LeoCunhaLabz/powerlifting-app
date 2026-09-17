import type { PlateCalculationResult } from '@onyx/calc';
import { getPlateStyle } from '../data/plates';
import { formatKg } from '../lib/format';

const MAX_PLATE_HEIGHT = 92;
const MAX_PLATE_WIDTH = 18;

interface PlateBarProps {
  plates: PlateCalculationResult[];
  /** Escala do desenho (1 = página da calculadora; menor nos cards da home). */
  scale?: number;
}

/** Barra vista de lado: manga → presilha → anilhas de um lado (cores IPF). */
export default function PlateBar({ plates, scale = 1 }: PlateBarProps) {
  const items: number[] = [];
  for (const p of plates) {
    for (let i = 0; i < p.count; i++) items.push(p.plateWeight);
  }

  return (
    <div className="bar" role="img" aria-label={plates.length ? `Anilhas por lado: ${plates.map((p) => `${p.count}× ${formatKg(p.plateWeight)} kg`).join(', ')}` : 'Barra vazia'}>
      <div className="bar__sleeve" style={{ width: 42 * scale }} />
      <div className="bar__collar" style={{ width: 12 * scale, height: 22 * scale }} />
      {items.length === 0 && <span className="bar__empty">Só a barra</span>}
      {items.map((weight, i) => {
        const st = getPlateStyle(weight);
        return (
          <div
            key={`${weight}-${i}`}
            className={`bar__plate bar__plate--${st.label}`}
            style={{
              background: st.color,
              height: Math.round(MAX_PLATE_HEIGHT * st.height * scale),
              width: Math.max(6, Math.round(MAX_PLATE_WIDTH * st.width * scale)),
            }}
          >
            {weight >= 5 && scale >= 0.9 ? formatKg(weight) : ''}
          </div>
        );
      })}
      <div className="bar__sleeve" style={{ width: 30 * scale }} />
    </div>
  );
}
