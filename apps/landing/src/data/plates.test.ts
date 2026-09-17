import { describe, it, expect } from 'vitest';
import { getPlateStyle } from './plates';

describe('getPlateStyle', () => {
  it('mapeia as anilhas IPF para as cores oficiais', () => {
    expect(getPlateStyle(25).color).toBe('var(--plate-25)');
    expect(getPlateStyle(20).color).toBe('var(--plate-20)');
    expect(getPlateStyle(15).color).toBe('var(--plate-15)');
    expect(getPlateStyle(10).color).toBe('var(--plate-10)');
    expect(getPlateStyle(5).color).toBe('var(--plate-5)');
    expect(getPlateStyle(2.5).color).toBe('var(--plate-2-5)');
  });

  it('anilhas fracionárias caem no cinza', () => {
    for (const w of [1.25, 0.5, 0.25]) {
      expect(getPlateStyle(w).color).toBe('var(--plate-frac)');
    }
  });

  it('altura e largura decrescem com o peso', () => {
    const order = [25, 20, 15, 10, 5, 2.5, 1.25];
    for (let i = 1; i < order.length; i++) {
      expect(getPlateStyle(order[i]).height).toBeLessThan(getPlateStyle(order[i - 1]).height);
      expect(getPlateStyle(order[i]).width).toBeLessThanOrEqual(getPlateStyle(order[i - 1]).width);
    }
  });

  it('rótulo escuro sobre anilhas claras (15 e 5 kg)', () => {
    expect(getPlateStyle(15).label).toBe('dark');
    expect(getPlateStyle(5).label).toBe('dark');
    expect(getPlateStyle(25).label).toBe('light');
  });
});
