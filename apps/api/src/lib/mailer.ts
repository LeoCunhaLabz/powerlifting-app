import { env } from '../env.js'

interface SendEmailArgs {
  to: string
  subject: string
  html: string
  text: string
}

/**
 * Envia um e-mail. Usa a API HTTP do Resend (sem dependência extra — `fetch` nativo do Node 20+)
 * quando `RESEND_API_KEY` + `EMAIL_FROM` estão configurados. Caso contrário (dev), apenas registra
 * o conteúdo no log para que o link de redefinição seja acessível durante o desenvolvimento.
 *
 * Retorna `true` se o e-mail foi efetivamente enviado por um provedor; `false` no fallback de log.
 */
export async function sendEmail({ to, subject, html, text }: SendEmailArgs): Promise<boolean> {
  if (env.RESEND_API_KEY && env.EMAIL_FROM) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: env.EMAIL_FROM, to, subject, html, text }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`Falha ao enviar e-mail via Resend (${res.status}): ${body}`)
    }
    return true
  }

  // Fallback de desenvolvimento: nenhum provedor configurado.
  console.info(`[mailer] (dev — sem provedor) Para: ${to}\nAssunto: ${subject}\n${text}`)
  return false
}

/** Monta o e-mail de redefinição de senha (assunto + html + texto). */
export function buildPasswordResetEmail(resetUrl: string, name: string): { subject: string; html: string; text: string } {
  const subject = 'Redefinição de senha — ONYX'
  const greeting = name ? `Olá, ${name}` : 'Olá'
  const text = `${greeting}!\n\nRecebemos um pedido para redefinir sua senha no ONYX.\n` +
    `Abra o link abaixo para criar uma nova senha (válido por tempo limitado):\n\n${resetUrl}\n\n` +
    'Se você não solicitou isso, ignore este e-mail — sua senha continua a mesma.'
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
      <h2 style="font-size: 20px;">Redefinição de senha</h2>
      <p>${greeting}! Recebemos um pedido para redefinir sua senha no <strong>ONYX</strong>.</p>
      <p>
        <a href="${resetUrl}" style="display: inline-block; background: #e3a83b; color: #1a1a1a; font-weight: bold; padding: 12px 20px; border-radius: 8px; text-decoration: none;">
          Criar nova senha
        </a>
      </p>
      <p style="font-size: 13px; color: #555;">Ou copie e cole este endereço no navegador:<br>${resetUrl}</p>
      <p style="font-size: 13px; color: #555;">Se você não solicitou isso, ignore este e-mail — sua senha continua a mesma.</p>
    </div>`
  return { subject, html, text }
}
