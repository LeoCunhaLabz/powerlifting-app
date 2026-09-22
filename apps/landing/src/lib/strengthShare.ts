/**
 * Links da calculadora "Quão forte você é" (spec §6.4 e §8):
 * - **compartilhar**: query na própria landing que re-renderiza o resultado;
 * - **CTA do app**: payload base64url no fragmento de `/registro`.
 *
 * Funções puras — testadas em strengthShare.test.ts. Nada aqui lança: link
 * torto vira `null` e a página abre no estado vazio.
 */
import { encodeStrengthPayload, type StrengthPayload, type StrengthPayloadLift } from '@powerlifting/shared';
import { APP_URL, ROUTES, SITE_URL } from './site';

export type Sex = 'm' | 'f';

/** Repetições oferecidas no segmentado (spec §6.1). Fora dessa lista vira 1. */
export const REP_OPTIONS = [1, 3, 5, 8, 10] as const;

export interface ShareLift {
  lift: StrengthPayloadLift;
  kg: number;
  reps: number;
}

export interface ShareInput {
  sex: Sex;
  bodyweight: number;
  lifts: ShareLift[];
}

/** Chaves curtas por lift: carga e reps. */
const QUERY_KEYS: Record<StrengthPayloadLift, { kg: string; reps: string }> = {
  squat: { kg: 'sq', reps: 'rsq' },
  bench: { kg: 'bp', reps: 'rbp' },
  deadlift: { kg: 'dl', reps: 'rdl' },
};

const LIFT_ORDER: StrengthPayloadLift[] = ['squat', 'bench', 'deadlift'];

function isRepOption(value: number): boolean {
  return (REP_OPTIONS as readonly number[]).includes(value);
}

function serializeNumber(value: number): string {
  return String(Math.round(value * 100) / 100);
}

/** Query de compartilhamento (`?s=m&bw=82&bp=110&rbp=5`). Reps 1 é omitida. */
export function buildShareQuery(input: ShareInput): string {
  const params = new URLSearchParams();
  params.set('s', input.sex);
  params.set('bw', serializeNumber(input.bodyweight));
  for (const lift of LIFT_ORDER) {
    const entry = input.lifts.find((l) => l.lift === lift);
    if (!entry || !(entry.kg > 0)) continue;
    params.set(QUERY_KEYS[lift].kg, serializeNumber(entry.kg));
    if (entry.reps > 1) params.set(QUERY_KEYS[lift].reps, String(entry.reps));
  }
  return `?${params.toString()}`;
}

/**
 * Lê a query de um link compartilhado. Exige sexo, peso corporal e pelo menos
 * um lift com carga; reps ausente (ou fora do segmentado) vira 1.
 */
export function parseShareQuery(search: string): ShareInput | null {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);

  const sex = params.get('s');
  if (sex !== 'm' && sex !== 'f') return null;

  const bodyweight = Number(params.get('bw'));
  if (!Number.isFinite(bodyweight) || bodyweight <= 0) return null;

  const lifts: ShareLift[] = [];
  for (const lift of LIFT_ORDER) {
    const raw = params.get(QUERY_KEYS[lift].kg);
    if (raw === null) continue;
    const kg = Number(raw);
    if (!Number.isFinite(kg) || kg <= 0) continue;
    const reps = Number(params.get(QUERY_KEYS[lift].reps));
    lifts.push({ lift, kg, reps: Number.isInteger(reps) && isRepOption(reps) ? reps : 1 });
  }
  if (lifts.length === 0) return null;

  return { sex, bodyweight, lifts };
}

/** URL absoluta de compartilhamento da página `/quao-forte-voce-e`. */
export function buildShareUrl(input: ShareInput): string {
  return `${SITE_URL}${ROUTES.quaoForteVoceE}${buildShareQuery(input)}`;
}

/** Caminho relativo para "adicionar agacho e terra" (mesma origem da landing). */
export function buildFullModePath(input: ShareInput): string {
  return `${ROUTES.quaoForteVoceE}${buildShareQuery(input)}`;
}

/** CTA do card: cadastro do app com os dados no fragmento (§8). */
export function buildSignupUrl(input: ShareInput): string {
  const payload: StrengthPayload = {
    v: 1,
    sex: input.sex === 'm' ? 'M' : 'F',
    bw: Math.round(input.bodyweight * 100) / 100,
    lifts: input.lifts
      .filter((l) => l.kg > 0)
      .map((l) => ({ lift: l.lift, kg: Math.round(l.kg * 100) / 100, reps: isRepOption(l.reps) ? l.reps : 1 })),
  };
  return `${APP_URL}/registro#forca=${encodeStrengthPayload(payload)}`;
}
