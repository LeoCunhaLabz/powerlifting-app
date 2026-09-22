// Etapa 2 do pipeline OpenPowerlifting (issue #293, spec §7.4): melhor por atleta,
// classes IPF, percentis, histograma e fusão de classes com pouca amostra.
// Sem dependência de I/O — tudo puro e testado.

import type { Entry, Sex } from './parse'

export type Lift = 'squat' | 'bench' | 'deadlift' | 'total'
export const LIFTS: Lift[] = ['squat', 'bench', 'deadlift', 'total']

/** Limite superior (inclusivo) de cada classe; `null` = classe aberta (+). */
export const IPF_WEIGHT_CLASSES_KG: Record<Sex, (number | null)[]> = {
  M: [59, 66, 74, 83, 93, 105, 120, null],
  F: [47, 52, 57, 63, 69, 76, 84, null],
}

export const PERCENTILE_STEPS = 21
export const HISTOGRAM_BINS = 20

export interface Best {
  value: number
  bodyweight: number
}

export interface Lifter {
  name: string
  sex: Sex
  bests: Partial<Record<Lift, Best>>
}

export function bestPerLifter(entries: Entry[]): Lifter[] {
  const byKey = new Map<string, Lifter>()
  for (const e of entries) {
    const key = `${e.sex}|${e.name}`
    let lifter = byKey.get(key)
    if (!lifter) {
      lifter = { name: e.name, sex: e.sex, bests: {} }
      byKey.set(key, lifter)
    }
    for (const lift of LIFTS) {
      const value = e[lift]
      if (value === undefined) continue
      const current = lifter.bests[lift]
      if (!current || value > current.value) lifter.bests[lift] = { value, bodyweight: e.bodyweight }
    }
  }
  return [...byKey.values()]
}

export function classIndex(sex: Sex, bodyweight: number): number {
  const classes = IPF_WEIGHT_CLASSES_KG[sex]
  const i = classes.findIndex((max) => max === null || bodyweight <= max)
  return i === -1 ? classes.length - 1 : i
}

export function binLabel(sex: Sex, from: number, to: number): string {
  const classes = IPF_WEIGHT_CLASSES_KG[sex]
  const last = classes.length - 1
  if (from === 0 && to === last) return 'todas as categorias'
  if (to === last) return `+${classes[from - 1]} kg`
  if (from === 0) return `até ${classes[to]} kg`
  if (from === to) return `até ${classes[to]} kg`
  return `${classes[from - 1]}–${classes[to]} kg`
}

const round1 = (n: number) => Math.round(n * 10) / 10

/** 21 pontos (P0, P5, …, P100) por interpolação linear sobre os valores ordenados. */
export function percentiles(values: number[]): number[] {
  const sorted = [...values].sort((a, b) => a - b)
  const n = sorted.length
  const out: number[] = []
  for (let k = 0; k < PERCENTILE_STEPS; k++) {
    const pos = ((n - 1) * k) / (PERCENTILE_STEPS - 1)
    const lo = Math.floor(pos)
    const hi = Math.ceil(pos)
    out.push(round1(sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)))
  }
  return out
}

const round3 = (n: number) => Math.round(n * 1000) / 1000

function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}

/**
 * 20 faixas entre P1 e P99 (outliers como um supino de 2,5 kg esticavam a faixa e
 * deixavam a curva com cauda vazia); valores fora caem nas faixas das pontas.
 * Contagem dividida pelo pico (0–1). Os percentis não são afetados.
 */
export function histogram(values: number[]): { hist: number[]; min: number; max: number } {
  const sorted = [...values].sort((a, b) => a - b)
  const min = quantile(sorted, 0.01)
  const max = quantile(sorted, 0.99)
  const counts = Array<number>(HISTOGRAM_BINS).fill(0)
  const width = max - min
  for (const v of sorted) {
    const i = width === 0 ? 0 : Math.max(0, Math.min(HISTOGRAM_BINS - 1, Math.floor(((v - min) / width) * HISTOGRAM_BINS)))
    counts[i]++
  }
  const peak = Math.max(...counts)
  return { hist: counts.map((c) => (peak === 0 ? 0 : round3(c / peak))), min: round1(min), max: round1(max) }
}

export interface Bin {
  /** Índice da primeira classe IPF coberta. */
  from: number
  /** Índice da última classe IPF coberta. */
  to: number
  values: number[]
}

/**
 * Funde cada bin com menos de `minSample` na vizinha mais pesada; a última, sem
 * vizinha, funde na anterior. Um bin sozinho é mantido mesmo pequeno.
 */
export function mergeSmallBins(bins: Bin[], minSample: number): Bin[] {
  const out: Bin[] = []
  let carry: Bin | null = null
  for (const b of bins) {
    const cur: Bin = carry ? { from: carry.from, to: b.to, values: [...carry.values, ...b.values] } : { ...b, values: [...b.values] }
    if (cur.values.length >= minSample) {
      out.push(cur)
      carry = null
    } else {
      carry = cur
    }
  }
  if (carry) {
    const prev = out.pop()
    out.push(prev ? { from: prev.from, to: carry.to, values: [...prev.values, ...carry.values] } : carry)
  }
  return out
}

export interface LiftBin {
  /** Limite superior da faixa (`null` = aberta). Compare `bodyweight <= maxBodyweight`. */
  maxBodyweight: number | null
  label: string
  merged: boolean
  n: number
  p: number[]
  hist: number[]
  min: number
  max: number
}

export interface TableMeta {
  source: string
  generatedAt: string
  windowFrom: string
  windowTo: string
  filters: string
  attribution: string
}

export type SexTable = Record<Lift, LiftBin[]>

export interface StrengthTable {
  meta: TableMeta & { minSample: number }
  M: SexTable
  F: SexTable
}

function liftBins(lifters: Lifter[], sex: Sex, lift: Lift, minSample: number): LiftBin[] {
  const classes = IPF_WEIGHT_CLASSES_KG[sex]
  const raw: Bin[] = classes.map((_, i) => ({ from: i, to: i, values: [] }))
  for (const lifter of lifters) {
    if (lifter.sex !== sex) continue
    const best = lifter.bests[lift]
    if (!best) continue
    raw[classIndex(sex, best.bodyweight)].values.push(best.value)
  }
  if (raw.every((b) => b.values.length === 0)) return []
  return mergeSmallBins(raw, minSample).map((b) => {
    const { hist, min, max } = histogram(b.values)
    // Classes vazias absorvidas não contam como fusão: o aviso "agrupadas por poucos
    // dados" só vale quando atletas de classes diferentes foram somados.
    const populated = raw.slice(b.from, b.to + 1).filter((r) => r.values.length > 0).length
    return {
      maxBodyweight: classes[b.to],
      label: binLabel(sex, b.from, b.to),
      merged: populated > 1,
      n: b.values.length,
      p: percentiles(b.values),
      hist,
      min,
      max,
    }
  })
}

export function buildTable(entries: Entry[], meta: TableMeta, minSample: number): StrengthTable {
  const lifters = bestPerLifter(entries)
  const sexTable = (sex: Sex): SexTable => ({
    squat: liftBins(lifters, sex, 'squat', minSample),
    bench: liftBins(lifters, sex, 'bench', minSample),
    deadlift: liftBins(lifters, sex, 'deadlift', minSample),
    total: liftBins(lifters, sex, 'total', minSample),
  })
  return { meta: { ...meta, minSample }, M: sexTable('M'), F: sexTable('F') }
}
