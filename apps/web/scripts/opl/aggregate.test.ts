import { describe, it, expect } from 'vitest'
import type { Entry } from './parse'
import {
  IPF_WEIGHT_CLASSES_KG,
  bestPerLifter,
  classIndex,
  binLabel,
  percentiles,
  histogram,
  mergeSmallBins,
  buildTable,
  type Bin,
} from './aggregate'

const entry = (over: Partial<Entry> & Pick<Entry, 'name'>): Entry => ({
  sex: 'M',
  bodyweight: 80,
  date: '2024-01-01',
  ...over,
})

/** Gera `count` atletas distintos na mesma classe com o lift variando linearmente. */
const cohort = (prefix: string, sex: Entry['sex'], bodyweight: number, count: number, lift: 'squat' | 'bench' | 'deadlift', from: number, to: number): Entry[] =>
  Array.from({ length: count }, (_, i) =>
    entry({ name: `${prefix} ${i}`, sex, bodyweight, [lift]: from + ((to - from) * i) / Math.max(1, count - 1) }),
  )

// ─── bestPerLifter ───────────────────────────────────────────────────────────

describe('bestPerLifter', () => {
  it('conta cada atleta uma vez, com o melhor de cada lift e o peso corporal daquele dia', () => {
    const lifters = bestPerLifter([
      entry({ name: 'Ana', sex: 'F', bodyweight: 62, date: '2022-01-01', squat: 120, bench: 70, deadlift: 150, total: 340 }),
      entry({ name: 'Ana', sex: 'F', bodyweight: 63.5, date: '2023-01-01', squat: 130, bench: 68, deadlift: 155, total: 353 }),
      entry({ name: 'Ana', sex: 'F', bodyweight: 61, date: '2024-01-01', bench: 75 }),
    ])
    expect(lifters).toHaveLength(1)
    expect(lifters[0]).toEqual({
      name: 'Ana',
      sex: 'F',
      bests: {
        squat: { value: 130, bodyweight: 63.5 },
        bench: { value: 75, bodyweight: 61 },
        deadlift: { value: 155, bodyweight: 63.5 },
        total: { value: 353, bodyweight: 63.5 },
      },
    })
  })

  it('não mistura homônimos de sexos diferentes', () => {
    const lifters = bestPerLifter([
      entry({ name: 'Alex', sex: 'M', bench: 100 }),
      entry({ name: 'Alex', sex: 'F', bench: 60 }),
    ])
    expect(lifters).toHaveLength(2)
  })
})

// ─── classes ─────────────────────────────────────────────────────────────────

describe('classIndex / binLabel', () => {
  it('usa as 8 classes IPF por sexo, limite inclusivo', () => {
    expect(IPF_WEIGHT_CLASSES_KG.M).toEqual([59, 66, 74, 83, 93, 105, 120, null])
    expect(IPF_WEIGHT_CLASSES_KG.F).toEqual([47, 52, 57, 63, 69, 76, 84, null])
    expect(classIndex('M', 83)).toBe(3)
    expect(classIndex('M', 83.1)).toBe(4)
    expect(classIndex('M', 121)).toBe(7)
    expect(classIndex('F', 84.3)).toBe(7)
    expect(classIndex('F', 40)).toBe(0)
  })

  it('rotula classe simples, aberta e faixas fundidas', () => {
    expect(binLabel('M', 3, 3)).toBe('até 83 kg')
    expect(binLabel('M', 7, 7)).toBe('+120 kg')
    expect(binLabel('F', 0, 2)).toBe('até 57 kg')
    expect(binLabel('F', 4, 5)).toBe('63–76 kg')
    expect(binLabel('F', 6, 7)).toBe('+76 kg')
    expect(binLabel('F', 0, 7)).toBe('todas as categorias')
  })
})

// ─── percentis e histograma ──────────────────────────────────────────────────

describe('percentiles', () => {
  it('devolve 21 pontos (P0…P100 de 5 em 5) com interpolação linear', () => {
    const p = percentiles([10, 20, 30, 40, 50])
    expect(p).toHaveLength(21)
    expect(p[0]).toBe(10)
    expect(p[5]).toBe(20) // P25 → posição 1
    expect(p[10]).toBe(30) // P50
    expect(p[20]).toBe(50) // P100
    expect(p[1]).toBe(12) // P5 → posição 0,2 entre 10 e 20
  })

  it('arredonda para 0,1 kg e aceita um único valor', () => {
    expect(percentiles([100, 101])[1]).toBe(100.1)
    expect(percentiles([77.7])).toEqual(Array(21).fill(77.7))
  })
})

describe('histogram', () => {
  it('tem 20 faixas, pico normalizado em 1 e min/max dos dados', () => {
    const values = [100, 100, 100, 110, 120, 130, 140, 200]
    const h = histogram(values)
    expect(h.hist).toHaveLength(20)
    expect(Math.max(...h.hist)).toBe(1)
    expect(h.hist[0]).toBe(1) // os três 100 kg caem na primeira faixa
    expect(h.hist[19]).toBeCloseTo(1 / 3) // o 200 kg cai na última (max é inclusivo)
    expect(h.min).toBe(100)
    expect(h.max).toBe(200)
  })

  it('valores todos iguais viram uma faixa só', () => {
    const h = histogram([90, 90, 90])
    expect(h.hist[0]).toBe(1)
    expect(h.hist.slice(1).every((v) => v === 0)).toBe(true)
  })
})

// ─── fusão de classes pequenas ───────────────────────────────────────────────

const bin = (from: number, to: number, values: number[]): Bin => ({ from, to, values })

describe('mergeSmallBins', () => {
  it('funde para a classe vizinha mais pesada até atingir a amostra mínima', () => {
    const out = mergeSmallBins([bin(0, 0, Array(60).fill(1)), bin(1, 1, Array(10).fill(1)), bin(2, 2, Array(70).fill(1))], 50)
    expect(out.map((b) => [b.from, b.to, b.values.length])).toEqual([
      [0, 0, 60],
      [1, 2, 80],
    ])
  })

  it('a última classe pequena funde na anterior', () => {
    const out = mergeSmallBins([bin(0, 0, Array(60).fill(1)), bin(1, 1, Array(70).fill(1)), bin(2, 2, Array(5).fill(1))], 50)
    expect(out.map((b) => [b.from, b.to, b.values.length])).toEqual([
      [0, 0, 60],
      [1, 2, 75],
    ])
  })

  it('classes vazias são absorvidas sem gerar bin vazio', () => {
    const out = mergeSmallBins([bin(0, 0, []), bin(1, 1, []), bin(2, 2, Array(80).fill(1)), bin(3, 3, [])], 50)
    expect(out.map((b) => [b.from, b.to, b.values.length])).toEqual([[0, 3, 80]])
  })

  it('um único bin abaixo do mínimo é mantido', () => {
    const out = mergeSmallBins([bin(0, 0, Array(7).fill(1))], 50)
    expect(out).toHaveLength(1)
    expect(out[0].values).toHaveLength(7)
  })
})

// ─── buildTable ──────────────────────────────────────────────────────────────

describe('buildTable', () => {
  const META = {
    source: 'OpenPowerlifting',
    generatedAt: '2026-09-22',
    windowFrom: '2016-09-22',
    windowTo: '2026-09-22',
    filters: 'MeetCountry=Brazil, Equipment=Raw',
    attribution: 'teste',
  }

  it('gera bins por sexo × lift com n, percentis e histograma; `merged` só quando atletas de classes diferentes foram juntados', () => {
    const entries = [
      ...cohort('F63', 'F', 62, 60, 'bench', 40, 100),
      ...cohort('F69', 'F', 68, 10, 'bench', 50, 90),
      ...cohort('F76', 'F', 75, 70, 'bench', 45, 110),
      ...cohort('F84+', 'F', 90, 5, 'bench', 60, 120),
    ]
    const table = buildTable(entries, META, 50)
    const bench = table.F.bench
    expect(bench.map((b) => [b.label, b.n, b.merged])).toEqual([
      ['até 63 kg', 60, false],
      ['+63 kg', 85, true],
    ])
    expect(bench[0].maxBodyweight).toBe(63)
    expect(bench[1].maxBodyweight).toBeNull()
    expect(bench[0].p).toHaveLength(21)
    expect(bench[0].p[0]).toBe(40)
    expect(bench[0].p[20]).toBe(100)
    expect(bench[0].hist).toHaveLength(20)
    expect(table.meta).toEqual({ ...META, minSample: 50 })
  })

  it('lift sem nenhum dado gera lista vazia (não quebra)', () => {
    const table = buildTable(cohort('M', 'M', 80, 3, 'squat', 100, 200), META, 50)
    expect(table.M.bench).toEqual([])
    expect(table.M.squat).toHaveLength(1)
    expect(table.M.squat[0].n).toBe(3)
    expect(table.F.squat).toEqual([])
  })
})
