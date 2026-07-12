import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod'
import type { ZodIssue } from 'zod'

export const VALIDATION_ERROR_CODE = 'VALIDATION_ERROR' as const

export interface ValidationErrorResponse {
  statusCode: 400
  code: typeof VALIDATION_ERROR_CODE
  message: string
}

const FIELD_LABELS: Record<string, string> = {
  credential: 'credencial',
  email: 'e-mail',
  name: 'nome',
  password: 'senha',
  refreshToken: 'sessão',
  token: 'link de redefinição',
}

const getFieldLabel = (issue: ZodIssue): string | undefined => {
  const lastSegment = issue.path.at(-1)
  return lastSegment === undefined ? undefined : FIELD_LABELS[String(lastSegment)]
}

const formatRequiredField = (field: string): string => {
  if (field === 'link de redefinição') {
    return 'Link de redefinição inválido. Solicite um novo.'
  }

  if (field === 'sessão') {
    return 'Sua sessão é inválida. Entre novamente.'
  }

  return `Informe ${field === 'senha' || field === 'credencial' ? 'a' : 'o'} ${field}.`
}

export const formatZodValidationMessage = (issues: readonly ZodIssue[]): string => {
  const issue = issues[0]

  if (!issue) {
    return 'Dados inválidos. Revise os campos enviados.'
  }

  const field = getFieldLabel(issue)
  if (!field) {
    return 'Dados inválidos. Revise os campos enviados.'
  }

  if (field === 'e-mail' && issue.code === 'invalid_string') {
    return 'Informe um e-mail válido.'
  }

  if (issue.code === 'invalid_type') {
    return formatRequiredField(field)
  }

  if (issue.code === 'too_small') {
    if (field === 'senha' && typeof issue.minimum === 'number' && issue.minimum > 1) {
      return `A senha deve ter ao menos ${issue.minimum} caracteres.`
    }

    return formatRequiredField(field)
  }

  if (issue.code === 'too_big' && typeof issue.maximum === 'number') {
    return `${field === 'senha' ? 'A' : 'O'} ${field} deve ter no máximo ${issue.maximum} caracteres.`
  }

  return 'Dados inválidos. Revise os campos enviados.'
}

export const buildValidationErrorResponse = (error: unknown): ValidationErrorResponse | null => {
  if (!hasZodFastifySchemaValidationErrors(error)) {
    return null
  }

  const issues = error.validation.map((validationError) => validationError.params.issue)

  return {
    statusCode: 400,
    code: VALIDATION_ERROR_CODE,
    message: formatZodValidationMessage(issues),
  }
}
