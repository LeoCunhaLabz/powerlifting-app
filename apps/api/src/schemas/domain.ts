import { z } from 'zod'
import type {
  SetState,
  ExerciseState,
  WorkoutSession,
  DeletedWorkoutTombstone,
  TemplateExercise,
  WorkoutTemplate,
  WeekOverride,
  Program,
  CustomExercise,
} from '@powerlifting/shared'

// ---------------------------------------------------------------------------
// Schemas Zod do domínio — FONTE ÚNICA para todas as rotas da API.
//
// Por que existe: até a issue #264 cada rota mantinha uma cópia própria
// "espelhando" os tipos de @powerlifting/shared sem importá-los. As cópias
// divergiram e, como z.object() faz STRIP de chaves não declaradas, campos
// reais (templateId, notes, restSeconds, archived, deleted...) eram apagados
// silenciosamente no round-trip de sync — perda de dados em produção.
//
// Como o drift é impedido agora: cada schema é verificado em TEMPO DE
// COMPILAÇÃO contra o tipo do shared via assertExact abaixo. Adicionar um
// campo na interface sem adicionar no schema quebra o build da API (e
// vice-versa). O import do shared é type-only (apagado na compilação), então
// não há dependência de runtime nem impacto no bundle.
//
// Ao adicionar um campo num tipo do shared: adicione-o aqui no schema
// correspondente no MESMO PR — o tsc aponta o lugar exato.
// ---------------------------------------------------------------------------

/**
 * Igualdade estrutural exata entre dois tipos.
 *
 * ATENÇÃO: assignability bidirecional sozinha ([A] extends [B] && [B] extends [A])
 * NÃO acusa campo OPCIONAL ausente ({} é atribuível a {a?: T} e vice-versa) —
 * exatamente o drift que este arquivo existe para impedir. Por isso o check também
 * compara os CONJUNTOS DE CHAVES do primeiro nível. Campos aninhados são cobertos
 * pelos assertExact dos schemas de cada nível (todo objeto tem o seu).
 */
type SameKeys<A, B> = [Exclude<keyof A, keyof B>] extends [never]
  ? [Exclude<keyof B, keyof A>] extends [never]
    ? true
    : false
  : false
type Exact<A, B> = SameKeys<A, B> extends true
  ? [A] extends [B]
    ? [B] extends [A]
      ? true
      : false
    : false
  : false
function assertExact<A, B>(_ok: Exact<A, B>): void {
  // Função vazia de propósito: o valor `true` só compila quando A ≡ B.
}

export const setStateSchema = z.object({
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
assertExact<z.infer<typeof setStateSchema>, SetState>(true)

export const exerciseStateSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  sets: z.array(setStateSchema),
  notes: z.string().optional(),
  restSeconds: z.number().optional(),
})
assertExact<z.infer<typeof exerciseStateSchema>, ExerciseState>(true)

export const workoutSessionSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  date: z.string(),
  duration: z.number().nonnegative(),
  exercises: z.array(exerciseStateSchema),
  notes: z.string().optional(),
  templateId: z.string().optional(),
  updatedAt: z.string().optional(),
  syncedAt: z.string().optional(),
})
assertExact<z.infer<typeof workoutSessionSchema>, WorkoutSession>(true)

export const deletedWorkoutTombstoneSchema = z.object({
  id: z.string(),
  deletedAt: z.string(),
  syncedAt: z.string().optional(),
})
assertExact<z.infer<typeof deletedWorkoutTombstoneSchema>, DeletedWorkoutTombstone>(true)

export const templateSetSchema = z.object({
  reps: z.number().int().positive(),
  rpe: z.number().min(6).max(10).optional(),
  weightPercentage: z.number().min(0).max(100).optional(),
  type: z.enum(['W', 'N', 'D']),
})
assertExact<z.infer<typeof templateSetSchema>, TemplateExercise['sets'][number]>(true)

export const templateExerciseSchema = z.object({
  name: z.string().min(1),
  notes: z.string().optional(),
  restSeconds: z.number().optional(),
  expectedWeight: z.number().optional(),
  sets: z.array(templateSetSchema),
})
assertExact<z.infer<typeof templateExerciseSchema>, TemplateExercise>(true)

export const workoutTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string(),
  notes: z.string().optional(),
  exercises: z.array(templateExerciseSchema),
  isBuiltIn: z.boolean().optional(),
  archived: z.boolean().optional(),
  deleted: z.boolean().optional(),
  updatedAt: z.string().optional(),
  syncedAt: z.string().optional(),
})
assertExact<z.infer<typeof workoutTemplateSchema>, WorkoutTemplate>(true)

export const weekOverrideSchema = z.object({
  weekIndex: z.number().int().nonnegative(),
  exerciseName: z.string().min(1),
  reps: z.number().int().positive().optional(),
  weightPercentage: z.number().min(0).max(100).optional(),
  rpe: z.number().min(6).max(10).optional(),
  weight: z.number().optional(),
  sets: z.number().int().positive().optional(),
})
assertExact<z.infer<typeof weekOverrideSchema>, WeekOverride>(true)

export const programSchema = z.object({
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
  deleted: z.boolean().optional(),
  syncedAt: z.string().optional(),
})
assertExact<z.infer<typeof programSchema>, Program>(true)

export const customExerciseSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  deleted: z.boolean().optional(),
  syncedAt: z.string().optional(),
})
assertExact<z.infer<typeof customExerciseSchema>, CustomExercise>(true)
