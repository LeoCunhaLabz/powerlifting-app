/**
 * Iniciar rotina por %1RM sem máximo conhecido (#336). Funções puras, testadas em
 * templateStart.test.ts.
 */
import type { WorkoutTemplate } from '@powerlifting/shared';

/**
 * Exercícios da rotina com séries por %1RM e sem máximo estimado (sem eles a carga sairia 0).
 * Sem repetição de nome (comparação sem caixa), na ordem da rotina.
 */
export function exercisesNeedingMax(template: WorkoutTemplate, getMax: (exerciseName: string) => number): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const ex of template.exercises) {
    const key = ex.name.trim().toLowerCase();
    if (seen.has(key)) continue;
    if (!ex.sets.some((s) => (s.weightPercentage ?? 0) > 0)) continue;
    if (getMax(ex.name) > 0) continue;
    seen.add(key);
    names.push(ex.name);
  }
  return names;
}

/** Máximos digitados, por nome sem caixa; ignora vazio, zero e texto inválido. */
export function parseMaxes(values: Record<string, string>, parse: (text: string) => number): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [name, text] of Object.entries(values)) {
    const n = parse(text);
    if (n > 0) out[name.trim().toLowerCase()] = n;
  }
  return out;
}
