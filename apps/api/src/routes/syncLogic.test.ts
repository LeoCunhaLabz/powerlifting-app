import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { WorkoutSession } from '@powerlifting/shared'
import { performSync, type EntityRow, type SyncRepo, type TableRepo, type WorkoutRow } from './syncLogic.js'
import { mapClientIdToDbUuid } from './syncId.js'

const USER_ID = '7d9bc183-a3d6-420f-83b2-534ef6e649bc'

// Repo em memória: Map por tabela. É exatamente a interface que a rota implementa
// sobre uma transação drizzle — os testes exercitam as DECISÕES (LWW, tombstone,
// upsert), não o encadeamento de chamadas do ORM.
function memTable<Row extends EntityRow>(): TableRepo<Row> & { rows: Map<string, Row> } {
  const rows = new Map<string, Row>()
  return {
    rows,
    async get(id) {
      return rows.get(id)
    },
    async insert(row) {
      rows.set(row.id, row)
      return row
    },
    async update(id, patch) {
      const current = rows.get(id)
      if (!current) throw new Error(`update de linha inexistente: ${id}`)
      const next = { ...current, data: patch.data, updatedAt: patch.updatedAt }
      rows.set(id, next)
      return next
    },
  }
}

function memRepo() {
  return {
    workouts: memTable<WorkoutRow>(),
    templates: memTable(),
    programs: memTable(),
    customExercises: memTable(),
  } satisfies SyncRepo & Record<string, unknown>
}

const NOW = new Date('2026-09-07T12:00:00.000Z')

function session(overrides: Partial<WorkoutSession> = {}): WorkoutSession {
  return {
    id: 'session-1',
    name: 'Treino A',
    date: '2026-09-01T21:30:00.000Z',
    duration: 3600,
    templateId: 'template-1',
    exercises: [
      {
        id: 'ex-1',
        name: 'Agachamento',
        notes: 'joelho ok',
        restSeconds: 180,
        sets: [{ id: 'set-1', weight: 100, reps: 5, completed: true, type: 'N' }],
      },
    ],
    ...overrides,
  }
}

const emptyInput = { workouts: [], templates: [], customExercises: [], programs: [] }

test('workout novo é inserido preservando TODOS os campos (templateId/notes/restSeconds)', async () => {
  const repo = memRepo()
  const w = session()

  const out = await performSync(repo, USER_ID, { ...emptyInput, workouts: [w] }, NOW)

  const stored = out.workouts[0]?.data as WorkoutSession
  assert.equal(stored.templateId, 'template-1')
  assert.equal(stored.exercises[0]?.notes, 'joelho ok')
  assert.equal(stored.exercises[0]?.restSeconds, 180)
})

test('edição mais NOVA de workout vence o servidor (LWW), inclusive vinda após conclusão', async () => {
  const repo = memRepo()
  const original = session({ updatedAt: '2026-09-02T10:00:00.000Z' })
  await performSync(repo, USER_ID, { ...emptyInput, workouts: [original] }, NOW)

  const edited = session({ name: 'Treino A corrigido', updatedAt: '2026-09-03T10:00:00.000Z' })
  const out = await performSync(repo, USER_ID, { ...emptyInput, workouts: [edited] }, NOW)

  assert.equal((out.workouts[0]?.data as WorkoutSession).name, 'Treino A corrigido')
})

test('edição mais VELHA (device atrasado) perde o LWW — o servidor mantém a versão atual', async () => {
  const repo = memRepo()
  const current = session({ name: 'Versão atual', updatedAt: '2026-09-05T10:00:00.000Z' })
  await performSync(repo, USER_ID, { ...emptyInput, workouts: [current] }, NOW)

  const stale = session({ name: 'Versão velha', updatedAt: '2026-09-01T10:00:00.000Z' })
  const out = await performSync(repo, USER_ID, { ...emptyInput, workouts: [stale] }, NOW)

  assert.equal((out.workouts[0]?.data as WorkoutSession).name, 'Versão atual')
})

test('tombstone marca deleted:true no servidor e vence push atrasado da versão viva', async () => {
  const repo = memRepo()
  const w = session({ updatedAt: '2026-09-01T10:00:00.000Z' })
  await performSync(repo, USER_ID, { ...emptyInput, workouts: [w] }, NOW)

  const out = await performSync(
    repo,
    USER_ID,
    { ...emptyInput, deletedWorkouts: [{ id: w.id, deletedAt: '2026-09-04T10:00:00.000Z' }] },
    NOW,
  )
  assert.deepEqual(out.deletedWorkoutIds, [w.id])

  const dbId = mapClientIdToDbUuid(USER_ID, 'workout', w.id)
  const row = repo.workouts.rows.get(dbId)
  assert.equal((row?.data as { deleted?: boolean }).deleted, true)

  // Device atrasado re-envia a versão viva (updatedAt anterior à exclusão): NÃO ressuscita.
  const out2 = await performSync(repo, USER_ID, { ...emptyInput, workouts: [w] }, NOW)
  assert.equal((out2.workouts[0]?.data as { deleted?: boolean }).deleted, true)
})

test('tombstone mais velho que uma edição PERDE o LWW (edição sobrevive), mas é confirmado', async () => {
  const repo = memRepo()
  const w = session({ updatedAt: '2026-09-05T10:00:00.000Z' })
  await performSync(repo, USER_ID, { ...emptyInput, workouts: [w] }, NOW)

  const out = await performSync(
    repo,
    USER_ID,
    { ...emptyInput, deletedWorkouts: [{ id: w.id, deletedAt: '2026-09-03T10:00:00.000Z' }] },
    NOW,
  )

  assert.deepEqual(out.deletedWorkoutIds, [w.id], 'confirmado mesmo perdendo, para o cliente parar de reenviar')
  const dbId = mapClientIdToDbUuid(USER_ID, 'workout', w.id)
  assert.equal((repo.workouts.rows.get(dbId)?.data as { deleted?: boolean }).deleted, undefined)
})

test('tombstone de workout inexistente no servidor é confirmado sem erro', async () => {
  const repo = memRepo()
  const out = await performSync(
    repo,
    USER_ID,
    { ...emptyInput, deletedWorkouts: [{ id: 'nunca-sincronizado', deletedAt: '2026-09-04T10:00:00.000Z' }] },
    NOW,
  )
  assert.deepEqual(out.deletedWorkoutIds, ['nunca-sincronizado'])
})

test('custom exercises: device com lista desatualizada NÃO apaga os exercícios dos outros (fim do wipe)', async () => {
  const repo = memRepo()
  // Device A cria dois exercícios
  await performSync(
    repo,
    USER_ID,
    {
      ...emptyInput,
      customExercises: [
        { id: 'cex-1', name: 'Rosca Spider', createdAt: '2026-09-01T10:00:00.000Z' },
        { id: 'cex-2', name: 'Remada Cavalinho', createdAt: '2026-09-01T10:00:00.000Z' },
      ],
    },
    NOW,
  )

  // Device B, desatualizado, envia SÓ um exercício (a lista antiga dele)
  await performSync(
    repo,
    USER_ID,
    { ...emptyInput, customExercises: [{ id: 'cex-1', name: 'Rosca Spider', createdAt: '2026-09-01T10:00:00.000Z' }] },
    NOW,
  )

  assert.equal(repo.customExercises.rows.size, 2, 'cex-2 sobreviveu ao push parcial do device B')
})

test('custom exercise com createdAt malformado não derruba o sync (fallback de data)', async () => {
  const repo = memRepo()
  const out = await performSync(
    repo,
    USER_ID,
    { ...emptyInput, customExercises: [{ id: 'cex-x', name: 'Face Pull', createdAt: 'data-invalida' }] },
    NOW,
  )
  assert.equal(out.customExercises.length, 1)
  assert.equal(out.customExercises[0]?.createdAt.getTime(), NOW.getTime())
})

test('template built-in não sincroniza; template soft-deleted preserva o flag no round-trip', async () => {
  const repo = memRepo()
  const out = await performSync(
    repo,
    USER_ID,
    {
      ...emptyInput,
      templates: [
        {
          id: 'builtin-1',
          name: 'LP Iniciante',
          description: '',
          exercises: [],
          isBuiltIn: true,
        },
        {
          id: 'template-9',
          name: 'Rotina excluída',
          description: '',
          exercises: [],
          deleted: true,
          updatedAt: '2026-09-06T10:00:00.000Z',
        },
      ],
    },
    NOW,
  )

  assert.equal(out.templates.length, 1, 'built-in ficou de fora')
  assert.equal((out.templates[0]?.data as { deleted?: boolean }).deleted, true, 'deleted sobreviveu (antes era stripado)')
})
