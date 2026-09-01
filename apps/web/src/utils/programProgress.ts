import type { Program } from '@powerlifting/shared';

interface ProgramSessionLike {
  date: string;
  templateId?: string;
}

/** Converte Date para string YYYY-MM-DD no fuso local. */
export function toLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Índice 0=Seg…6=Dom para uma Date. */
export function weekDayIdx(d: Date): number {
  return (d.getDay() + 6) % 7;
}

/**
 * Dias de treino esperados (`program.trainingDays`) entre o início do programa e `today`
 * que ficaram sem nenhuma sessão do programa os cobrindo.
 *
 * Modelo de fila de débitos: cada dia de treino esperado sem sessão entra numa fila de
 * pendências, em ordem cronológica. Cada sessão do programa completada (em qualquer dia)
 * paga a pendência mais antiga da fila — sessões sem pendência a pagar não afetam nada.
 * O que sobra na fila ao final é o conjunto de dias perdidos. Isso permite fazer as rotinas
 * fora de ordem: perder um dia e completar a rotina depois faz o dia perdido original deixar
 * de ser exibido como perdido.
 */
export function computeMissedTrainingDays(program: Program, history: ProgramSessionLike[], today: string): Set<string> {
  const trainingDays = program.trainingDays ?? [];
  const startDate = program.startDate ?? program.createdAt.slice(0, 10);
  if (trainingDays.length === 0 || today <= startDate) return new Set();

  const sessionCountByDate = new Map<string, number>();
  for (const s of history) {
    if (!s.templateId || !program.templateIds.includes(s.templateId)) continue;
    const date = s.date.slice(0, 10);
    if (date >= startDate && date < today) {
      sessionCountByDate.set(date, (sessionCountByDate.get(date) ?? 0) + 1);
    }
  }

  const pending: string[] = [];
  const cur = new Date(startDate + 'T00:00:00');
  const end = new Date(today + 'T00:00:00');

  while (cur < end) {
    const dateStr = toLocalDate(cur);
    if (trainingDays.includes(weekDayIdx(cur))) {
      pending.push(dateStr);
    }

    let sessionsToday = sessionCountByDate.get(dateStr) ?? 0;
    while (sessionsToday > 0 && pending.length > 0) {
      pending.shift();
      sessionsToday--;
    }

    cur.setDate(cur.getDate() + 1);
  }

  return new Set(pending);
}
