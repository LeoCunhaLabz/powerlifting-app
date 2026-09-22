import { describe, it, expect } from 'vitest'
import {
  compareWithTable,
  compareLift,
  compareTotal,
  LEVELS,
  LEVEL_PERCENTILES,
  STRENGTH_TABLE,
  STRENGTH_META,
  type StrengthTable,
  type LiftBin,
} from './strength'

/** p linear de `from` a `to` em 21 pontos: P_k = from + (to - from) * k / 100. */
const linear = (from: number, to: number) => Array.from({ length: 21 }, (_, i) => from + ((to - from) * i) / 20)

const bin = (over: Partial<LiftBin>): LiftBin => ({
  maxBodyweight: 83,
  label: 'até 83 kg',
  merged: false,
  n: 500,
  p: linear(50, 150),
  hist: Array(20).fill(0.5),
  min: 50,
  max: 150,
  ...over,
})

const FIXTURE: StrengthTable = {
  meta: { ...STRENGTH_META, generatedAt: '2026-01-01' },
  M: {
    squat: [],
    bench: [bin({ maxBodyweight: 74, label: 'até 74 kg', p: linear(40, 120) }), bin({}), bin({ maxBodyweight: null, label: '+83 kg', p: linear(60, 180) })],
    deadlift: [],
    total: [bin({ p: linear(300, 700) })],
  },
  F: {
    squat: [],
    bench: [bin({ maxBodyweight: 52, label: 'até 52 kg', merged: true, n: 120, p: linear(30, 80) })],
    deadlift: [],
    total: [],
  },
}

describe('escada', () => {
  it('tem 4 níveis e 3 cortes (P25, P50, P85)', () => {
    expect(LEVELS).toEqual(['Estreante', 'Competitivo', 'Pódio regional', 'Elite nacional'])
    expect(LEVEL_PERCENTILES).toEqual([25, 50, 85])
  })
})

describe('compareWithTable', () => {
  it('retorna null para entrada inválida ou lift sem dados', () => {
    expect(compareWithTable(FIXTURE, true, 0, 'bench', 100)).toBeNull()
    expect(compareWithTable(FIXTURE, true, 80, 'bench', 0)).toBeNull()
    expect(compareWithTable(FIXTURE, true, 80, 'squat', 100)).toBeNull()
    expect(compareWithTable(FIXTURE, false, 60, 'total', 300)).toBeNull()
  })

  it('escolhe a faixa pelo peso corporal com limite inclusivo', () => {
    expect(compareWithTable(FIXTURE, true, 74, 'bench', 100)?.classLabel).toBe('até 74 kg')
    expect(compareWithTable(FIXTURE, true, 74.1, 'bench', 100)?.classLabel).toBe('até 83 kg')
    expect(compareWithTable(FIXTURE, true, 83, 'bench', 100)?.classLabel).toBe('até 83 kg')
    expect(compareWithTable(FIXTURE, true, 130, 'bench', 100)?.classLabel).toBe('+83 kg')
  })

  it('percentil interpolado e nível pelo corte em kg', () => {
    const r = compareWithTable(FIXTURE, true, 80, 'bench', 100)!
    expect(r.percentile).toBe(50)
    expect(r.level).toBe('Pódio regional')
    expect(r.levelMinKg).toBe(100) // P50
    expect(r.nextLevel).toBe('Elite nacional')
    expect(r.nextKg).toBe(135) // P85
    expect(r.kgToNext).toBe(35)
    expect(r.ratio).toBeCloseTo(1.25)
    expect(r.n).toBe(500)
    expect(r.p).toHaveLength(21)
    expect(r.hist).toHaveLength(20)
  })

  it('valor entre dois pontos interpola (P30 → 32%)', () => {
    // p[6] = 80, p[7] = 85 → 82 está a 40% do caminho → 30 + 2 = 32
    expect(compareWithTable(FIXTURE, true, 80, 'bench', 82)?.percentile).toBe(32)
  })

  it('abaixo do P0: 0%, Estreante, meta = P25', () => {
    const r = compareWithTable(FIXTURE, true, 80, 'bench', 20)!
    expect(r.percentile).toBe(0)
    expect(r.level).toBe('Estreante')
    expect(r.levelMinKg).toBe(50)
    expect(r.nextLevel).toBe('Competitivo')
    expect(r.nextKg).toBe(75)
    expect(r.kgToNext).toBe(55)
  })

  it('acima do P100: 100%, Elite nacional, sem meta', () => {
    const r = compareWithTable(FIXTURE, true, 80, 'bench', 999)!
    expect(r.percentile).toBe(100)
    expect(r.level).toBe('Elite nacional')
    expect(r.levelMinKg).toBe(135)
    expect(r.nextLevel).toBeUndefined()
    expect(r.nextKg).toBeUndefined()
    expect(r.kgToNext).toBeUndefined()
  })

  it('exatamente no corte entra no nível de cima', () => {
    expect(compareWithTable(FIXTURE, true, 80, 'bench', 75)?.level).toBe('Competitivo')
    expect(compareWithTable(FIXTURE, true, 80, 'bench', 74.9)?.level).toBe('Estreante')
  })

  it('platô na tabela usa o menor índice (quem "levanta menos" é estrito)', () => {
    const flat = { ...FIXTURE, M: { ...FIXTURE.M, bench: [bin({ p: [50, 60, 70, 100, 100, 100, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240] })] } }
    expect(compareWithTable(flat, true, 80, 'bench', 100)?.percentile).toBe(15)
  })

  it('repassa faixa fundida e n', () => {
    const r = compareWithTable(FIXTURE, false, 50, 'bench', 55)!
    expect(r.merged).toBe(true)
    expect(r.classLabel).toBe('até 52 kg')
    expect(r.n).toBe(120)
  })
})

describe('compareLift / compareTotal com a tabela real', () => {
  it('a tabela commitada tem meta e as 4 listas por sexo', () => {
    expect(STRENGTH_META.source).toBe('OpenPowerlifting')
    expect(STRENGTH_META.attribution).toContain('openpowerlifting.org')
    for (const sex of ['M', 'F'] as const) {
      for (const lift of ['squat', 'bench', 'deadlift', 'total'] as const) {
        expect(STRENGTH_TABLE[sex][lift].length).toBeGreaterThan(0)
      }
    }
  })

  it('compareTotal(82 kg, 512,5 kg) cai em "até 83 kg" com amostra acima do mínimo', () => {
    const r = compareTotal(true, 82, 512.5)!
    expect(r.classLabel).toBe('até 83 kg')
    expect(r.n).toBeGreaterThanOrEqual(STRENGTH_META.minSample)
    expect(r.percentile).toBeGreaterThan(0)
    expect(r.percentile).toBeLessThan(100)
  })

  it('compareLift usa o lift certo', () => {
    expect(compareLift(false, 60, 'bench', 60)?.lift).toBe('bench')
    expect(compareLift(true, 90, 'deadlift', 220)?.lift).toBe('deadlift')
  })
})
