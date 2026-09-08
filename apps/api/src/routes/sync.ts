import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { customExercises, workouts, templates, programs } from '../db/schema.js'
import {
  workoutSessionSchema,
  workoutTemplateSchema,
  customExerciseSchema,
  programSchema,
  deletedWorkoutTombstoneSchema,
} from '../schemas/domain.js'
import { performSync, type SyncRepo, type TableRepo, type EntityRow, type WorkoutRow } from './syncLogic.js'

// ---------------------------------------------------------------------------
// Schemas de request/response. Os schemas de DOMÍNIO vêm de ../schemas/domain
// (fonte única, com paridade verificada em compilação contra @powerlifting/shared
// — issue #264; antes cada rota tinha uma cópia divergente que STRIPAVA campos).
// ---------------------------------------------------------------------------

const workoutRowSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  data: z.unknown(),
  startedAt: z.string().or(z.date()),
  finishedAt: z.string().or(z.date()).nullable(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  syncedAt: z.string().or(z.date()).nullable(),
})

const entityRowSchema = z.object({
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
  // Opcional para compatibilidade com clientes antigos que não enviam tombstones.
  deletedWorkouts: z.array(deletedWorkoutTombstoneSchema).optional(),
})

const syncResponseSchema = z.object({
  workouts: z.array(workoutRowSchema),
  templates: z.array(entityRowSchema),
  customExercises: z.array(entityRowSchema),
  programs: z.array(entityRowSchema),
  deletedWorkoutIds: z.array(z.string()),
})

const pullResponseSchema = z.object({
  workouts: z.array(workoutRowSchema),
  templates: z.array(entityRowSchema),
  customExercises: z.array(entityRowSchema),
  programs: z.array(entityRowSchema),
})

const resetResponseSchema = z.object({
  ok: z.literal(true),
  deleted: z.object({
    workouts: z.number(),
    templates: z.number(),
    customExercises: z.number(),
    programs: z.number(),
  }),
})

// ---------------------------------------------------------------------------
// Repo drizzle: adapta as 4 tabelas à interface fina que a lógica pura usa.
// `db` é a TRANSAÇÃO — o POST /sync inteiro é atômico (falha parcial não pode
// mais deixar o usuário sem dados, como o delete-all de custom exercises fazia).
// ---------------------------------------------------------------------------

type DrizzleDb = Parameters<Parameters<import('../db/index.js').Db['transaction']>[0]>[0]

function tableRepo<Row extends EntityRow>(
  db: DrizzleDb,
  table: typeof workouts | typeof templates | typeof programs | typeof customExercises,
  userId: string,
): TableRepo<Row> {
  return {
    async get(id) {
      const [row] = await db
        .select()
        .from(table)
        .where(and(eq(table.id, id), eq(table.userId, userId)))
        .limit(1)
      return row as Row | undefined
    },
    async insert(row) {
      const [inserted] = await db.insert(table).values(row).returning()
      return inserted as Row
    },
    async update(id, patch) {
      const [updated] = await db
        .update(table)
        .set(patch)
        .where(and(eq(table.id, id), eq(table.userId, userId)))
        .returning()
      return updated as Row
    },
  }
}

function createSyncRepo(db: DrizzleDb, userId: string): SyncRepo {
  return {
    workouts: tableRepo<WorkoutRow>(db, workouts, userId),
    templates: tableRepo(db, templates, userId),
    programs: tableRepo(db, programs, userId),
    customExercises: tableRepo(db, customExercises, userId),
  }
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export const syncRoutes: FastifyPluginAsyncZod = async (app) => {
  const auth = { preHandler: [app.authenticate] }

  /**
   * POST /sync
   *
   * Recebe os itens PENDENTES do cliente e faz upsert last-write-wins por
   * updatedAt em todas as entidades, numa única transação. Exclusões de
   * workout chegam como tombstones e viram data.deleted = true no servidor
   * (a linha fica, para o LWW derrotar pushes atrasados de outros devices).
   * Semântica completa em ./syncLogic.ts.
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
      const now = new Date()

      const result = await app.db.transaction(async (tx) =>
        performSync(createSyncRepo(tx, userId), userId, request.body, now),
      )

      return reply.code(200).send(result)
    },
  )

  /**
   * GET /sync/pull
   *
   * Retorna todos os dados do usuário (para restaurar em novo dispositivo).
   * Linhas com data.deleted = true SÃO retornadas — o cliente filtra no merge
   * (precisa saber da exclusão para não ressuscitar a cópia local).
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

  /**
   * POST /sync/reset
   *
   * Apaga TODOS os dados do usuário no servidor, numa transação. Usado pelo
   * "Resetar dados" do app (issue #264: o reset local era desfeito pelo pull
   * seguinte) e pelo reseed da conta demo. Irreversível — a confirmação é
   * responsabilidade da UI.
   */
  app.post(
    '/sync/reset',
    {
      ...auth,
      schema: {
        response: { 200: resetResponseSchema },
      },
    },
    async (request, reply) => {
      const userId = request.user.sub

      const deleted = await app.db.transaction(async (tx) => {
        const w = await tx.delete(workouts).where(eq(workouts.userId, userId)).returning({ id: workouts.id })
        const t = await tx.delete(templates).where(eq(templates.userId, userId)).returning({ id: templates.id })
        const c = await tx
          .delete(customExercises)
          .where(eq(customExercises.userId, userId))
          .returning({ id: customExercises.id })
        const p = await tx.delete(programs).where(eq(programs.userId, userId)).returning({ id: programs.id })
        return { workouts: w.length, templates: t.length, customExercises: c.length, programs: p.length }
      })

      return reply.code(200).send({ ok: true as const, deleted })
    },
  )
}
