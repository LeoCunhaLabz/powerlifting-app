// Instrumentação de uso (Umami, issue #290) — espelho de apps/web/src/utils/analytics.ts.
// O script é injetado no BaseLayout só quando PUBLIC_UMAMI_WEBSITE_ID existe no build;
// com adblock/CSP/ausência do script, tudo vira no-op. Analytics nunca quebra a página.

type UmamiEventData = Record<string, string | number>;

interface Umami {
  track(event: string, data?: UmamiEventData): void;
}

declare global {
  interface Window {
    umami?: Umami;
  }
}

export type PublicCalculator = 'hero-dots' | 'dots' | '1rm' | 'anilhas';

/**
 * Eventos nomeados em uso na landing (mantenha a lista ao adicionar um):
 * - `calculadora-publica` (via trackCalculatorUse);
 * - calculadora de força (issue #316): `forca-resultado` (props `lift`, `nivel`,
 *   `reps_gt_1`, `modo`), `forca-cta-app`, `forca-compartilhar`, `forca-add-lift`.
 *   Com o `registro-concluido` do app fecham o funil resultado → CTA → conta.
 */

/** Registra um evento nomeado (best-effort). */
export function trackEvent(name: string, data?: UmamiEventData): void {
  try {
    window.umami?.track(name, data);
  } catch {
    // nunca propagar erro de analytics
  }
}

/** Primeira interação real com uma calculadora pública (uma vez por página). */
export function trackCalculatorUse(tipo: PublicCalculator): void {
  trackEvent('calculadora-publica', { tipo });
}
