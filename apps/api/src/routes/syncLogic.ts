import type {
  WorkoutSession,
  WorkoutTemplate,
  Program,
  CustomExercise,
  DeletedWorkoutTombstone,
} from '@powerlifting/shared'
import { mapClientIdToDbUuid } from './syncId.js'

// ---------------------------------------------------------------------------
// Lógica pura do POST /sync (issue #264).
//
// Vive separada da rota para ser testável sem imitar o encadeamento de chamadas
// do drizzle: os testes implementam SyncRepo em memória e exercitam exatamente
// as decisões que causaram perda de dados em produção (LWW, tombstones, upsert).
//
// Semântica única para TODAS as entidades: last-write-wins por updatedAt.
//   - Não existe no servidor → insert.
//   - Existe e o cliente é mais novo → update.
//   - Existe e o servidor é mais novo/igual → mantém o servidor.
// Workouts deixaram de ser append-only (edição/exclusão eram descartadas) e
// custom exercises deixaram de ser "lista autoritativa" (um device com lista
// velha APAGAVA permanentemente os exercícios criados em outro device).
//
// Exclusão de workout viaja como tombstone {id, deletedAt}: o servidor marca
// data.deleted = true (não apaga a linha!) com updatedAt = deletedAt, para que
// um push atrasado de outro device com a versão antiga PERCA o LWW e o treino
// não ressuscite. O cliente filtra data.deleted no merge do pull.
// ---------------------------------------------------------------------------

export interface EntityRow {
  id: string
  userId: string
  data: unknown
  createdAt: Date
  updatedAt: Date
}

export interface WorkoutRow extends EntityRow {
  startedAt: Date
  finishedAt: Date | null
  syncedAt: Date | null
}

/** Operações mínimas por tabela — implementadas sobre uma transação drizzle na rota. */
export interface TableRepo<Row extends EntityRow> {
  get(id: string): Promise<Row | undefined>
  insert(row: Row): Promise<Row>
  update(id: string, patch: { data: unknown; updatedAt: Date }): Promise<Row>
}

export interface SyncRepo {
  workouts: TableRepo<WorkoutRow>
  templates: TableRepo<EntityRow>
  programs: TableRepo<EntityRow>
  customExercises: TableRepo<EntityRow>
}

export interface SyncInput {
  workouts: WorkoutSession[]
  templates: WorkoutTemplate[]
  customExercises: CustomExercise[]
  programs: Program[]
  deletedWorkouts?: DeletedWorkoutTombstone[]
}

export interface SyncOutput {
  workouts: WorkoutRow[]
  templates: EntityRow[]
  customExercises: EntityRow[]
  programs: EntityRow[]
  /** Tombstones processados (aplicados OU vencidos pelo LWW) — o cliente carimba syncedAt. */
  deletedWorkoutIds: string[]
}

/** Data válida ou fallback — createdAt/updatedAt malformados não podem derrubar o sync inteiro. */
function safeDate(iso: string | undefined, fallback: Date): Date {
  if (!iso) return fallback
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? fallback : d
}

async function upsertLww<Row extends EntityRow>(
  repo: TableRepo<Row>,
  buildInsert: () => Row,
  id: string,
  data: unknown,
  clientUpdatedAt: Date,
): Promise<Row> {
  const existing = await repo.get(id)
  if (!existing) return repo.insert(buildInsert())
  if (clientUpdatedAt > existing.updatedAt) {
    return repo.update(id, { data, updatedAt: clientUpdatedAt })
  }
  return existing
}

export async function performSync(repo: SyncRepo, userId: string, input: SyncInput, now: Date): Promise<SyncOutput> {
  // --- Workouts: LWW por updatedAt (date como proxy para sessões legadas sem o campo) ---
  const workoutRows: WorkoutRow[] = []
  for (const w of input.workouts) {
    const dbId = mapClientIdToDbUuid(userId, 'workout', w.id)
    const clientUpdatedAt = safeDate(w.updatedAt, safeDate(w.date, now))
    workoutRows.push(
      await upsertLww(
        repo.workouts,
        () => ({
          id: dbId,
          userId,
          data: w,
          startedAt: safeDate(w.date, now),
          finishedAt: null,
          createdAt: now,
          updatedAt: clientUpdatedAt,
          syncedAt: now,
        }),
        dbId,
        w,
        clientUpdatedAt,
      ),
    )
  }

  // --- Tombstones de workouts excluídos ---
  const deletedWorkoutIds: string[] = []
  for (const tomb of input.deletedWorkouts ?? []) {
    const dbId = mapClientIdToDbUuid(userId, 'workout', tomb.id)
    const deletedAt = safeDate(tomb.deletedAt, now)
    const existing = await repo.workouts.get(dbId)
    if (existing && deletedAt > existing.updatedAt) {
      const oldData = (existing.data ?? {})
      await repo.workouts.update(dbId, {
        data: { ...oldData, deleted: true, updatedAt: deletedAt.toISOString() },
        updatedAt: deletedAt,
      })
    }
    // Sempre confirmado: aplicado, inexistente no servidor, ou vencido pelo LWW
    // (uma edição mais nova em outro device manteve o treino — resultado correto).
    deletedWorkoutIds.push(tomb.id)
  }

  // --- Templates: LWW (built-ins nunca sincronizam) ---
  const templateRows: EntityRow[] = []
  for (const t of input.templates.filter((t) => !t.isBuiltIn)) {
    const dbId = mapClientIdToDbUuid(userId, 'template', t.id)
    const clientUpdatedAt = safeDate(t.updatedAt, now)
    templateRows.push(
      await upsertLww(
        repo.templates,
        () => ({ id: dbId, userId, data: t, createdAt: now, updatedAt: clientUpdatedAt }),
        dbId,
        t,
        clientUpdatedAt,
      ),
    )
  }

  // --- Programs: LWW ---
  const programRows: EntityRow[] = []
  for (const p of input.programs) {
    const dbId = mapClientIdToDbUuid(userId, 'program', p.id)
    const clientUpdatedAt = safeDate(p.updatedAt, now)
    programRows.push(
      await upsertLww(
        repo.programs,
        () => ({ id: dbId, userId, data: p, createdAt: now, updatedAt: clientUpdatedAt }),
        dbId,
        p,
        clientUpdatedAt,
      ),
    )
  }

  // --- Custom exercises: LWW por item (NUNCA delete-all — era o wipe da issue #264) ---
  const customExerciseRows: EntityRow[] = []
  for (const exercise of input.customExercises) {
    const dbId = mapClientIdToDbUuid(userId, 'custom-exercise', exercise.id)
    const clientUpdatedAt = safeDate(exercise.updatedAt, safeDate(exercise.createdAt, now))
    customExerciseRows.push(
      await upsertLww(
        repo.customExercises,
        () => ({
          id: dbId,
          userId,
          data: exercise,
          createdAt: safeDate(exercise.createdAt, now),
          updatedAt: clientUpdatedAt,
        }),
        dbId,
        exercise,
        clientUpdatedAt,
      ),
    )
  }

  return {
    workouts: workoutRows,
    templates: templateRows,
    customExercises: customExerciseRows,
    programs: programRows,
    deletedWorkoutIds,
  }
}
