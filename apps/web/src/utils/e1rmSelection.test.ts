import { describe, expect, it } from 'vitest';
import { buildE1rmSelectionFromAnchor, toggleE1rmSelection, type E1rmPlotPoint } from './e1rmSelection';

const point = (overrides: Partial<E1rmPlotPoint>): E1rmPlotPoint => ({
  sIdx: 0,
  short: 'Agach.',
  i: 0,
  v: 180,
  x: 100,
  y: 100,
  date: '2026-07-12',
  ...overrides,
});

describe('buildE1rmSelectionFromAnchor', () => {
  it('agrupa lifts próximos e mantém no máximo um ponto por lift', () => {
    const anchor = point({ sIdx: 0, short: 'Agach.', i: 1, v: 185, x: 100, y: 100 });
    const points: E1rmPlotPoint[] = [
      anchor,
      point({ sIdx: 1, short: 'Supino', i: 4, v: 122, x: 110, y: 102 }),
      point({ sIdx: 1, short: 'Supino', i: 6, v: 125, x: 112, y: 104 }),
      point({ sIdx: 2, short: 'Terra', i: 3, v: 220, x: 107, y: 97 }),
    ];

    const selection = buildE1rmSelectionFromAnchor(anchor, points, 14);

    expect(selection.items).toHaveLength(3);
    expect(selection.items.map((item) => item.sIdx)).toEqual([0, 1, 2]);
    expect(selection.items.find((item) => item.sIdx === 1)?.i).toBe(4);
    expect(selection.signature).toBe('0:1|1:4|2:3');
  });

  it('não inclui lifts fora do limiar de proximidade', () => {
    const anchor = point({ sIdx: 2, short: 'Terra', i: 2, v: 230, x: 100, y: 100 });
    const points: E1rmPlotPoint[] = [
      anchor,
      point({ sIdx: 0, short: 'Agach.', i: 3, v: 190, x: 120, y: 120 }),
      point({ sIdx: 1, short: 'Supino', i: 1, v: 128, x: 101, y: 112 }),
    ];

    const selection = buildE1rmSelectionFromAnchor(anchor, points, 14);

    expect(selection.items).toHaveLength(2);
    expect(selection.items.map((item) => item.sIdx)).toEqual([1, 2]);
  });
});

describe('toggleE1rmSelection', () => {
  it('fecha seleção quando o mesmo lote é tocado novamente', () => {
    const base = {
      anchorDate: '2026-07-12',
      signature: '0:1|1:4',
      items: [
        { sIdx: 0, short: 'Agach.', i: 1, v: 185, date: '2026-07-12' },
        { sIdx: 1, short: 'Supino', i: 4, v: 122, date: '2026-07-12' },
      ],
    };

    expect(toggleE1rmSelection(base, base)).toBeNull();
  });

  it('substitui a seleção quando o lote é diferente', () => {
    const previous = {
      anchorDate: '2026-07-12',
      signature: '0:1|1:4',
      items: [{ sIdx: 0, short: 'Agach.', i: 1, v: 185, date: '2026-07-12' }],
    };
    const next = {
      anchorDate: '2026-07-13',
      signature: '0:2|2:3',
      items: [{ sIdx: 2, short: 'Terra', i: 3, v: 225, date: '2026-07-13' }],
    };

    expect(toggleE1rmSelection(previous, next)).toEqual(next);
  });
});
