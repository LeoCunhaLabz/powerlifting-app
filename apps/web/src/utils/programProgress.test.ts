import { describe, expect, it } from 'vitest';
import { computeMissedTrainingDays, sessionDayKey, toLocalDate } from './programProgress';
import type { Program } from '@powerlifting/shared';

describe('sessionDayKey', () => {
  it('data pura já é a chave local — não passa por new Date (que parsearia como UTC)', () => {
    expect(sessionDayKey('2026-08-05')).toBe('2026-08-05');
  });

  it('ISO com hora converte para o dia LOCAL do timestamp', () => {
    const iso = '2026-08-08T00:30:00.000Z';
    // Independente do fuso do runner: deve bater com toLocalDate do mesmo instante
    // (em UTC-3 é 2026-08-07; em UTC é 2026-08-08 — nunca o slice cego do ISO em fuso negativo).
    expect(sessionDayKey(iso)).toBe(toLocalDate(new Date(iso)));
  });
});

// Segunda-feira, para trainingDays previsível (0=Seg).
const START = '2026-08-03';

function makeProgram(overrides: Partial<Program> = {}): Program {
  return {
    id: 'prog-1',
    name: 'Programa Teste',
    templateIds: ['tpl-a', 'tpl-b'],
    isActive: true,
    createdAt: START,
    startDate: START,
    trainingDays: [0, 2, 4], // Seg, Qua, Sex
    ...overrides,
  };
}

function session(date: string, templateId = 'tpl-a') {
  return { date, templateId };
}

describe('computeMissedTrainingDays', () => {
  it('marca como perdido um dia de treino esperado sem nenhuma sessão', () => {
    const program = makeProgram();
    const missed = computeMissedTrainingDays(program, [], '2026-08-04');

    expect(missed.has('2026-08-03')).toBe(true);
  });

  it('não marca como perdido um dia com sessão no mesmo dia', () => {
    const program = makeProgram();
    const missed = computeMissedTrainingDays(program, [session('2026-08-03')], '2026-08-04');

    expect(missed.has('2026-08-03')).toBe(false);
  });

  it('fazer a rotina perdida de segunda na quarta cobre a segunda', () => {
    const program = makeProgram();
    // Perdeu segunda (03), fez quarta (05) — quarta também é dia de treino esperado,
    // então a sessão de quarta paga a pendência de segunda (a mais antiga da fila).
    const missed = computeMissedTrainingDays(program, [session('2026-08-05')], '2026-08-06');

    expect(missed.has('2026-08-03')).toBe(false);
  });

  it('sessão fora de um dia de treino esperado também cobre a pendência mais antiga', () => {
    const program = makeProgram();
    // Perdeu segunda (03); fez uma sessão do programa na terça (04, não é dia esperado).
    const missed = computeMissedTrainingDays(program, [session('2026-08-04')], '2026-08-06');

    expect(missed.has('2026-08-03')).toBe(false);
  });

  it('paga pendências na ordem (mais antiga primeiro) quando há mais de uma', () => {
    const program = makeProgram();
    // Perdeu segunda (03) e quarta (05); a sessão de sexta (07) paga a mais antiga (03)
    // primeiro — quarta (05) e a própria sexta (07, sem sessão nela mesma) continuam pendentes.
    const missed = computeMissedTrainingDays(program, [session('2026-08-07')], '2026-08-08');

    expect(missed.has('2026-08-03')).toBe(false); // pago pela sessão de sexta
    expect(missed.has('2026-08-05')).toBe(true); // ainda perdido
  });

  it('sessão sem pendência para pagar não afeta nada (treino extra)', () => {
    const program = makeProgram();
    // Sessão extra na terça (04), sem nenhum dia perdido antes dela.
    const missed = computeMissedTrainingDays(program, [session('2026-08-04'), session('2026-08-05')], '2026-08-06');

    expect(missed.size).toBe(0);
  });

  it('ignora sessões de template fora do programa', () => {
    const program = makeProgram();
    const missed = computeMissedTrainingDays(program, [session('2026-08-05', 'tpl-outro')], '2026-08-06');

    expect(missed.has('2026-08-03')).toBe(true);
  });

  it('retorna vazio quando o programa não tem trainingDays configurados', () => {
    const program = makeProgram({ trainingDays: [] });
    const missed = computeMissedTrainingDays(program, [], '2026-08-10');

    expect(missed.size).toBe(0);
  });

  it('retorna vazio quando ainda não passou nenhum dia desde o início', () => {
    const program = makeProgram();
    const missed = computeMissedTrainingDays(program, [], START);

    expect(missed.size).toBe(0);
  });
});
