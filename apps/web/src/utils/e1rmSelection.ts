export interface E1rmPlotPoint {
  sIdx: number;
  short: string;
  i: number;
  v: number;
  x: number;
  y: number;
  date: string;
}

export interface E1rmTooltipItem {
  sIdx: number;
  short: string;
  i: number;
  v: number;
  date: string;
}

export interface E1rmSelection {
  anchorDate: string;
  signature: string;
  items: E1rmTooltipItem[];
}

export const buildE1rmSelectionFromAnchor = (
  anchor: E1rmPlotPoint,
  points: E1rmPlotPoint[],
  thresholdPx = 14,
): E1rmSelection => {
  const thresholdSq = thresholdPx * thresholdPx;
  const perLift = new Map<number, { item: E1rmTooltipItem; distance: number }>();

  points.forEach((point) => {
    const dx = point.x - anchor.x;
    const dy = point.y - anchor.y;
    const distance = dx * dx + dy * dy;
    if (distance > thresholdSq) return;

    const current = perLift.get(point.sIdx);
    if (!current || distance < current.distance) {
      perLift.set(point.sIdx, {
        item: {
          sIdx: point.sIdx,
          short: point.short,
          i: point.i,
          v: point.v,
          date: point.date,
        },
        distance,
      });
    }
  });

  const items = Array.from(perLift.values())
    .map((entry) => entry.item)
    .sort((a, b) => a.sIdx - b.sIdx);

  return {
    anchorDate: anchor.date,
    signature: items.map((item) => `${item.sIdx}:${item.i}`).join('|'),
    items,
  };
};

export const toggleE1rmSelection = (
  previous: E1rmSelection | null,
  next: E1rmSelection,
): E1rmSelection | null => (previous?.signature === next.signature ? null : next);
