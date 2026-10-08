import { describe, expect, it } from 'vitest';
import { missingProfileText, profileStatus, resolveGenderInformed } from './profile';

const log = [{ date: '2026-10-01T07:00:00.000Z', weight: 82 }];

describe('profileStatus', () => {
  it('só pontua com peso registrado e sexo informado', () => {
    expect(profileStatus({ genderInformed: true }, log)).toEqual({ hasBodyweight: true, hasGender: true, canScore: true });
    expect(profileStatus({ genderInformed: true }, []).canScore).toBe(false);
    expect(profileStatus({ genderInformed: false }, log).canScore).toBe(false);
    expect(profileStatus({}, log).hasGender).toBe(false);
  });
});

describe('resolveGenderInformed', () => {
  it('respeita o valor salvo', () => {
    expect(resolveGenderInformed({ genderInformed: false }, log)).toBe(false);
    expect(resolveGenderInformed({ genderInformed: true }, [])).toBe(true);
  });

  it('estado antigo com peso registrado conta como informado (não perde o DOTS)', () => {
    expect(resolveGenderInformed({ gender: 'male' }, log)).toBe(true);
  });

  it('estado antigo sem peso, ou sem settings, não conta', () => {
    expect(resolveGenderInformed({ gender: 'male' }, [])).toBe(false);
    expect(resolveGenderInformed(undefined, undefined)).toBe(false);
  });
});

describe('missingProfileText', () => {
  it('diz o que falta', () => {
    expect(missingProfileText({ hasBodyweight: false, hasGender: false, canScore: false })).toBe('Registre o peso no Início e informe o sexo em Configurações.');
    expect(missingProfileText({ hasBodyweight: false, hasGender: true, canScore: false })).toBe('Registre o peso no Início.');
    expect(missingProfileText({ hasBodyweight: true, hasGender: false, canScore: false })).toBe('Informe o sexo em Configurações.');
    expect(missingProfileText({ hasBodyweight: true, hasGender: true, canScore: true })).toBeNull();
  });
});
