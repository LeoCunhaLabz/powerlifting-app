import { test } from 'node:test'
import assert from 'node:assert/strict'
import Fastify from 'fastify'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import type { FastifyRequest } from 'fastify'
import { syncRoutes } from './sync.js'
import { mapClientIdToDbUuid } from './syncId.js'
import { programs } from '../db/schema.js'

const USER_ID = '7d9bc183-a3d6-420f-83b2-534ef6e649bc'

// ---------------------------------------------------------------------------
// Mock de db genérico para o fio rota→transação→repo→serialização.
// As DECISÕES de sync (LWW, tombstones, upsert) são testadas de verdade em
// syncLogic.test.ts com repo em memória; aqui o select devolve sempre vazio
// (todo item cai no caminho de insert) e o objetivo é validar schemas, ids
// legados, response shape e o endpoint de reset.
// ---------------------------------------------------------------------------
function createMockDb() {
  // where() precisa ser awaitável (pull: `await select().from().where()`) E ter
  // .limit() (get: `... .where().limit(1)`). Um thenable com .limit cobre os dois.
  const emptyWhere = {
    limit: async () => [] as unknown[],
    then: (resolve: (rows: unknown[]) => void) => resolve([]),
  }

  const db = {
    async transaction<T>(fn: (tx: typeof db) => Promise<T>): Promise<T> {
      return fn(db)
    },
    select() {
      return { from: () => ({ where: () => emptyWhere }) }
    },
    insert() {
      return {
        values(value: Record<string, unknown>) {
          return { returning: async () => [value] }
        },
      }
    },
    update() {
      return {
        set(patch: Record<string, unknown>) {
          return { where: () => ({ returning: async () => [patch] }) }
        },
      }
    },
    delete() {
      return { where: () => ({ returning: async () => [] }) }
    },
  }

  return db
}

async function buildApp(mockDb: unknown) {
  const app = Fastify()
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)
  app.decorate('db', mockDb as never)
  app.decorate('authenticate', async (request: FastifyRequest) => {
    Object.assign(request, { user: { sub: USER_ID, email: 'athlete@example.com' } })
  })
  await app.register(syncRoutes)
  return app
}

test('POST /sync aceita ids legados, preserva campos completos e confirma tombstones', async () => {
  const app = await buildApp(createMockDb())

  const workoutId = 'session-1735689600000'
  const templateId = 'template-1735689600000'
  const programId = 'program-1735689600000'

  const response = await app.inject({
    method: 'POST',
    url: '/sync',
    payload: {
      workouts: [
        {
          id: workoutId,
          name: 'Treino A',
          date: '2026-06-28T00:00:00.000Z',
          duration: 3600,
          templateId,
          updatedAt: '2026-06-28T01:00:00.000Z',
          exercises: [
            {
              id: 'ex-1',
              name: 'Agachamento',
              notes: 'cinto na última',
              restSeconds: 240,
              sets: [{ id: 'set-1', weight: 100, reps: 5, completed: true, type: 'N' }],
            },
          ],
        },
      ],
      templates: [
        {
          id: templateId,
          name: 'Upper A',
          description: 'Template de teste',
          notes: 'foco em barra',
          archived: false,
          exercises: [
            { name: 'Supino', expectedWeight: 80, restSeconds: 180, sets: [{ reps: 5, type: 'N' }] },
          ],
          updatedAt: '2026-06-28T00:00:00.000Z',
        },
      ],
      customExercises: [
        { id: 'cex-1735689600000', name: 'Rosca Spider', createdAt: '2026-06-28T00:00:00.000Z' },
      ],
      programs: [
        {
          id: programId,
          name: 'Bloco de Força',
          templateIds: [templateId],
          isActive: true,
          createdAt: '2026-06-28T00:00:00.000Z',
          updatedAt: '2026-06-28T00:00:00.000Z',
        },
      ],
      deletedWorkouts: [{ id: 'session-antiga', deletedAt: '2026-06-29T00:00:00.000Z' }],
    },
  })

  assert.equal(response.statusCode, 200)

  const body = response.json() as {
    workouts: Array<{ id: string; data: { id: string; templateId?: string; exercises: Array<{ notes?: string; restSeconds?: number }> } }>
    templates: Array<{ id: string; data: { id: string; notes?: string } }>
    customExercises: Array<{ id: string; data: { name: string } }>
    programs: Array<{ id: string; data: { name: string } }>
    deletedWorkoutIds: string[]
  }

  // Regressão anti-strip (#264): os campos que os schemas antigos APAGAVAM
  // precisam sobreviver ao round-trip.
  assert.equal(body.workouts[0]?.data.templateId, templateId)
  assert.equal(body.workouts[0]?.data.exercises[0]?.notes, 'cinto na última')
  assert.equal(body.workouts[0]?.data.exercises[0]?.restSeconds, 240)
  assert.equal(body.templates[0]?.data.notes, 'foco em barra')

  assert.deepEqual(body.deletedWorkoutIds, ['session-antiga'])
  assert.equal(body.workouts[0]?.id, mapClientIdToDbUuid(USER_ID, 'workout', workoutId))
  assert.equal(body.templates[0]?.id, mapClientIdToDbUuid(USER_ID, 'template', templateId))
  assert.equal(body.customExercises[0]?.id, mapClientIdToDbUuid(USER_ID, 'custom-exercise', 'cex-1735689600000'))
  assert.equal(body.programs[0]?.id, mapClientIdToDbUuid(USER_ID, 'program', programId))

  await app.close()
})

test('POST /sync sem o campo deletedWorkouts (cliente antigo) continua aceito', async () => {
  const app = await buildApp(createMockDb())

  const response = await app.inject({
    method: 'POST',
    url: '/sync',
    payload: { workouts: [], templates: [], customExercises: [], programs: [] },
  })

  assert.equal(response.statusCode, 200)
  assert.deepEqual(response.json().deletedWorkoutIds, [])
  await app.close()
})

test('POST /sync/reset apaga em transação e responde contagens', async () => {
  const app = await buildApp(createMockDb())

  const response = await app.inject({ method: 'POST', url: '/sync/reset' })

  assert.equal(response.statusCode, 200)
  assert.deepEqual(response.json(), {
    ok: true,
    deleted: { workouts: 0, templates: 0, customExercises: 0, programs: 0 },
  })
  await app.close()
})

test('GET /sync/pull retorna programs do usuário', async () => {
  const programRow = {
    id: mapClientIdToDbUuid(USER_ID, 'program', 'program-1'),
    userId: USER_ID,
    data: {
      id: 'program-1',
      name: 'Bloco de Força',
      templateIds: ['template-1'],
      isActive: true,
      createdAt: '2026-06-28T00:00:00.000Z',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const pullMockDb = {
    select() {
      return {
        from(table: unknown) {
          const rows = table === programs ? [programRow] : []
          return { where: () => Promise.resolve(rows) }
        },
      }
    },
  }

  const app = await buildApp(pullMockDb)

  const response = await app.inject({ method: 'GET', url: '/sync/pull' })

  assert.equal(response.statusCode, 200)
  const body = response.json() as { programs: Array<{ data: { name: string } }> }
  assert.equal(body.programs.length, 1)
  assert.equal(body.programs[0]?.data.name, 'Bloco de Força')

  await app.close()
})
