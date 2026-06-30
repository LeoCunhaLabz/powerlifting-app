/**
 * Powerlifting utilities for RPE, e1RM, Plate Calculations, and Strength Coefficients.
 */

// RTS RPE Percentage Chart (Mike Tuchscherer)
// Rows: Reps from 1 to 12
// Columns: RPE from 6.5 to 10 (step 0.5)
const RPE_PERCENTAGES: Record<number, Record<number, number>> = {
  1:  { 10: 1.00, 9.5: 0.98, 9: 0.96, 8.5: 0.94, 8: 0.92, 7.5: 0.91, 7: 0.89, 6.5: 0.88 },
  2:  { 10: 0.96, 9.5: 0.94, 9: 0.92, 8.5: 0.91, 8: 0.89, 7.5: 0.88, 7: 0.86, 6.5: 0.85 },
  3:  { 10: 0.92, 9.5: 0.91, 9: 0.89, 8.5: 0.88, 8: 0.86, 7.5: 0.85, 7: 0.84, 6.5: 0.82 },
  4:  { 10: 0.89, 9.5: 0.88, 9: 0.86, 8.5: 0.85, 8: 0.84, 7.5: 0.82, 7: 0.81, 6.5: 0.79 },
  5:  { 10: 0.86, 9.5: 0.85, 9: 0.84, 8.5: 0.82, 8: 0.81, 7.5: 0.79, 7: 0.77, 6.5: 0.76 },
  6:  { 10: 0.84, 9.5: 0.82, 9: 0.81, 8.5: 0.79, 8: 0.77, 7.5: 0.76, 7: 0.74, 6.5: 0.72 },
  7:  { 10: 0.81, 9.5: 0.79, 9: 0.77, 8.5: 0.76, 8: 0.74, 7.5: 0.72, 7: 0.71, 6.5: 0.69 },
  8:  { 10: 0.79, 9.5: 0.77, 9: 0.76, 8.5: 0.74, 8: 0.72, 7.5: 0.71, 7: 0.69, 6.5: 0.67 },
  9:  { 10: 0.76, 9.5: 0.74, 9: 0.72, 8.5: 0.71, 8: 0.69, 7.5: 0.67, 7: 0.66, 6.5: 0.64 },
  10: { 10: 0.74, 9.5: 0.72, 9: 0.71, 8.5: 0.69, 8: 0.67, 7.5: 0.66, 7: 0.64, 6.5: 0.62 },
  11: { 10: 0.71, 9.5: 0.69, 9: 0.67, 8.5: 0.66, 8: 0.64, 7.5: 0.62, 7: 0.61, 6.5: 0.59 },
  12: { 10: 0.68, 9.5: 0.66, 9: 0.64, 8.5: 0.62, 8: 0.61, 7.5: 0.59, 7: 0.57, 6.5: 0.56 },
};

/**
 * Calculates Estimated One Rep Max (e1RM)
 */
export function calculateE1RM(weight: number, reps: number, rpe?: number): number {
  // !(x > 0) rejeita 0, negativos, NaN e -Infinity em uma única expressão
  if (!(weight > 0) || !(reps > 0)) return 0;

  // Se RPE foi fornecido, deve ser finito e dentro da faixa suportada [6.5, 10]
  if (rpe !== undefined) {
    if (!Number.isFinite(rpe) || rpe < 6.5 || rpe > 10) return 0;
    const roundedRpe = Math.round(rpe * 2) / 2; // arredonda para o 0.5 mais próximo
    const repData = RPE_PERCENTAGES[reps];       // tabela cobre reps 1–12
    if (repData && repData[roundedRpe]) {
      return Math.round((weight / repData[roundedRpe]) * 10) / 10;
    }
    // reps fora da tabela (> 12): fallback para Brzycki para não quebrar a UX
  }

  // Sem RPE (ou com RPE mas reps fora da tabela): Brzycki
  if (reps === 1) return weight;
  return Math.round((weight / (1.0278 - 0.0278 * reps)) * 10) / 10;
}

/**
 * Brzycki e1RM: weight / (1.0278 - 0.0278 * reps)
 */
export function calculateE1RMBrzycki(weight: number, reps: number): number {
  if (!(weight > 0) || !(reps > 0)) return 0;
  if (reps === 1) return weight;
  return Math.round((weight / (1.0278 - 0.0278 * reps)) * 10) / 10;
}

/**
 * Epley e1RM: weight * (1 + reps / 30)
 */
export function calculateE1RMEpley(weight: number, reps: number): number {
  if (!(weight > 0) || !(reps > 0)) return 0;
  if (reps === 1) return weight;
  return Math.round((weight * (1 + reps / 30)) * 10) / 10;
}

/**
 * Wilks Coefficient Formula (2020 Update / Classic)
 */
export function calculateWilks(bodyweight: number, total: number, isMale: boolean): number {
  if (!(bodyweight > 0) || !(total > 0)) return 0;

  // Classic Wilks Coefficients
  const a = isMale ? -216.0475144 : 594.31747775;
  const b = isMale ? 16.2606339 : -27.23842536;
  const c = isMale ? -0.002388645 : 0.8211222687;
  const d = isMale ? -0.00113732 : -0.0093073391;
  const e = isMale ? 7.01863081e-6 : 4.731582e-5;
  const f = isMale ? -1.291e-8 : -9.054e-8;

  const w = bodyweight;
  const denominator = a + (b * w) + (c * Math.pow(w, 2)) + (d * Math.pow(w, 3)) + (e * Math.pow(w, 4)) + (f * Math.pow(w, 5));
  
  if (denominator === 0) return 0;
  
  const coeff = 500 / denominator;
  return Math.round((total * coeff) * 100) / 100;
}

/**
 * Wilks 2020 (Wilks2) Formula
 * Fonte: OpenPowerlifting coefficients/wilks2020.rs (MIT)
 */
export function calculateWilks2020(bodyweight: number, total: number, isMale: boolean): number {
  if (!(bodyweight > 0) || !(total > 0)) return 0;

  let a: number, b: number, c: number, d: number, e: number, f: number;
  let minW: number, maxW: number;

  if (isMale) {
    a = 47.4617885411949;
    b = 8.47206137941125;
    c = 0.073694103462609;
    d = -0.00139583381094385;
    e = 0.00000707665973070743;
    f = -0.0000000120804336482315;
    minW = 40.0;
    maxW = 200.95;
  } else {
    a = -125.425539779509;
    b = 13.7121941940668;
    c = -0.0330725063103405;
    d = -0.0010504000506583;
    e = 0.00000938773881462799;
    f = -0.000000023334613884954;
    minW = 40.0;
    maxW = 150.95;
  }

  const w = Math.min(maxW, Math.max(minW, bodyweight));
  const denominator = a + (b * w) + (c * Math.pow(w, 2)) + (d * Math.pow(w, 3)) + (e * Math.pow(w, 4)) + (f * Math.pow(w, 5));
  if (denominator === 0) return 0;

  const coeff = 600 / denominator;
  return Math.round((total * coeff) * 100) / 100;
}

/**
 * DOTS Formula (standardized weight comparison)
 */
export function calculateDots(bodyweight: number, total: number, isMale: boolean): number {
  if (!(bodyweight > 0) || !(total > 0)) return 0;

  // DOTS Coefficients
  const a = isMale ? -0.000001093 : -0.0000010706;
  const b = isMale ? 0.0007391293 : 0.0005158568;
  const c = isMale ? -0.19190192 : -0.11266519;
  const d = isMale ? 24.7000574 : 16.6194945;
  const e = isMale ? 263.18017 : 232.565;

  const w = bodyweight;
  const denominator = (a * Math.pow(w, 4)) + (b * Math.pow(w, 3)) + (c * Math.pow(w, 2)) + (d * w) + e;
  
  if (denominator === 0) return 0;
  
  const coeff = 500 / denominator;
  return Math.round((total * coeff) * 100) / 100;
}

export type StrengthLevel = 'Iniciante' | 'Intermediário' | 'Avançado' | 'Elite';

export interface StrengthComparisonResult {
  level: StrengthLevel;
  percentileApprox: number;
  topPercentApprox: number;
  bodyweightClass: string;
  note: string;
  /** Próximo nível acima do atual (undefined se já é Elite). */
  nextLevel?: StrengthLevel;
  /** Quantos pontos de DOTS faltam para atingir o próximo nível. */
  dotsToNext?: number;
}

interface ComparisonBand {
  minDots: number;
  level: StrengthLevel;
  percentileApprox: number;
}

interface DotsReferenceClass {
  maxBodyweight: number;
  classLabel: string;
  bands: ComparisonBand[];
}

// Referência estática por sexo/classe de peso (estimativa aproximada a partir dos rankings de DOTS do OpenPowerlifting).
// Fonte: https://www.openpowerlifting.org/rankings
const DOTS_REFERENCE_MALE: DotsReferenceClass[] = [
  { maxBodyweight: 59, classLabel: 'até 59 kg', bands: [{ minDots: 0, level: 'Iniciante', percentileApprox: 25 }, { minDots: 300, level: 'Intermediário', percentileApprox: 50 }, { minDots: 380, level: 'Avançado', percentileApprox: 75 }, { minDots: 460, level: 'Elite', percentileApprox: 92 }] },
  { maxBodyweight: 66, classLabel: 'até 66 kg', bands: [{ minDots: 0, level: 'Iniciante', percentileApprox: 25 }, { minDots: 300, level: 'Intermediário', percentileApprox: 50 }, { minDots: 380, level: 'Avançado', percentileApprox: 75 }, { minDots: 460, level: 'Elite', percentileApprox: 92 }] },
  { maxBodyweight: 74, classLabel: 'até 74 kg', bands: [{ minDots: 0, level: 'Iniciante', percentileApprox: 25 }, { minDots: 300, level: 'Intermediário', percentileApprox: 50 }, { minDots: 380, level: 'Avançado', percentileApprox: 75 }, { minDots: 460, level: 'Elite', percentileApprox: 92 }] },
  { maxBodyweight: 83, classLabel: 'até 83 kg', bands: [{ minDots: 0, level: 'Iniciante', percentileApprox: 25 }, { minDots: 300, level: 'Intermediário', percentileApprox: 50 }, { minDots: 380, level: 'Avançado', percentileApprox: 75 }, { minDots: 460, level: 'Elite', percentileApprox: 92 }] },
  { maxBodyweight: 93, classLabel: 'até 93 kg', bands: [{ minDots: 0, level: 'Iniciante', percentileApprox: 25 }, { minDots: 300, level: 'Intermediário', percentileApprox: 50 }, { minDots: 380, level: 'Avançado', percentileApprox: 75 }, { minDots: 460, level: 'Elite', percentileApprox: 92 }] },
  { maxBodyweight: 105, classLabel: 'até 105 kg', bands: [{ minDots: 0, level: 'Iniciante', percentileApprox: 25 }, { minDots: 300, level: 'Intermediário', percentileApprox: 50 }, { minDots: 380, level: 'Avançado', percentileApprox: 75 }, { minDots: 460, level: 'Elite', percentileApprox: 92 }] },
  { maxBodyweight: 120, classLabel: 'até 120 kg', bands: [{ minDots: 0, level: 'Iniciante', percentileApprox: 25 }, { minDots: 300, level: 'Intermediário', percentileApprox: 50 }, { minDots: 380, level: 'Avançado', percentileApprox: 75 }, { minDots: 460, level: 'Elite', percentileApprox: 92 }] },
  { maxBodyweight: Number.POSITIVE_INFINITY, classLabel: '+120 kg', bands: [{ minDots: 0, level: 'Iniciante', percentileApprox: 25 }, { minDots: 300, level: 'Intermediário', percentileApprox: 50 }, { minDots: 380, level: 'Avançado', percentileApprox: 75 }, { minDots: 460, level: 'Elite', percentileApprox: 92 }] },
];

const DOTS_REFERENCE_FEMALE: DotsReferenceClass[] = [
  { maxBodyweight: 47, classLabel: 'até 47 kg', bands: [{ minDots: 0, level: 'Iniciante', percentileApprox: 25 }, { minDots: 250, level: 'Intermediário', percentileApprox: 50 }, { minDots: 320, level: 'Avançado', percentileApprox: 75 }, { minDots: 400, level: 'Elite', percentileApprox: 92 }] },
  { maxBodyweight: 52, classLabel: 'até 52 kg', bands: [{ minDots: 0, level: 'Iniciante', percentileApprox: 25 }, { minDots: 250, level: 'Intermediário', percentileApprox: 50 }, { minDots: 320, level: 'Avançado', percentileApprox: 75 }, { minDots: 400, level: 'Elite', percentileApprox: 92 }] },
  { maxBodyweight: 57, classLabel: 'até 57 kg', bands: [{ minDots: 0, level: 'Iniciante', percentileApprox: 25 }, { minDots: 250, level: 'Intermediário', percentileApprox: 50 }, { minDots: 320, level: 'Avançado', percentileApprox: 75 }, { minDots: 400, level: 'Elite', percentileApprox: 92 }] },
  { maxBodyweight: 63, classLabel: 'até 63 kg', bands: [{ minDots: 0, level: 'Iniciante', percentileApprox: 25 }, { minDots: 250, level: 'Intermediário', percentileApprox: 50 }, { minDots: 320, level: 'Avançado', percentileApprox: 75 }, { minDots: 400, level: 'Elite', percentileApprox: 92 }] },
  { maxBodyweight: 69, classLabel: 'até 69 kg', bands: [{ minDots: 0, level: 'Iniciante', percentileApprox: 25 }, { minDots: 250, level: 'Intermediário', percentileApprox: 50 }, { minDots: 320, level: 'Avançado', percentileApprox: 75 }, { minDots: 400, level: 'Elite', percentileApprox: 92 }] },
  { maxBodyweight: 76, classLabel: 'até 76 kg', bands: [{ minDots: 0, level: 'Iniciante', percentileApprox: 25 }, { minDots: 250, level: 'Intermediário', percentileApprox: 50 }, { minDots: 320, level: 'Avançado', percentileApprox: 75 }, { minDots: 400, level: 'Elite', percentileApprox: 92 }] },
  { maxBodyweight: 84, classLabel: 'até 84 kg', bands: [{ minDots: 0, level: 'Iniciante', percentileApprox: 25 }, { minDots: 250, level: 'Intermediário', percentileApprox: 50 }, { minDots: 320, level: 'Avançado', percentileApprox: 75 }, { minDots: 400, level: 'Elite', percentileApprox: 92 }] },
  { maxBodyweight: Number.POSITIVE_INFINITY, classLabel: '+84 kg', bands: [{ minDots: 0, level: 'Iniciante', percentileApprox: 25 }, { minDots: 250, level: 'Intermediário', percentileApprox: 50 }, { minDots: 320, level: 'Avançado', percentileApprox: 75 }, { minDots: 400, level: 'Elite', percentileApprox: 92 }] },
];

/**
 * Classificação aproximada por DOTS usando referência estática local.
 */
export function getStrengthComparison(dots: number, bodyweight: number, isMale: boolean): StrengthComparisonResult {
  const reference = isMale ? DOTS_REFERENCE_MALE : DOTS_REFERENCE_FEMALE;
  const refClass = reference.find((c) => bodyweight <= c.maxBodyweight) ?? reference[reference.length - 1];

  if (!(dots > 0) || !(bodyweight > 0)) {
    return {
      level: 'Iniciante',
      percentileApprox: 0,
      topPercentApprox: 100,
      bodyweightClass: refClass.classLabel,
      note: 'Estimativa indisponível: faltam dados válidos de DOTS/peso corporal.',
    };
  }

  const bandIdx = [...refClass.bands].map((b, i) => ({ b, i })).reverse().find(({ b }) => dots >= b.minDots)?.i ?? 0;
  const band = refClass.bands[bandIdx];
  const next = refClass.bands[bandIdx + 1];
  return {
    level: band.level,
    percentileApprox: band.percentileApprox,
    topPercentApprox: Math.max(1, 100 - band.percentileApprox),
    bodyweightClass: refClass.classLabel,
    note: 'Estimativa aproximada baseada em referência estática (OpenPowerlifting).',
    nextLevel: next?.level,
    dotsToNext: next ? Math.max(0, Math.round((next.minDots - dots) * 100) / 100) : undefined,
  };
}

/**
 * IPF GL Points Formula
 */
export function calculateIpfGl(bodyweight: number, total: number, isMale: boolean, isEquipped: boolean = false): number {
  if (!(bodyweight > 0) || !(total > 0)) return 0;

  // IPF GL 2020 — coeficientes para Powerlifting (SBD).
  // Fonte: OpenPowerlifting goodlift.rs (MIT-licensed)
  // https://gitlab.com/openpowerlifting/opl-data/-/raw/main/crates/coefficients/src/goodlift.rs
  let a: number, b: number, c: number;

  if (isMale) {
    if (isEquipped) {
      a = 1236.25115;
      b = 1449.21864;
      c = 0.01644;
    } else {
      a = 1199.72839;
      b = 1025.18162;
      c = 0.009210;
    }
  } else {
    if (isEquipped) {
      a = 758.63878;
      b = 949.31382;
      c = 0.02435;
    } else {
      a = 610.32796;
      b = 1045.59282;
      c = 0.03048;
    }
  }

  // GL Points = total * (100 / (a - b * e^(-c * bodyweight)))
  const denominator = a - b * Math.exp(-c * bodyweight);
  if (denominator <= 0) return 0;
  const coeff = 100 / denominator;
  return Math.round((total * coeff) * 100) / 100;
}

export interface PlateCalculationResult {
  plateWeight: number;
  count: number; // count on ONE side of the bar
}

/**
 * Computes plate breakdown for a given target weight
 */
export function calculatePlates(
  targetWeight: number,
  barWeight: number,
  availablePlates: number[]
): {
  plates: PlateCalculationResult[];
  actualWeight: number;
  remainingWeight: number;
} {
  const result: PlateCalculationResult[] = [];
  if (targetWeight <= barWeight) {
    return { plates: [], actualWeight: barWeight, remainingWeight: 0 };
  }

  // Weight required on BOTH sides total
  const weightToLoadTotal = targetWeight - barWeight;
  // Weight required on ONE side
  let weightPerSide = weightToLoadTotal / 2;

  // Sort available plates descending
  const sortedPlates = [...availablePlates].sort((a, b) => b - a);

  for (const plate of sortedPlates) {
    if (weightPerSide >= plate) {
      const count = Math.floor(weightPerSide / plate);
      if (count > 0) {
        result.push({ plateWeight: plate, count });
        weightPerSide -= plate * count;
      }
    }
  }

  const loadedWeightPerSide = result.reduce((acc, p) => acc + p.plateWeight * p.count, 0);
  const actualWeight = barWeight + loadedWeightPerSide * 2;
  const remainingWeight = targetWeight - actualWeight;

  return {
    plates: result,
    actualWeight,
    remainingWeight,
  };
}

/**
 * Default plates available in a standard gym setup
 */
export const DEFAULT_PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25, 0.5, 0.25];
export const DEFAULT_PLATES_LBS = [55, 45, 35, 25, 10, 5, 2.5];

// ===== Mapa de músculos por exercício (heatmap de volume) =====
export type MuscleGroup =
  | 'peito' | 'costas' | 'ombros' | 'biceps' | 'triceps' | 'antebraco'
  | 'abdomen' | 'lombar' | 'gluteos' | 'quadriceps' | 'posterior' | 'panturrilha' | 'trapezio';

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  peito: 'Peito', costas: 'Costas', ombros: 'Ombros', biceps: 'Bíceps', triceps: 'Tríceps',
  antebraco: 'Antebraço', abdomen: 'Abdômen', lombar: 'Lombar', gluteos: 'Glúteos',
  quadriceps: 'Quadríceps', posterior: 'Posterior de coxa', panturrilha: 'Panturrilha', trapezio: 'Trapézio',
};

interface MuscleRule { match: string[]; primary: MuscleGroup[]; secondary?: MuscleGroup[]; }

// Ordem importa: padrões específicos antes dos genéricos.
const EXERCISE_MUSCLE_MAP: MuscleRule[] = [
  { match: ['supino inclinado', 'incline'], primary: ['peito', 'ombros'], secondary: ['triceps'] },
  { match: ['supino', 'bench', 'crucifixo', 'peck', 'peitoral'], primary: ['peito'], secondary: ['triceps', 'ombros'] },
  { match: ['agachamento frontal', 'front squat', 'frontal'], primary: ['quadriceps'], secondary: ['gluteos', 'abdomen'] },
  { match: ['hack', 'leg press', 'legpress'], primary: ['quadriceps', 'gluteos'], secondary: ['posterior'] },
  { match: ['agachamento', 'squat', 'agacho'], primary: ['quadriceps', 'gluteos'], secondary: ['posterior', 'lombar', 'abdomen'] },
  { match: ['terra romeno', 'romeno', 'rdl', 'stiff'], primary: ['posterior', 'gluteos'], secondary: ['lombar', 'costas'] },
  { match: ['levantamento terra', 'terra', 'deadlift'], primary: ['posterior', 'gluteos', 'lombar'], secondary: ['costas', 'trapezio', 'antebraco'] },
  { match: ['desenvolvimento', 'militar', 'ohp', 'overhead', 'arnold'], primary: ['ombros'], secondary: ['triceps', 'trapezio'] },
  { match: ['elevação lateral', 'elevacao lateral', 'lateral raise'], primary: ['ombros'] },
  { match: ['encolhimento', 'shrug'], primary: ['trapezio'] },
  { match: ['barra fixa', 'pull up', 'pull-up', 'pullup', 'puxada', 'pulldown'], primary: ['costas'], secondary: ['biceps', 'antebraco'] },
  { match: ['remada', 'row'], primary: ['costas'], secondary: ['biceps', 'antebraco', 'trapezio'] },
  { match: ['rosca', 'curl', 'biceps', 'bíceps'], primary: ['biceps'], secondary: ['antebraco'] },
  { match: ['tríceps', 'triceps', 'testa', 'pulley', 'francês', 'frances'], primary: ['triceps'] },
  { match: ['cadeira extensora', 'extensora', 'leg extension'], primary: ['quadriceps'] },
  { match: ['mesa flexora', 'flexora', 'leg curl'], primary: ['posterior'] },
  { match: ['hip thrust', 'elevação pélvica', 'elevacao pelvica', 'glúteo', 'gluteo'], primary: ['gluteos'], secondary: ['posterior'] },
  { match: ['panturrilha', 'calf', 'gêmeos', 'gemeos'], primary: ['panturrilha'] },
  { match: ['abdominal', 'abdômen', 'abdomen', 'prancha', 'crunch', 'core'], primary: ['abdomen'] },
  { match: ['lombar', 'hiperextensão', 'hiperextensao', 'hyperextension'], primary: ['lombar'] },
];

/** Grupos musculares (primários e secundários) de um exercício pelo nome. */
export function getExerciseMuscles(name: string): { primary: MuscleGroup[]; secondary: MuscleGroup[] } {
  const n = (name || '').toLowerCase();
  for (const rule of EXERCISE_MUSCLE_MAP) {
    if (rule.match.some((m) => n.includes(m))) {
      return { primary: rule.primary, secondary: rule.secondary ?? [] };
    }
  }
  return { primary: [], secondary: [] };
}

/**
 * Peso corporal vigente em uma data: registro mais recente com data <= alvo;
 * cai no fallback (Settings.bodyweight) se não houver registro anterior.
 */
export function getEffectiveBodyweight(
  log: { date: string; weight: number }[],
  at: string | number | Date,
  fallback: number,
): number {
  const t = new Date(at).getTime();
  let best: { date: string; weight: number } | null = null;
  for (const e of log) {
    const et = new Date(e.date).getTime();
    if (et <= t && (!best || et > new Date(best.date).getTime())) best = e;
  }
  return best ? best.weight : fallback;
}

/**
 * Série de peso corporal normalizada no intervalo solicitado.
 * Mantém somente registros válidos e, para o mesmo dia, preserva o mais recente.
 */
export function getBodyweightSeriesInRange(
  log: { date: string; weight: number }[],
  from: number,
  to: number,
): { date: string; weight: number }[] {
  const normalized = log
    .map((entry) => ({
      date: entry.date,
      weight: entry.weight,
      timestamp: new Date(entry.date).getTime(),
    }))
    .filter((entry) => Number.isFinite(entry.timestamp) && entry.weight > 0)
    .filter((entry) => entry.timestamp >= from && entry.timestamp <= to)
    .sort((a, b) => a.timestamp - b.timestamp)

  const byDay = new Map<string, { date: string; weight: number; timestamp: number }>()
  for (const entry of normalized) {
    const dayKey = entry.date.slice(0, 10)
    byDay.set(dayKey, entry)
  }

  return Array.from(byDay.values())
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(({ date, weight }) => ({ date, weight }))
}

