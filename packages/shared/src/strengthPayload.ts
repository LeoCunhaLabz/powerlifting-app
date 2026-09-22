/**
 * Ponte da calculadora "Quão forte você é" (landing) para o cadastro do app
 * (spec 2026-09-21, §8). A landing codifica o que a pessoa digitou e manda em
 * `app.onyxtreino.com.br/registro#forca=<payload>`; o app decodifica e semeia
 * peso corporal, sexo e um treino de referência.
 *
 * Vive aqui (e não em cada app) porque os dois lados precisam do mesmo formato.
 * Vai no **fragmento** da URL: não chega ao servidor nem ao log do nginx.
 *
 * Regra de ouro: decodificação nunca lança. Qualquer coisa fora do formato vira
 * `null` e o cadastro segue normal.
 */

/** Lifts aceitos no payload — `total` é derivado, não trafega. */
export type StrengthPayloadLift = 'squat' | 'bench' | 'deadlift';

export interface StrengthPayloadEntry {
  lift: StrengthPayloadLift;
  /** Carga levantada, na unidade do app (kg). */
  kg: number;
  /** Repetições feitas com essa carga (1 = máximo real). */
  reps: number;
}

export interface StrengthPayload {
  v: typeof STRENGTH_PAYLOAD_VERSION;
  sex: 'M' | 'F';
  /** Peso corporal em kg. */
  bw: number;
  lifts: StrengthPayloadEntry[];
}

/** Versão do formato. Um `v` desconhecido é ignorado pelo app (nunca bloqueia). */
export const STRENGTH_PAYLOAD_VERSION = 1;

/** Reps acima disso dão estimativa ruim de 1RM — a landing nem oferece. */
export const MAX_PAYLOAD_REPS = 10;

const LIFTS: readonly string[] = ['squat', 'bench', 'deadlift'];
const MAX_BODYWEIGHT_KG = 400;
const MAX_LIFT_KG = 1000;

function toBase64Url(json: string): string {
  const bytes = new TextEncoder().encode(json);
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(raw: string): string | null {
  const normalized = raw.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  try {
    const binary = atob(normalized + padding);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

function isValidEntry(value: unknown): value is StrengthPayloadEntry {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as Record<string, unknown>;
  if (typeof entry.lift !== 'string' || !LIFTS.includes(entry.lift)) return false;
  if (typeof entry.kg !== 'number' || !Number.isFinite(entry.kg) || entry.kg <= 0 || entry.kg > MAX_LIFT_KG) return false;
  if (typeof entry.reps !== 'number' || !Number.isInteger(entry.reps)) return false;
  return entry.reps >= 1 && entry.reps <= MAX_PAYLOAD_REPS;
}

/** Serializa o payload em base64url (sem padding), pronto para o fragmento da URL. */
export function encodeStrengthPayload(payload: StrengthPayload): string {
  return toBase64Url(JSON.stringify(payload));
}

/**
 * Lê o payload do fragmento. Aceita tanto `forca=<payload>` quanto o valor puro.
 * Devolve `null` para qualquer entrada inválida, versão desconhecida ou lift repetido.
 */
export function decodeStrengthPayload(raw: string): StrengthPayload | null {
  const value = raw.startsWith('forca=') ? raw.slice('forca='.length) : raw;
  if (value === '') return null;

  const json = fromBase64Url(value);
  if (json === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;

  const candidate = parsed as Record<string, unknown>;
  if (candidate.v !== STRENGTH_PAYLOAD_VERSION) return null;
  if (candidate.sex !== 'M' && candidate.sex !== 'F') return null;
  if (typeof candidate.bw !== 'number' || !Number.isFinite(candidate.bw)) return null;
  if (candidate.bw <= 0 || candidate.bw > MAX_BODYWEIGHT_KG) return null;
  if (!Array.isArray(candidate.lifts) || candidate.lifts.length === 0 || candidate.lifts.length > LIFTS.length) return null;
  if (!candidate.lifts.every(isValidEntry)) return null;

  const lifts = candidate.lifts as StrengthPayloadEntry[];
  if (new Set(lifts.map((l) => l.lift)).size !== lifts.length) return null;

  return { v: STRENGTH_PAYLOAD_VERSION, sex: candidate.sex, bw: candidate.bw, lifts };
}
