/**
 * Comparação de força com quem competiu no Brasil (OpenPowerlifting, issue #293).
 * A tabela vem de src/data/strength-percentiles.json, gerada por
 * `npm run opl:percentiles -w @powerlifting/web` (ver scripts/opl/). Funções puras;
 * `null` para entrada inválida, como o resto de utils/.
 */
import table from '../data/strength-percentiles.json'

export type Lift = 'squat' | 'bench' | 'deadlift' | 'total'
export type SingleLift = Exclude<Lift, 'total'>

export type StrengthLevel = 'Estreante' | 'Competitivo' | 'Pódio regional' | 'Elite nacional'
export const LEVELS: readonly StrengthLevel[] = ['Estreante', 'Competitivo', 'Pódio regional', 'Elite nacional']
/** Percentil mínimo dos níveis acima de Estreante (calibração: spec §7.1). */
export const LEVEL_PERCENTILES: readonly number[] = [25, 50, 85]

export interface LiftBin {
  /** Limite superior inclusivo da faixa de peso corporal; `null` = aberta (+). */
  maxBodyweight: number | null
  label: string
  /** Atletas de mais de uma classe IPF somados por falta de amostra. */
  merged: boolean
  n: number
  /** P0, P5, …, P100 (21 valores, kg). */
  p: number[]
  /** 20 faixas entre `min` e `max`, pico = 1. */
  hist: number[]
  min: number
  max: number
}

export interface StrengthTableMeta {
  source: string
  generatedAt: string
  windowFrom: string
  windowTo: string
  filters: string
  attribution: string
  minSample: number
}

export interface StrengthTable {
  meta: StrengthTableMeta
  M: Record<Lift, LiftBin[]>
  F: Record<Lift, LiftBin[]>
}

export const STRENGTH_TABLE: StrengthTable = table
export const STRENGTH_META: StrengthTableMeta = STRENGTH_TABLE.meta

export interface StrengthComparison {
  lift: Lift
  classLabel: string
  merged: boolean
  n: number
  /** 0–100, inteiro: parcela dos atletas da faixa que levanta menos. */
  percentile: number
  level: StrengthLevel
  /** Limite inferior (kg) do nível atual; P0 para Estreante. */
  levelMinKg: number
  nextLevel?: StrengthLevel
  nextKg?: number
  kgToNext?: number
  /** Valor dividido pelo peso corporal. */
  ratio: number
  /** Kg de entrada de cada nível acima de Estreante (P25, P50, P85 da faixa). */
  thresholdsKg: number[]
  p: number[]
  hist: number[]
  min: number
  max: number
}

const STEP = 5
const round1 = (n: number) => Math.round(n * 10) / 10

function percentileOf(p: number[], value: number): number {
  const last = p.length - 1
  if (value <= p[0]) return 0
  if (value >= p[last]) return 100
  let i = 0
  while (i < last && p[i + 1] <= value) i++
  if (p[i] === value) {
    let j = i
    while (j > 0 && p[j - 1] === value) j--
    return j * STEP
  }
  const span = p[i + 1] - p[i]
  return Math.round(i * STEP + (STEP * (value - p[i])) / span)
}

function findBin(bins: LiftBin[], bodyweight: number): LiftBin | undefined {
  return bins.find((b) => b.maxBodyweight === null || bodyweight <= b.maxBodyweight)
}

export function compareWithTable(
  source: StrengthTable,
  isMale: boolean,
  bodyweight: number,
  lift: Lift,
  value: number,
): StrengthComparison | null {
  if (!(bodyweight > 0) || !(value > 0)) return null
  const bin = findBin(source[isMale ? 'M' : 'F'][lift], bodyweight)
  if (!bin) return null

  const thresholds = LEVEL_PERCENTILES.map((pct) => bin.p[pct / STEP])
  let levelIdx = 0
  while (levelIdx < thresholds.length && value >= thresholds[levelIdx]) levelIdx++

  const nextKg = thresholds[levelIdx]
  const result: StrengthComparison = {
    lift,
    classLabel: bin.label,
    merged: bin.merged,
    n: bin.n,
    percentile: percentileOf(bin.p, value),
    level: LEVELS[levelIdx],
    levelMinKg: levelIdx === 0 ? bin.p[0] : thresholds[levelIdx - 1],
    ratio: value / bodyweight,
    thresholdsKg: thresholds,
    p: bin.p,
    hist: bin.hist,
    min: bin.min,
    max: bin.max,
  }
  if (nextKg !== undefined) {
    result.nextLevel = LEVELS[levelIdx + 1]
    result.nextKg = nextKg
    result.kgToNext = round1(nextKg - value)
  }
  return result
}

export function compareLift(isMale: boolean, bodyweight: number, lift: SingleLift, oneRm: number): StrengthComparison | null {
  return compareWithTable(STRENGTH_TABLE, isMale, bodyweight, lift, oneRm)
}

export function compareTotal(isMale: boolean, bodyweight: number, total: number): StrengthComparison | null {
  return compareWithTable(STRENGTH_TABLE, isMale, bodyweight, 'total', total)
}
