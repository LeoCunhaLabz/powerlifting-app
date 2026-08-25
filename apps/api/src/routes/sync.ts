import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { customExercises, workouts, templates, programs } from '../db/schema.js'
import { mapClientIdToDbUuid } from './syncId.js'

// ---------------------------------------------------------------------------
// Schemas Zod (espelham @powerlifting/shared sem importar o pacote no backend)
// ---------------------------------------------------------------------------

const setStateSchema = z.object({
  id: z.string(),
  weight: z.number(),
  reps: z.number().int().nonnegative(),
  rpe: z.number().min(6).max(10).optional(),
  rir: z.number().int().min(0).max(4).optional(),
  completed: z.boolean(),
  isPr: z.boolean().optional(),
  percentage: z.number().optional(),
  type: z.enum(['W', 'N', 'D']),
})

const exerciseStateSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  sets: z.array(setStateSchema),
})

const workoutSessionSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  date: z.string(),
  duration: z.number().nonnegative(),
  exercises: z.array(exerciseStateSchema),
  notes: z.string().optional(),
  syncedAt: z.string().optional(),
})

const templateExerciseSchema = z.object({
  name: z.string().min(1),
  sets: z.array(
    z.object({
      reps: z.number().int().positive(),
      rpe: z.number().min(6).max(10).optional(),
      weightPercentage: z.number().min(0).max(100).optional(),
      type: z.enum(['W', 'N', 'D']),
    }),
  ),
})

const workoutTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string(),
  exercises: z.array(templateExerciseSchema),
  isBuiltIn: z.boolean().optional(),
  updatedAt: z.string().optional(),
  syncedAt: z.string().optional(),
})

const customExerciseSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  createdAt: z.string(),
  syncedAt: z.string().optional(),
})

const weekOverrideSchema = z.object({
  weekIndex: z.number().int().nonnegative(),
  exerciseName: z.string().min(1),
  reps: z.number().int().positive().optional(),
  weightPercentage: z.number().min(0).max(100).optional(),
  rpe: z.number().min(6).max(10).optional(),
  weight: z.number().optional(),
  sets: z.number().int().positive().optional(),
})

const programSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  templateIds: z.array(z.string()),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  startDate: z.string().optional(),
  trainingDays: z.array(z.number().int().min(0).max(6)).optional(),
  weekCount: z.number().int().positive().optional(),
  weekOverrides: z.array(weekOverrideSchema).optional(),
  archived: z.boolean().optional(),
  syncedAt: z.string().optional(),
})

// ---------------------------------------------------------------------------
// Response schemas
// ---------------------------------------------------------------------------

const workoutRowSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  data: z.unknown(),
  startedAt: z.string().or(z.date()),
  finishedAt: z.string().or(z.date()).nullable(),
  createdAt: z.string().or(z.date()),
  syncedAt: z.string().or(z.date()).nullable(),
})

const templateRowSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  data: z.unknown(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
})

const customExerciseRowSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  data: z.unknown(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
})

const programRowSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  data: z.unknown(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
})

const syncBodySchema = z.object({
  workouts: z.array(workoutSessionSchema),
  templates: z.array(workoutTemplateSchema),
  customExercises: z.array(customExerciseSchema),
  programs: z.array(programSchema),
})

const syncResponseSchema = z.object({
  workouts: z.array(workoutRowSchema),
  templates: z.array(templateRowSchema),
  customExercises: z.array(customExerciseRowSchema),
  programs: z.array(programRowSchema),
})

const pullResponseSchema = z.object({
  workouts: z.array(workoutRowSchema),
  templates: z.array(templateRowSchema),
  customExercises: z.array(customExerciseRowSchema),
  programs: z.array(programRowSchema),
})

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export const syncRoutes: FastifyPluginAsyncZod = async (app) => {
  const auth = { preHandler: [app.authenticate] }

  /**
   * POST /sync
   *
   * Recebe o estado local do cliente (workouts + templates + programs) e faz
   * upsert no banco usando o id do cliente como PK.
   *
   * Estratégia de conflito:
   *   - Workouts: append-only. Se já existir no servidor (mesmo id + userId),
   *     mantém o registro do servidor (workouts são imutáveis após conclusão).
   *   - Templates e Programs: last-write-wins por updatedAt. Cliente e servidor
   *     comparam timestamps; mais recente ganha.
   *
   * Retorna os registros como estão no servidor após o upsert.
   */
  app.post(
    '/sync',
    {
      ...auth,
      schema: {
        body: syncBodySchema,
        response: { 200: syncResponseSchema },
      },
    },
    async (request, reply) => {
      const userId = request.user.sub
      const { workouts: clientWorkouts, templates: clientTemplates, customExercises: clientCustomExercises, programs: clientPrograms } = request.body
      const now = new Date()

      // --- Workouts: upsert append-only ---
      const syncedWorkoutRows = await Promise.all(
        clientWorkouts.map(async (w) => {
          const dbWorkoutId = mapClientIdToDbUuid(userId, 'workout', w.id)

          // Tenta inserir; se já existe (conflito de PK), ignora (mantém servidor)
          await app.db
            .insert(workouts)
            .values({
              id: dbWorkoutId,
              userId,
              data: w as Record<string, unknown>,
              startedAt: new Date(w.date),
              finishedAt: null,
              syncedAt: now,
            })
            .onConflictDoNothing()

          // Retorna o registro do servidor (inserido ou já existente)
          const [row] = await app.db
            .select()
            .from(workouts)
            .where(and(eq(workouts.id, dbWorkoutId), eq(workouts.userId, userId)))
            .limit(1)

          return row
        }),
      )

      // --- Templates: upsert last-write-wins por updatedAt ---
      const syncedTemplateRows = await Promise.all(
        clientTemplates
          .filter((t) => !t.isBuiltIn) // built-in templates não são sincronizados
          .map(async (t) => {
            const dbTemplateId = mapClientIdToDbUuid(userId, 'template', t.id)
            const clientUpdatedAt = t.updatedAt ? new Date(t.updatedAt) : now

            // Verifica se já existe no servidor
            const [existing] = await app.db
              .select()
              .from(templates)
              .where(and(eq(templates.id, dbTemplateId), eq(templates.userId, userId)))
              .limit(1)

            if (!existing) {
              // Não existe: insere
              const [row] = await app.db
                .insert(templates)
                .values({
                  id: dbTemplateId,
                  userId,
                  data: t as Record<string, unknown>,
                  createdAt: now,
                  updatedAt: clientUpdatedAt,
                })
                .returning()
              return row
            }

            // Existe: last-write-wins — atualiza apenas se cliente é mais recente
            if (clientUpdatedAt > existing.updatedAt) {
              const [row] = await app.db
                .update(templates)
                .set({ data: t as Record<string, unknown>, updatedAt: clientUpdatedAt })
                .where(and(eq(templates.id, dbTemplateId), eq(templates.userId, userId)))
                .returning()
              return row
            }

            return existing
          }),
      )

      // --- Programs: upsert last-write-wins por updatedAt ---
      const syncedProgramRows = await Promise.all(
        clientPrograms.map(async (p) => {
          const dbProgramId = mapClientIdToDbUuid(userId, 'program', p.id)
          const clientUpdatedAt = p.updatedAt ? new Date(p.updatedAt) : now

          const [existing] = await app.db
            .select()
            .from(programs)
            .where(and(eq(programs.id, dbProgramId), eq(programs.userId, userId)))
            .limit(1)

          if (!existing) {
            const [row] = await app.db
              .insert(programs)
              .values({
                id: dbProgramId,
                userId,
                data: p as Record<string, unknown>,
                createdAt: now,
                updatedAt: clientUpdatedAt,
              })
              .returning()
            return row
          }

          if (clientUpdatedAt > existing.updatedAt) {
            const [row] = await app.db
              .update(programs)
              .set({ data: p as Record<string, unknown>, updatedAt: clientUpdatedAt })
              .where(and(eq(programs.id, dbProgramId), eq(programs.userId, userId)))
              .returning()
            return row
          }

          return existing
        }),
      )

      // --- Custom Exercises: lista autoritativa por usuário (substituição completa) ---
      await app.db
        .delete(customExercises)
        .where(eq(customExercises.userId, userId))

      const syncedCustomExerciseRows = await Promise.all(
        clientCustomExercises.map(async (exercise) => {
          const dbCustomExerciseId = mapClientIdToDbUuid(userId, 'custom-exercise', exercise.id)
          const createdAt = new Date(exercise.createdAt)

          const [row] = await app.db
            .insert(customExercises)
            .values({
              id: dbCustomExerciseId,
              userId,
              data: exercise as Record<string, unknown>,
              createdAt,
              updatedAt: now,
            })
            .returning()

          return row
        }),
      )

      return reply.code(200).send({
        workouts: syncedWorkoutRows.filter(Boolean),
        templates: syncedTemplateRows.filter(Boolean),
        customExercises: syncedCustomExerciseRows.filter(Boolean),
        programs: syncedProgramRows.filter(Boolean),
      })
    },
  )

  /**
   * GET /sync/pull
   *
   * Retorna todos os dados do usuário (para restaurar em novo dispositivo).
   */
  app.get(
    '/sync/pull',
    {
      ...auth,
      schema: {
        response: { 200: pullResponseSchema },
      },
    },
    async (request, reply) => {
      const userId = request.user.sub

      const [userWorkouts, userTemplates, userCustomExercises, userPrograms] = await Promise.all([
        app.db.select().from(workouts).where(eq(workouts.userId, userId)),
        app.db.select().from(templates).where(eq(templates.userId, userId)),
        app.db.select().from(customExercises).where(eq(customExercises.userId, userId)),
        app.db.select().from(programs).where(eq(programs.userId, userId)),
      ])

      return reply.code(200).send({
        workouts: userWorkouts,
        templates: userTemplates,
        customExercises: userCustomExercises,
        programs: userPrograms,
      })
    },
  )
}
