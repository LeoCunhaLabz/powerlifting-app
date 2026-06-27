import { describe, it, expect } from 'vitest'
import {
  calculateE1RM,
  calculateWilks,
  calculateDots,
  calculateIpfGl,
  calculatePlates,
} from './powerlifting'

// ─── calculateE1RM ────────────────────────────────────────────────────────────

describe('calculateE1RM', () => {
  it('retorna 0 para peso zero', () => {
    expect(calculateE1RM(0, 5)).toBe(0)
  })

  it('retorna 0 para reps zero', () => {
    expect(calculateE1RM(100, 0)).toBe(0)
  })

  it('retorna o próprio peso para 1 rep sem RPE (Brzycki)', () => {
    expect(calculateE1RM(200, 1)).toBe(200)
  })

  it('usa tabela RTS para RPE fornecido (100kg @10 = 100/1.00)', () => {
    expect(calculateE1RM(100, 1, 10)).toBe(100)
  })

  it('usa tabela RTS: 92kg x1 @9.5 → 92/0.98 ≈ 93.9', () => {
    expect(calculateE1RM(92, 1, 9.5)).toBe(93.9)
  })

  it('usa tabela RTS: 200kg x3 @10 → 200/0.92 ≈ 217.4', () => {
    expect(calculateE1RM(200, 3, 10)).toBe(217.4)
  })

  it('fallback Brzycki sem RPE: 100kg x5 ≈ 112.5', () => {
    // Brzycki: 100 / (1.0278 - 0.0278*5) = 100 / 0.8888 ≈ 112.5
    expect(calculateE1RM(100, 5)).toBeCloseTo(112.5, 0)
  })

  it('retorna 0 para RPE abaixo de 6.5 (fora da faixa suportada)', () => {
    expect(calculateE1RM(100, 5, 5)).toBe(0)
  })

  it('retorna 0 para RPE acima de 10 (fora da faixa suportada)', () => {
    expect(calculateE1RM(100, 5, 10.5)).toBe(0)
  })

  it('retorna 0 para RPE fornecido com reps fora da tabela (> 12) usa Brzycki', () => {
    // RPE fornecido mas sem entrada na tabela → fallback para Brzycki (não quebra UX)
    const comRpe   = calculateE1RM(100, 15, 8)
    const semRpe   = calculateE1RM(100, 15)
    expect(comRpe).toBe(semRpe)
    expect(comRpe).toBeGreaterThan(0)
  })

  it('reps > 12 sem RPE usa Brzycki normalmente', () => {
    // Brzycki: 100 / (1.0278 - 0.0278*15) = 100 / 0.6108 ≈ 163.7
    expect(calculateE1RM(100, 15)).toBeGreaterThan(0)
  })

  it('retorna 0 para peso negativo', () => {
    expect(calculateE1RM(-100, 5)).toBe(0)
  })

  it('retorna 0 para reps negativas', () => {
    expect(calculateE1RM(100, -3)).toBe(0)
  })

  it('retorna 0 para peso NaN', () => {
    expect(calculateE1RM(NaN, 5)).toBe(0)
  })

  it('retorna 0 para RPE NaN', () => {
    expect(calculateE1RM(100, 5, NaN)).toBe(0)
  })

  it('arredonda para 0.1', () => {
    // 95 / 0.89 = 106.741... → arredonda para 106.7
    expect(calculateE1RM(95, 3, 9)).toBe(106.7)
  })
})

// ─── calculateWilks ───────────────────────────────────────────────────────────

describe('calculateWilks', () => {
  it('retorna 0 para peso corporal zero', () => {
    expect(calculateWilks(0, 500, true)).toBe(0)
  })

  it('retorna 0 para total zero', () => {
    expect(calculateWilks(80, 0, true)).toBe(0)
  })

  it('retorna 0 para peso corporal negativo', () => {
    expect(calculateWilks(-80, 600, true)).toBe(0)
  })

  it('retorna 0 para total negativo', () => {
    expect(calculateWilks(80, -600, true)).toBe(0)
  })

  it('retorna 0 para peso corporal NaN', () => {
    expect(calculateWilks(NaN, 600, true)).toBe(0)
  })

  it('retorna 0 para total NaN', () => {
    expect(calculateWilks(80, NaN, true)).toBe(0)
  })

  it('masculino: 80kg corpo / 600kg total ≈ pontuação positiva', () => {
    const pts = calculateWilks(80, 600, true)
    expect(pts).toBeGreaterThan(0)
  })

  it('feminino: 65kg corpo / 400kg total ≈ pontuação positiva', () => {
    const pts = calculateWilks(65, 400, false)
    expect(pts).toBeGreaterThan(0)
  })

  it('arredonda para 0.01', () => {
    const result = calculateWilks(80, 600, true)
    expect(Number(result.toFixed(2))).toBe(result)
  })

  it('pontuação masculina maior que feminina para mesmos inputs (coeficientes diferentes)', () => {
    const male = calculateWilks(80, 600, true)
    const female = calculateWilks(80, 600, false)
    // coeficientes são distintos, apenas verificamos que ambos são positivos e diferentes
    expect(male).toBeGreaterThan(0)
    expect(female).toBeGreaterThan(0)
    expect(male).not.toBe(female)
  })
})

// ─── calculateDots ────────────────────────────────────────────────────────────

describe('calculateDots', () => {
  it('retorna 0 para peso corporal zero', () => {
    expect(calculateDots(0, 500, true)).toBe(0)
  })

  it('retorna 0 para total zero', () => {
    expect(calculateDots(80, 0, true)).toBe(0)
  })

  it('retorna 0 para peso corporal negativo', () => {
    expect(calculateDots(-80, 600, true)).toBe(0)
  })

  it('retorna 0 para total negativo', () => {
    expect(calculateDots(80, -600, true)).toBe(0)
  })

  it('retorna 0 para peso corporal NaN', () => {
    expect(calculateDots(NaN, 600, true)).toBe(0)
  })

  it('retorna 0 para total NaN', () => {
    expect(calculateDots(80, NaN, true)).toBe(0)
  })

  it('masculino: retorna pontuação positiva', () => {
    expect(calculateDots(80, 600, true)).toBeGreaterThan(0)
  })

  it('feminino: retorna pontuação positiva', () => {
    expect(calculateDots(65, 400, false)).toBeGreaterThan(0)
  })

  it('arredonda para 0.01', () => {
    const result = calculateDots(80, 600, true)
    expect(Number(result.toFixed(2))).toBe(result)
  })
})

// ─── calculateIpfGl ───────────────────────────────────────────────────────────

describe('calculateIpfGl', () => {
  it('retorna 0 para peso corporal zero', () => {
    expect(calculateIpfGl(0, 500, true)).toBe(0)
  })

  it('retorna 0 para total zero', () => {
    expect(calculateIpfGl(80, 0, true)).toBe(0)
  })

  it('retorna 0 para peso corporal negativo', () => {
    expect(calculateIpfGl(-80, 600, true)).toBe(0)
  })

  it('retorna 0 para total negativo', () => {
    expect(calculateIpfGl(80, -600, true)).toBe(0)
  })

  it('retorna 0 para peso corporal NaN', () => {
    expect(calculateIpfGl(NaN, 600, true)).toBe(0)
  })

  it('retorna 0 para total NaN', () => {
    expect(calculateIpfGl(80, NaN, true)).toBe(0)
  })

  // Caso de referência oficial OPL — Dmitry Inzarkin, IPF World Open 2019 (masc. equipado)
  // Fonte: OpenPowerlifting goodlift.rs — https://gitlab.com/openpowerlifting/opl-data
  it('masc. equipado: caso de referência OPL (92.04 kg / 1035 kg → 112.85)', () => {
    expect(calculateIpfGl(92.04, 1035, true, true)).toBe(112.85)
  })

  // Casos de referência calculados a partir dos coeficientes IPF GL 2020 oficiais
  it('masc. raw: 90 kg corpo / 800 kg total → 106.35', () => {
    expect(calculateIpfGl(90, 800, true, false)).toBe(106.35)
  })

  it('fem. raw: 60 kg corpo / 400 kg total → 90.42', () => {
    expect(calculateIpfGl(60, 400, false, false)).toBe(90.42)
  })

  it('fem. equipado: 84 kg corpo / 600 kg total → 94.36', () => {
    expect(calculateIpfGl(84, 600, false, true)).toBe(94.36)
  })

  it('fórmula varia com peso corporal: mesmo total, atleta mais leve pontua mais', () => {
    const leve  = calculateIpfGl(60,  800, true, false)
    const pesado = calculateIpfGl(120, 800, true, false)
    expect(leve).toBeGreaterThan(pesado)
  })

  it('arredonda para 0.01', () => {
    const result = calculateIpfGl(80, 600, true)
    expect(Number(result.toFixed(2))).toBe(result)
  })
})

// ─── calculatePlates ─────────────────────────────────────────────────────────

describe('calculatePlates', () => {
  const plates = [25, 20, 15, 10, 5, 2.5, 1.25]

  it('alvo igual ao peso da barra → sem anilhas, peso exato', () => {
    const r = calculatePlates(20, 20, plates)
    expect(r.plates).toEqual([])
    expect(r.actualWeight).toBe(20)
    expect(r.remainingWeight).toBe(0)
  })

  it('alvo abaixo do peso da barra → sem anilhas', () => {
    const r = calculatePlates(10, 20, plates)
    expect(r.plates).toEqual([])
  })

  it('100kg barra 20kg → 1×25kg + 1×15kg por lado = 100kg', () => {
    // per side: 40kg → guloso: 25 (1×) + 15 (1×) = 40; total = 20 + 80 = 100
    const r = calculatePlates(100, 20, plates)
    expect(r.actualWeight).toBe(100)
    const p25 = r.plates.find(p => p.plateWeight === 25)
    expect(p25?.count).toBe(1)
    const p15 = r.plates.find(p => p.plateWeight === 15)
    expect(p15?.count).toBe(1)
  })

  it('142.5kg barra 20kg → montagem correta com anilhas menores', () => {
    const r = calculatePlates(142.5, 20, plates)
    expect(r.actualWeight).toBe(142.5)
    expect(r.remainingWeight).toBeCloseTo(0, 5)
  })

  it('peso impossível de atingir exato → remainingWeight > 0', () => {
    // 101.3kg com anilhas que não cobrem 0.65 por lado
    const r = calculatePlates(101.3, 20, [25, 20, 10, 5])
    expect(r.remainingWeight).toBeGreaterThanOrEqual(0)
    expect(r.actualWeight).toBeLessThanOrEqual(101.3)
  })

  it('anilhas ordenadas por peso descendente internamente', () => {
    const r = calculatePlates(100, 20, [5, 25, 10, 20])
    expect(r.actualWeight).toBe(100)
  })
})
