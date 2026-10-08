/**
 * Peso e sexo informados (#334): DOTS, Wilks, força relativa e a comparação por categoria
 * só aparecem com os dois. Os padrões (80 kg, masculino) nunca contam como informados.
 * Funções puras, testadas em profile.test.ts.
 */
import type { BodyweightEntry, Settings } from '@powerlifting/shared';

export interface ProfileStatus {
  /** Há ao menos um registro de peso corporal. */
  hasBodyweight: boolean;
  /** A pessoa escolheu o sexo (Configurações, calculadora da landing ou conta demo). */
  hasGender: boolean;
  /** Peso e sexo informados: pode calcular DOTS, Wilks e comparar por categoria. */
  canScore: boolean;
}

export function profileStatus(settings: Pick<Settings, 'genderInformed'>, bodyweightLog: BodyweightEntry[]): ProfileStatus {
  const hasBodyweight = bodyweightLog.length > 0;
  const hasGender = settings.genderInformed === true;
  return { hasBodyweight, hasGender, canScore: hasBodyweight && hasGender };
}

/**
 * Valor de `genderInformed` ao carregar o estado ou importar um backup. Estado de antes do
 * campo: quem já tem peso registrado conta como informado, para não perder o DOTS que via.
 */
export function resolveGenderInformed(rawSettings: unknown, bodyweightLog: BodyweightEntry[] | undefined): boolean {
  const raw = rawSettings as { genderInformed?: unknown } | null | undefined;
  if (typeof raw?.genderInformed === 'boolean') return raw.genderInformed;
  return (bodyweightLog?.length ?? 0) > 0;
}

/** O que falta para os cálculos com peso e sexo; null quando nada falta. */
export function missingProfileText(status: ProfileStatus): string | null {
  if (!status.hasBodyweight && !status.hasGender) return 'Registre o peso no Início e informe o sexo em Configurações.';
  if (!status.hasBodyweight) return 'Registre o peso no Início.';
  if (!status.hasGender) return 'Informe o sexo em Configurações.';
  return null;
}
