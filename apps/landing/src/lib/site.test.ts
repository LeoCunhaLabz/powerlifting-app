import { describe, it, expect } from 'vitest';
import { EVERGREEN_PAGES, ROUTES } from './site';

describe('EVERGREEN_PAGES', () => {
  it('tem 5 páginas (escopo composto de SEO da issue #250)', () => {
    expect(EVERGREEN_PAGES).toHaveLength(5);
  });

  it('cada rota existe em ROUTES e é única', () => {
    const hrefs = EVERGREEN_PAGES.map((p) => p.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const href of hrefs) {
      expect(Object.values(ROUTES)).toContain(href);
    }
  });

  it('toda página tem label não vazio', () => {
    for (const p of EVERGREEN_PAGES) {
      expect(p.label.trim().length).toBeGreaterThan(0);
    }
  });
});
