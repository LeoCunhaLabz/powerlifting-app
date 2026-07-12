import { z } from 'zod'
import { eq, and, gt, isNull } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { OAuth2Client } from 'google-auth-library'
import { users, sessions, passwordResetTokens } from '../db/schema.js'
import { env } from '../env.js'
import {
  hashPassword,
  verifyPassword,
  generateRefreshToken,
  generatePasswordResetToken,
  hashRefreshToken,
  hashToken,
  durationToMs,
} from '../lib/auth.js'
import { sendEmail, buildPasswordResetEmail } from '../lib/mailer.js'

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
const errorMessageSchema = messageSchema.extend({ code: z.string() })

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

const forgotBodySchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
})

const resetBodySchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
})

/** Base pública do app para montar o link de redefinição (sem barra final). */
function resetUrlBase(): string {
  return (env.APP_PUBLIC_URL ?? env.CORS_ORIGIN).replace(/\/$/, '')
}

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
          409: errorMessageSchema,
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
        return reply.code(409).send({ code: 'EMAIL_ALREADY_REGISTERED', message: 'E-mail já cadastrado' })
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
          return reply.code(409).send({ code: 'EMAIL_ALREADY_REGISTERED', message: 'E-mail já cadastrado' })
        }
        throw error
      }

      if (!user) {
        return reply.code(409).send({ code: 'EMAIL_ALREADY_REGISTERED', message: 'E-mail já cadastrado' })
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
          401: errorMessageSchema,
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
      if (!user || !valid) {
        return reply.code(401).send({ code: 'INVALID_CREDENTIALS', message: 'Credenciais inválidas' })
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
          401: errorMessageSchema,
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
        return reply.code(401).send({ code: 'INVALID_REFRESH_TOKEN', message: 'Sessão inválida. Entre novamente.' })
      }

      if (session.expiresAt.getTime() < Date.now()) {
        return reply.code(401).send({ code: 'EXPIRED_REFRESH_TOKEN', message: 'Sua sessão expirou. Entre novamente.' })
      }

      const [user] = await app.db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(eq(users.id, session.userId))
        .limit(1)

      if (!user) {
        return reply.code(401).send({ code: 'INVALID_REFRESH_TOKEN', message: 'Sessão inválida. Entre novamente.' })
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
          401: errorMessageSchema,
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
        return reply.code(401).send({ code: 'UNAUTHORIZED', message: 'Não autorizado' })
      }

      return reply.send(user)
    },
  )

  // ---------------------------------------------------------------------------
  // DELETE /auth/me — exclui a conta do usuário autenticado (cascade remove
  // sessões, workouts, templates e tokens de redefinição via FKs onDelete).
  // ---------------------------------------------------------------------------
  app.delete(
    '/auth/me',
    {
      preHandler: app.authenticate,
      schema: {
        response: {
          204: z.undefined(),
          401: errorMessageSchema,
        },
      },
    },
    async (request, reply) => {
      await app.db.delete(users).where(eq(users.id, request.user.sub))
      return reply.code(204).send()
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
          400: errorMessageSchema,
          503: errorMessageSchema,
        },
      },
    },
    async (request, reply) => {
      if (!env.GOOGLE_CLIENT_ID) {
        return reply.code(503).send({
          code: 'GOOGLE_AUTH_UNAVAILABLE',
          message: 'Login com Google não está configurado neste servidor.',
        })
      }

      const client = new OAuth2Client(env.GOOGLE_CLIENT_ID)
      let payload: { email?: string; name?: string; sub?: string; email_verified?: boolean } | undefined
      try {
        const ticket = await client.verifyIdToken({
          idToken: request.body.credential,
          audience: env.GOOGLE_CLIENT_ID,
        })
        payload = ticket.getPayload()
      } catch {
        return reply.code(400).send({
          code: 'INVALID_GOOGLE_CREDENTIAL',
          message: 'Credencial do Google inválida ou expirada.',
        })
      }

      if (!payload?.email || !payload.sub || payload.email_verified !== true) {
        return reply.code(400).send({ code: 'INVALID_GOOGLE_CREDENTIAL', message: 'Credencial do Google inválida.' })
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
        try {
          const inserted = await app.db
            .insert(users)
            .values({ name, email, passwordHash: null })
            .returning({ id: users.id, email: users.email, name: users.name })
          user = inserted[0]
        } catch (error: unknown) {
          // Corrida de concorrência: outro request criou o usuário antes (unique violation)
          if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
            const [existing] = await app.db
              .select({ id: users.id, email: users.email, name: users.name })
              .from(users)
              .where(eq(users.email, email))
              .limit(1)
            user = existing
          } else {
            throw error
          }
        }
      }

      if (!user) {
        return reply.code(400).send({ code: 'ACCOUNT_CREATION_FAILED', message: 'Não foi possível criar a conta.' })
      }

      const accessToken = app.jwt.sign({ sub: user.id, email: user.email })
      const refreshToken = await issueRefreshToken(app, user.id)

      return reply.send({ accessToken, refreshToken, user })
    },
  )

  // ---------------------------------------------------------------------------
  // POST /auth/forgot — inicia a redefinição: gera token e envia o link por e-mail.
  // Resposta sempre genérica (200) para não revelar quais e-mails têm conta.
  // ---------------------------------------------------------------------------
  app.post(
    '/auth/forgot',
    {
      config: authRateLimit,
      schema: {
        body: forgotBodySchema,
        response: { 200: messageSchema },
      },
    },
    async (request, reply) => {
      const email = request.body.email.trim().toLowerCase()
      const genericMessage = 'Se houver uma conta com este e-mail, enviaremos instruções para redefinir a senha.'

      const [user] = await app.db
        .select({ id: users.id, email: users.email, name: users.name })
        .from(users)
        .where(eq(users.email, email))
        .limit(1)

      if (user) {
        const token = generatePasswordResetToken()
        const expiresAt = new Date(Date.now() + durationToMs(env.PASSWORD_RESET_EXPIRES_IN))
        await app.db.insert(passwordResetTokens).values({
          userId: user.id,
          tokenHash: hashToken(token),
          expiresAt,
        })

        const resetUrl = `${resetUrlBase()}/?reset_token=${encodeURIComponent(token)}`
        try {
          const { subject, html, text } = buildPasswordResetEmail(resetUrl, user.name)
          await sendEmail({ to: user.email, subject, html, text })
        } catch (error) {
          // Não vaza o erro ao cliente; apenas registra (a resposta segue genérica).
          app.log.error({ err: error }, 'Falha ao enviar e-mail de redefinição de senha')
        }
      }

      return reply.send({ message: genericMessage })
    },
  )

  // ---------------------------------------------------------------------------
  // POST /auth/reset — consome um token válido e define a nova senha.
  // Invalida o token e todas as sessões ativas do usuário.
  // ---------------------------------------------------------------------------
  app.post(
    '/auth/reset',
    {
      config: authRateLimit,
      schema: {
        body: resetBodySchema,
        response: {
          200: messageSchema,
          400: errorMessageSchema,
        },
      },
    },
    async (request, reply) => {
      const { token, password } = request.body
      const tokenHash = hashToken(token)

      const [record] = await app.db
        .select({ id: passwordResetTokens.id, userId: passwordResetTokens.userId })
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.tokenHash, tokenHash),
            isNull(passwordResetTokens.usedAt),
            gt(passwordResetTokens.expiresAt, new Date()),
          ),
        )
        .limit(1)

      if (!record) {
        return reply.code(400).send({
          code: 'INVALID_RESET_LINK',
          message: 'Link de redefinição inválido ou expirado. Solicite um novo.',
        })
      }

      const passwordHash = await hashPassword(password)
      await app.db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, record.userId))

      // Invalida o token usado e todas as sessões ativas (força novo login).
      await app.db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, record.id))
      await app.db.delete(sessions).where(eq(sessions.userId, record.userId))

      return reply.send({ message: 'Senha redefinida com sucesso. Faça login com a nova senha.' })
    },
  )
}
