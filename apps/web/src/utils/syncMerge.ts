import type {
  AppState,
  WorkoutSession,
  WorkoutTemplate,
  Program,
  CustomExercise,
} from '@powerlifting/shared';

/**
 * Merge do estado local com dados vindos do servidor (eco do push OU pull completo).
 *
 * Extraído do WorkoutContext e reescrito na issue #264 — o merge antigo tinha três
 * defeitos confirmados em produção:
 *   1. Item pendente NUNCA recebia syncedAt após o push (o guard era só "!syncedAt"),
 *      então o efeito de auto-sync re-disparava para sempre: loop infinito de POST /sync.
 *   2. Workouts não tinham guard nenhum: o eco/pull sobrescrevia edição local pendente.
 *   3. Exclusões não existiam: treino apagado ressuscitava no pull seguinte.
 *
 * Regras atuais (LWW espelhando o servidor):
 *   - Local pendente só sobrevive se for MAIS NOVO (updatedAt) que a cópia do servidor.
 *     O eco do push traz updatedAt igual ao local → o servidor "vence" e carimba
 *     syncedAt → pendência encerrada (mata o loop). Edição feita durante o voo fica
 *     mais nova que o eco → continua pendente → próximo push a leva.
 *   - `incoming` pode ser SUBCONJUNTO (o push envia só pendentes): itens locais fora
 *     do payload são preservados intactos.
 *   - Workout com data.deleted = true vindo do servidor remove a cópia local e nunca
 *     entra no history. Tombstone local pendente barra ressurreição via pull até o
 *     push confirmá-lo (deletedWorkoutIds do eco, ou o próprio deleted no pull).
 */

export interface ServerSyncData {
  workouts: WorkoutSession[];
  templates: WorkoutTemplate[];
  customExercises: CustomExercise[];
  programs: Program[];
  /** Presente apenas no eco do push: tombstones processados pelo servidor. */
  deletedWorkoutIds?: string[];
}

/** true quando a cópia local pendente é estritamente mais nova que a do servidor. */
function localNewer(localUpdatedAt?: string, incomingUpdatedAt?: string): boolean {
  return !!localUpdatedAt && (!incomingUpdatedAt || localUpdatedAt > incomingUpdatedAt);
}

interface Syncable {
  id: string;
  updatedAt?: string;
  syncedAt?: string;
}

/** Overlay LWW genérico: resolve os itens vindos do servidor contra os locais. */
function resolveIncoming<T extends Syncable>(incoming: T[], localById: Map<string, T>, now: string): T[] {
  return incoming.map((item) => {
    const local = localById.get(item.id);
    if (local && !local.syncedAt && localNewer(local.updatedAt, item.updatedAt)) return local;
    return { ...item, syncedAt: now };
  });
}

export function applyServerData(prev: AppState, incoming: ServerSyncData, now: string): AppState {
  // --- Workouts ---
  // Tombstones locais ainda não confirmados barram a ressurreição via pull.
  const pendingTombstoneIds = new Set(
    (prev.deletedWorkouts ?? []).filter((t) => !t.syncedAt).map((t) => t.id),
  );
  const incomingWorkoutIds = new Set(incoming.workouts.map((w) => w.id));
  const localWorkoutById = new Map(prev.history.map((h) => [h.id, h]));

  const aliveIncoming = incoming.workouts.filter(
    (w) => !(w as { deleted?: boolean }).deleted && !pendingTombstoneIds.has(w.id),
  );
  const history = [
    ...resolveIncoming(aliveIncoming, localWorkoutById, now),
    // Locais fora do payload (subset do push, ou novos ainda não enviados): intactos.
    // Ids que vieram como deleted ficam de fora dos dois lados — a cópia local morre aqui.
    ...prev.history.filter((h) => !incomingWorkoutIds.has(h.id)),
  ].sort((a, b) => b.date.localeCompare(a.date));

  // --- Tombstones: carimba os confirmados (eco) ou já materializados no servidor (pull) ---
  const confirmedTombstones = new Set(incoming.deletedWorkoutIds ?? []);
  for (const w of incoming.workouts) {
    if ((w as { deleted?: boolean }).deleted) confirmedTombstones.add(w.id);
  }
  const deletedWorkouts = (prev.deletedWorkouts ?? []).map((t) =>
    !t.syncedAt && confirmedTombstones.has(t.id) ? { ...t, syncedAt: now } : t,
  );

  // --- Templates (built-ins nunca vêm do servidor; tombstones deleted ficam no estado:
  //     programas podem referenciá-los como snapshot e a UI já os filtra) ---
  const builtIns = prev.templates.filter((t) => t.isBuiltIn);
  const localCustom = prev.templates.filter((t) => !t.isBuiltIn);
  const localTplById = new Map(localCustom.map((t) => [t.id, t]));
  const incomingTplIds = new Set(incoming.templates.map((t) => t.id));
  const templates = [
    ...builtIns,
    ...resolveIncoming(incoming.templates, localTplById, now),
    ...localCustom.filter((t) => !incomingTplIds.has(t.id)),
  ];

  // --- Programs (tombstones deleted+confirmados podem ser podados: nada os referencia) ---
  const localProgById = new Map(prev.programs.map((p) => [p.id, p]));
  const incomingProgIds = new Set(incoming.programs.map((p) => p.id));
  const programs = [
    ...resolveIncoming(incoming.programs, localProgById, now),
    ...prev.programs.filter((p) => !incomingProgIds.has(p.id)),
  ].filter((p) => !(p.deleted && p.syncedAt));

  // --- Custom exercises (idem: poda tombstone já confirmado) ---
  const localCexById = new Map(prev.customExercises.map((c) => [c.id, c]));
  const incomingCexIds = new Set(incoming.customExercises.map((c) => c.id));
  const customExercises = [
    ...resolveIncoming(incoming.customExercises, localCexById, now),
    ...prev.customExercises.filter((c) => !incomingCexIds.has(c.id)),
  ].filter((c) => !(c.deleted && c.syncedAt));

  return { ...prev, history, templates, programs, customExercises, deletedWorkouts };
}
