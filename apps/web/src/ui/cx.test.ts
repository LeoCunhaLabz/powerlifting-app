import { describe, it, expect } from 'vitest';
import { cx } from './cx';

describe('cx', () => {
  it('junta as classes com espaço', () => {
    expect(cx('a', 'b')).toBe('a b');
  });

  it('ignora false, null, undefined e string vazia', () => {
    expect(cx('a', false, null, undefined, '', 'b')).toBe('a b');
  });

  it('devolve string vazia sem classes', () => {
    expect(cx()).toBe('');
  });
});
