import { describe, it, expect } from 'vitest';
import { COMPARISON_ROWS, CELL_LABEL } from './comparativo';

describe('tabela comparativa', () => {
  it('tem 5 critérios com 4 colunas de produto + célula mobile', () => {
    expect(COMPARISON_ROWS).toHaveLength(5);
    for (const row of COMPARISON_ROWS) {
      expect(row.onyx).toBeDefined();
      expect(row.strong).toBeDefined();
      expect(row.hevy).toBeDefined();
      expect(row.outros).toBeDefined();
      expect(row.outrosApps).toBeDefined();
    }
  });

  it('toda célula declara a fonte da afirmação (gate 1 da spec)', () => {
    for (const row of COMPARISON_ROWS) {
      for (const cell of [row.onyx, row.strong, row.hevy, row.outros, row.outrosApps]) {
        expect(cell.fonte.trim().length).toBeGreaterThan(0);
        expect(CELL_LABEL[cell.value]).toBeDefined();
      }
    }
  });

  it('a coluna ONYX é "sim" em todos os critérios (o comparativo só lista diferenciais)', () => {
    expect(COMPARISON_ROWS.every((r) => r.onyx.value === 'sim')).toBe(true);
  });

  it('critérios têm versão curta para o mobile', () => {
    for (const row of COMPARISON_ROWS) {
      expect(row.criterioCurto.length).toBeGreaterThan(0);
      expect(row.criterioCurto.length).toBeLessThanOrEqual(row.criterio.length);
    }
  });
});
