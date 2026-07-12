import { test } from 'node:test'
import assert from 'node:assert/strict'
import Fastify from 'fastify'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import type { FastifyRequest } from 'fastify'
import { syncRoutes } from './sync.js'
import { mapClientIdToDbUuid } from './syncId.js'
import { customExercises, workouts } from '../db/schema.js'

const USER_ID = '7d9bc183-a3d6-420f-83b2-534ef6e649bc'

interface WorkoutRow {
  id: string
  userId: string
  data: unknown
  startedAt: Date
  finishedAt: Date | null
  createdAt: Date
  syncedAt: Date | null
}

interface TemplateRow {
  id: string
  userId: string
  data: unknown
  createdAt: Date
  updatedAt: Date
}

interface CustomExerciseRow {
  id: string
  userId: string
  data: unknown
  createdAt: Date
  updatedAt: Date
}

function createMockDb() {
  const workoutsStore = new Map<string, WorkoutRow>()
  const templatesStore = new Map<string, TemplateRow>()
  const customExercisesStore = new Map<string, CustomExerciseRow>()
  let selectedTable: 'workouts' | 'templates' | 'customExercises' | null = null
  let templateSelectCallCount = 0
  let lastWorkoutRow: WorkoutRow | null = null
  let lastTemplateRow: TemplateRow | null = null
  let lastCustomExerciseRows: CustomExerciseRow[] = []

  return {
    insert(table: unknown) {
      const tableName = table === workouts ? 'workouts' : table === customExercises ? 'customExercises' : 'templates'

      return {
        values(value: Record<string, unknown>) {
          if (tableName === 'workouts') {
            const row: WorkoutRow = {
              id: String(value.id),
              userId: String(value.userId),
              data: value.data,
              startedAt: value.startedAt as Date,
              finishedAt: (value.finishedAt as Date | null) ?? null,
              createdAt: new Date(),
              syncedAt: (value.syncedAt as Date | null) ?? null,
            }

            return {
              async onConflictDoNothing() {
                const key = `${row.id}:${row.userId}`
                if (!workoutsStore.has(key)) workoutsStore.set(key, row)
                lastWorkoutRow = workoutsStore.get(key) ?? row
              },
            }
          }

          if (tableName === 'customExercises') {
            const row: CustomExerciseRow = {
              id: String(value.id),
              userId: String(value.userId),
              data: value.data,
              createdAt: value.createdAt as Date,
              updatedAt: value.updatedAt as Date,
            }

            return {
              async returning() {
                const key = `${row.id}:${row.userId}`
                customExercisesStore.set(key, row)
                lastCustomExerciseRows = [...customExercisesStore.values()]
                return [row]
              },
            }
          }

          const row: TemplateRow = {
            id: String(value.id),
            userId: String(value.userId),
            data: value.data,
            createdAt: value.createdAt as Date,
            updatedAt: value.updatedAt as Date,
          }

          return {
            async returning() {
              const key = `${row.id}:${row.userId}`
              templatesStore.set(key, row)
              lastTemplateRow = row
              return [row]
            },
          }
        },
      }
    },

    select() {
      return {
        from(table: unknown) {
          selectedTable = table === workouts ? 'workouts' : 'templates'
          return this
        },
        where() {
          return this
        },
        async limit() {
          if (!selectedTable) return []

          if (selectedTable === 'workouts') {
            return lastWorkoutRow ? [lastWorkoutRow] : []
          }

          if (selectedTable === 'customExercises') {
            return lastCustomExerciseRows
          }

          templateSelectCallCount += 1

          // No primeiro select de template (fluxo de upsert), simula ausência para cair no insert.
          if (templateSelectCallCount === 1) return []

          return lastTemplateRow ? [lastTemplateRow] : []
        },
      }
    },

    delete(table: unknown) {
      const tableName = table === customExercises ? 'customExercises' : null

      return {
        async where() {
          if (tableName === 'customExercises') {
            customExercisesStore.clear()
            lastCustomExerciseRows = []
          }
          return []
        },
      }
    },

    update() {
      return {
        set() {
          return {
            where() {
              return {
                async returning() {
                  return []
                },
              }
            },
          }
        },
      }
    },
  }
}

test('POST /sync aceita IDs legados e responde 200 com payload sincronizado', async () => {
  const app = Fastify()
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  const mockDb = createMockDb()

  app.decorate('db', mockDb as never)
  app.decorate('authenticate', async (request: FastifyRequest) => {
    Object.assign(request, { user: { sub: USER_ID, email: 'athlete@example.com' } })
  })

  await app.register(syncRoutes)

  const workoutId = 'session-1735689600000'
  const templateId = 'template-1735689600000'

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
          exercises: [
            {
              id: 'ex-1',
              name: 'Agachamento',
              sets: [
                {
                  id: 'set-1',
                  weight: 100,
                  reps: 5,
                  completed: true,
                  type: 'N',
                },
              ],
            },
          ],
        },
      ],
      templates: [
        {
          id: templateId,
          name: 'Upper A',
          description: 'Template de teste',
          exercises: [
            {
              name: 'Supino',
              sets: [
                {
                  reps: 5,
                  type: 'N',
                },
              ],
            },
          ],
          updatedAt: '2026-06-28T00:00:00.000Z',
        },
      ],
      customExercises: [
        {
          id: 'cex-1735689600000',
          name: 'Rosca Spider',
          createdAt: '2026-06-28T00:00:00.000Z',
        },
      ],
    },
  })

  assert.equal(response.statusCode, 200)

  const body = response.json() as {
    workouts: Array<{ id: string; data: { id: string } }>
    templates: Array<{ id: string; data: { id: string } }>
    customExercises: Array<{ id: string; data: { id: string; name: string } }>
  }

  assert.equal(body.workouts.length, 1)
  assert.equal(body.templates.length, 1)
  assert.equal(body.customExercises.length, 1)
  assert.equal(body.workouts[0]?.data.id, workoutId)
  assert.equal(body.templates[0]?.data.id, templateId)
  assert.equal(body.customExercises[0]?.data.name, 'Rosca Spider')
  assert.equal(body.workouts[0]?.id, mapClientIdToDbUuid(USER_ID, 'workout', workoutId))
  assert.equal(body.templates[0]?.id, mapClientIdToDbUuid(USER_ID, 'template', templateId))
  assert.equal(body.customExercises[0]?.id, mapClientIdToDbUuid(USER_ID, 'custom-exercise', 'cex-1735689600000'))

  await app.close()
})