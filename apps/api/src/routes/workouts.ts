import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { workouts } from '../db/schema.js'
// Schema de domínio da fonte única (paridade com @powerlifting/shared garantida
// em compilação — issue #264). A cópia local antiga stripava templateId/notes/restSeconds.
import { workoutSessionSchema as workoutSessionDataSchema } from '../schemas/domain.js'

const createBodySchema = z.object({
  data: workoutSessionDataSchema,
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime().optional(),
})

const updateBodySchema = z.object({
  data: workoutSessionDataSchema.optional(),
  finishedAt: z.string().datetime().optional(),
  syncedAt: z.string().datetime().optional(),
})

const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

const paramsSchema = z.object({ id: z.string().uuid() })

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

const messageSchema = z.object({ message: z.string() })

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export const workoutRoutes: FastifyPluginAsyncZod = async (app) => {
  const auth = { preHandler: [app.authenticate] }

  // GET /workouts — lista paginada do usuário autenticado
  app.get(
    '/workouts',
    {
      ...auth,
      schema: {
        querystring: paginationSchema,
        response: { 200: z.array(workoutRowSchema) },
      },
    },
    async (request, reply) => {
      const userId = request.user.sub
      const { limit, offset } = request.query

      const rows = await app.db
        .select()
        .from(workouts)
        .where(eq(workouts.userId, userId))
        .limit(limit)
        .offset(offset)
        .orderBy(workouts.startedAt)

      return reply.code(200).send(rows)
    },
  )

  // POST /workouts — cria um workout
  app.post(
    '/workouts',
    {
      ...auth,
      schema: {
        body: createBodySchema,
        response: { 201: workoutRowSchema },
      },
    },
    async (request, reply) => {
      const userId = request.user.sub
      const { data, startedAt, finishedAt } = request.body

      const [row] = await app.db
        .insert(workouts)
        .values({
          userId,
          data,
          startedAt: new Date(startedAt),
          finishedAt: finishedAt ? new Date(finishedAt) : null,
        })
        .returning()

      return reply.code(201).send(row)
    },
  )

  // GET /workouts/:id — obtém um workout
  app.get(
    '/workouts/:id',
    {
      ...auth,
      schema: {
        params: paramsSchema,
        response: { 200: workoutRowSchema, 404: messageSchema },
      },
    },
    async (request, reply) => {
      const userId = request.user.sub
      const { id } = request.params

      const [row] = await app.db
        .select()
        .from(workouts)
        .where(and(eq(workouts.id, id), eq(workouts.userId, userId)))
        .limit(1)

      if (!row) {
        return reply.code(404).send({ message: 'Workout não encontrado' })
      }

      return reply.code(200).send(row)
    },
  )

  // PUT /workouts/:id — atualiza um workout
  app.put(
    '/workouts/:id',
    {
      ...auth,
      schema: {
        params: paramsSchema,
        body: updateBodySchema,
        response: { 200: workoutRowSchema, 404: messageSchema },
      },
    },
    async (request, reply) => {
      const userId = request.user.sub
      const { id } = request.params
      const body = request.body

      const updateValues: Partial<typeof workouts.$inferInsert> = {}
      if (body.data !== undefined) updateValues.data = body.data
      if (body.finishedAt !== undefined) updateValues.finishedAt = new Date(body.finishedAt)
      if (body.syncedAt !== undefined) updateValues.syncedAt = new Date(body.syncedAt)

      const [row] = await app.db
        .update(workouts)
        .set(updateValues)
        .where(and(eq(workouts.id, id), eq(workouts.userId, userId)))
        .returning()

      if (!row) {
        return reply.code(404).send({ message: 'Workout não encontrado' })
      }

      return reply.code(200).send(row)
    },
  )

  // DELETE /workouts/:id — remove um workout
  app.delete(
    '/workouts/:id',
    {
      ...auth,
      schema: {
        params: paramsSchema,
        response: { 204: z.undefined(), 404: messageSchema },
      },
    },
    async (request, reply) => {
      const userId = request.user.sub
      const { id } = request.params

      const [row] = await app.db
        .delete(workouts)
        .where(and(eq(workouts.id, id), eq(workouts.userId, userId)))
        .returning({ id: workouts.id })

      if (!row) {
        return reply.code(404).send({ message: 'Workout não encontrado' })
      }

      return reply.code(204).send()
    },
  )
}
