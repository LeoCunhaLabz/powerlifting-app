import { z } from 'zod'
import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { OAuth2Client } from 'google-auth-library'
import { users, sessions } from '../db/schema.js'
import { env } from '../env.js'
import {
  hashPassword,
  verifyPassword,
  generateRefreshToken,
  hashRefreshToken,
  durationToMs,
} from '../lib/auth.js'

const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
})

const tokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
})

const authResponseSchema = tokensSchema.extend({ user: userSchema })

const messageSchema = z.object({ message: z.string() })

const registerBodySchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(8).max(128),
})

const loginBodySchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(1).max(128),
})

const refreshBodySchema = z.object({
  refreshToken: z.string().min(1),
})

const authRateLimit = { rateLimit: { max: 10, timeWindow: '1 minute' } }

/** Cria uma nova sessão (refresh token) para o usuário e retorna o token em texto puro. */
async function issueRefreshToken(app: FastifyInstance, userId: string): Promise<string> {
  const refreshToken = generateRefreshToken()
  const expiresAt = new Date(Date.now() + durationToMs(env.REFRESH_TOKEN_EXPIRES_IN))
  await app.db.insert(sessions).values({
    userId,
    refreshTokenHash: hashRefreshToken(refreshToken),
    expiresAt,
  })
  return refreshToken
}

export const authRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/auth/register',
    {
      config: authRateLimit,
      schema: {
        body: registerBodySchema,
        response: {
          201: authResponseSchema,
          409: messageSchema,
        },
      },
    },
    async (request, reply) => {
      const { name, email, password } = request.body

      const [existing] = await app.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1)

      if (existing) {
        return reply.code(409).send({ message: 'E-mail já cadastrado' })
      }

      const passwordHash = await hashPassword(password)
      let user:
        | {
            id: string
            email: string
            name: string
          }
        | undefined
      try {
        ;[user] = await app.db
          .insert(users)
          .values({ name, email, passwordHash })
          .returning({ id: users.id, email: users.email, name: users.name })
      } catch (error: unknown) {
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
          return reply.code(409).send({ message: 'E-mail já cadastrado' })
        }
        throw error
      }

      if (!user) {
        return reply.code(409).send({ message: 'E-mail já cadastrado' })
      }

      const accessToken = app.jwt.sign({ sub: user.id, email: user.email })
      const refreshToken = await issueRefreshToken(app, user.id)

      return reply.code(201).send({ accessToken, refreshToken, user })
    },
  )

  app.post(
    '/auth/login',
    {
      config: authRateLimit,
      schema: {
        body: loginBodySchema,
        response: {
          200: authResponseSchema,
          401: messageSchema,
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body
      const normalizedEmail = email.trim().toLowerCase()

      const [user] = await app.db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          passwordHash: users.passwordHash,
        })
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1)

      const valid = user?.passwordHash
        ? await verifyPassword(password, user.passwordHash)
        : false
      // Conta só-Google (sem senha) → mensagem específica para melhor UX
      if (user && !user.passwordHash) {
        return reply.code(401).send({ message: 'Esta conta usa login com Google. Use o botão "Entrar com Google".' })
      }
      if (!user || !valid) {
        return reply.code(401).send({ message: 'Credenciais inválidas' })
      }

      const accessToken = app.jwt.sign({ sub: user.id, email: user.email })
      const refreshToken = await issueRefreshToken(app, user.id)

      return reply.send({
        accessToken,
        refreshToken,
        user: { id: user.id, email: user.email, name: user.name },
      })
    },
  )

  app.post(
    '/auth/refresh',
    {
      config: authRateLimit,
      schema: {
        body: refreshBodySchema,
        response: {
          200: tokensSchema,
          401: messageSchema,
        },
      },
    },
    async (request, reply) => {
      const tokenHash = hashRefreshToken(request.body.refreshToken)

      const [session] = await app.db
        .delete(sessions)
        .where(eq(sessions.refreshTokenHash, tokenHash))
        .returning({
          id: sessions.id,
          userId: sessions.userId,
          expiresAt: sessions.expiresAt,
        })

      if (!session) {
        return reply.code(401).send({ message: 'Refresh token inválido' })
      }

      if (session.expiresAt.getTime() < Date.now()) {
        return reply.code(401).send({ message: 'Refresh token expirado' })
      }

      const [user] = await app.db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(eq(users.id, session.userId))
        .limit(1)

      if (!user) {
        return reply.code(401).send({ message: 'Refresh token inválido' })
      }

      const accessToken = app.jwt.sign({ sub: user.id, email: user.email })
      const refreshToken = await issueRefreshToken(app, user.id)

      return reply.send({ accessToken, refreshToken })
    },
  )

  app.post(
    '/auth/logout',
    {
      config: authRateLimit,
      schema: {
        body: refreshBodySchema,
        response: {
          204: z.undefined(),
        },
      },
    },
    async (request, reply) => {
      const tokenHash = hashRefreshToken(request.body.refreshToken)
      await app.db.delete(sessions).where(eq(sessions.refreshTokenHash, tokenHash))
      return reply.code(204).send()
    },
  )

  app.get(
    '/auth/me',
    {
      preHandler: app.authenticate,
      schema: {
        response: {
          200: userSchema,
          401: messageSchema,
        },
      },
    },
    async (request, reply) => {
      const [user] = await app.db
        .select({ id: users.id, email: users.email, name: users.name })
        .from(users)
        .where(eq(users.id, request.user.sub))
        .limit(1)

      if (!user) {
        return reply.code(401).send({ message: 'Não autorizado' })
      }

      return reply.send(user)
    },
  )

  // ---------------------------------------------------------------------------
  // POST /auth/google — verifica id_token do Google, cria/vincula usuário
  // ---------------------------------------------------------------------------
  app.post(
    '/auth/google',
    {
      config: authRateLimit,
      schema: {
        body: z.object({ credential: z.string().min(1) }),
        response: {
          200: authResponseSchema,
          400: messageSchema,
          503: messageSchema,
        },
      },
    },
    async (request, reply) => {
      if (!env.GOOGLE_CLIENT_ID) {
        return reply.code(503).send({ message: 'Login com Google não está configurado neste servidor.' })
      }

      const client = new OAuth2Client(env.GOOGLE_CLIENT_ID)
      let payload: { email?: string; name?: string; sub?: string } | undefined
      try {
        const ticket = await client.verifyIdToken({
          idToken: request.body.credential,
          audience: env.GOOGLE_CLIENT_ID,
        })
        payload = ticket.getPayload()
      } catch {
        return reply.code(400).send({ message: 'Credencial do Google inválida ou expirada.' })
      }

      if (!payload?.email || !payload.sub) {
        return reply.code(400).send({ message: 'Credencial do Google inválida.' })
      }

      const email = payload.email.trim().toLowerCase()
      const name = payload.name ?? email.split('@')[0]

      // Busca usuário existente pelo e-mail
      let [user] = await app.db
        .select({ id: users.id, email: users.email, name: users.name })
        .from(users)
        .where(eq(users.email, email))
        .limit(1)

      // Cria novo usuário (passwordHash = null para contas Google)
      if (!user) {
        const inserted = await app.db
          .insert(users)
          .values({ name, email, passwordHash: null })
          .returning({ id: users.id, email: users.email, name: users.name })
        user = inserted[0]
      }

      if (!user) {
        return reply.code(400).send({ message: 'Não foi possível criar a conta.' })
      }

      const accessToken = app.jwt.sign({ sub: user.id, email: user.email })
      const refreshToken = await issueRefreshToken(app, user.id)

      return reply.send({ accessToken, refreshToken, user })
    },
  )
}
