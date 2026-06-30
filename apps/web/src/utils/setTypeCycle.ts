/** Ciclo do tipo de série ao tocar no número da série: Normal → Aquecimento → Drop. */
export const TYPE_CYCLE: Record<'N' | 'W' | 'D', 'N' | 'W' | 'D'> = { N: 'W', W: 'D', D: 'N' };
