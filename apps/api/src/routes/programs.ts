import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { programs } from '../db/schema.js'

const paramsSchema = z.object({ id: z.string().uuid() })
const messageSchema = z.object({ message: z.string() })

export const programRoutes: FastifyPluginAsyncZod = async (app) => {
  const auth = { preHandler: [app.authenticate] }

  // DELETE /programs/:id — remove um programa
  app.delete(
    '/programs/:id',
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
        .delete(programs)
        .where(and(eq(programs.id, id), eq(programs.userId, userId)))
        .returning({ id: programs.id })

      if (!row) {
        return reply.code(404).send({ message: 'Programa não encontrado' })
      }

      return reply.code(204).send()
    },
  )
}
