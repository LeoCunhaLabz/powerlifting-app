import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { templates } from '../db/schema.js'

// ---------------------------------------------------------------------------
// Zod schemas (espelham os tipos de @powerlifting/shared sem importar o pacote)
// ---------------------------------------------------------------------------

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

const workoutTemplateDataSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string(),
  exercises: z.array(templateExerciseSchema),
  isBuiltIn: z.boolean().optional(),
})

const createBodySchema = z.object({
  data: workoutTemplateDataSchema,
})

const updateBodySchema = z.object({
  data: workoutTemplateDataSchema,
})

const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

const paramsSchema = z.object({ id: z.string().uuid() })

const templateRowSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  data: z.unknown(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
})

const messageSchema = z.object({ message: z.string() })

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export const templateRoutes: FastifyPluginAsyncZod = async (app) => {
  const auth = { preHandler: [app.authenticate] }

  // GET /templates — lista paginada do usuário autenticado
  app.get(
    '/templates',
    {
      ...auth,
      schema: {
        querystring: paginationSchema,
        response: { 200: z.array(templateRowSchema) },
      },
    },
    async (request, reply) => {
      const userId = request.user.sub
      const { limit, offset } = request.query

      const rows = await app.db
        .select()
        .from(templates)
        .where(eq(templates.userId, userId))
        .limit(limit)
        .offset(offset)
        .orderBy(templates.createdAt)

      return reply.code(200).send(rows)
    },
  )

  // POST /templates — cria um template
  app.post(
    '/templates',
    {
      ...auth,
      schema: {
        body: createBodySchema,
        response: { 201: templateRowSchema },
      },
    },
    async (request, reply) => {
      const userId = request.user.sub
      const { data } = request.body

      const [row] = await app.db
        .insert(templates)
        .values({ userId, data })
        .returning()

      return reply.code(201).send(row)
    },
  )

  // GET /templates/:id — obtém um template
  app.get(
    '/templates/:id',
    {
      ...auth,
      schema: {
        params: paramsSchema,
        response: { 200: templateRowSchema, 404: messageSchema },
      },
    },
    async (request, reply) => {
      const userId = request.user.sub
      const { id } = request.params

      const [row] = await app.db
        .select()
        .from(templates)
        .where(and(eq(templates.id, id), eq(templates.userId, userId)))
        .limit(1)

      if (!row) {
        return reply.code(404).send({ message: 'Template não encontrado' })
      }

      return reply.code(200).send(row)
    },
  )

  // PUT /templates/:id — atualiza um template
  app.put(
    '/templates/:id',
    {
      ...auth,
      schema: {
        params: paramsSchema,
        body: updateBodySchema,
        response: { 200: templateRowSchema, 404: messageSchema },
      },
    },
    async (request, reply) => {
      const userId = request.user.sub
      const { id } = request.params
      const { data } = request.body

      const [row] = await app.db
        .update(templates)
        .set({ data, updatedAt: new Date() })
        .where(and(eq(templates.id, id), eq(templates.userId, userId)))
        .returning()

      if (!row) {
        return reply.code(404).send({ message: 'Template não encontrado' })
      }

      return reply.code(200).send(row)
    },
  )

  // DELETE /templates/:id — remove um template
  app.delete(
    '/templates/:id',
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
        .delete(templates)
        .where(and(eq(templates.id, id), eq(templates.userId, userId)))
        .returning({ id: templates.id })

      if (!row) {
        return reply.code(404).send({ message: 'Template não encontrado' })
      }

      return reply.code(204).send()
    },
  )
}
