/** URLs e textos fixos da landing (única fonte para nav, CTAs, footer e SEO). */
export const SITE_URL = 'https://onyxtreino.com.br';
export const APP_URL = 'https://app.onyxtreino.com.br';
export const SITE_NAME = 'ONYX';

/** Hero copy aprovado no GTM (issue #260) — não alterar sem nova decisão. */
export const HERO_TITLE_PREFIX = 'O diário de treino que fala a língua do ';
export const HERO_TITLE_ACCENT = 'powerlifting';
export const HERO_SUBTITLE = 'RPE, %1RM, DOTS e total SBD — grátis, em português, offline.';

export const DEFAULT_DESCRIPTION =
  'ONYX é o diário de treino de powerlifting em português: RPE, %1RM, DOTS, Wilks e IPF GL, grátis e offline. Calculadoras públicas sem login.';

export const CTA_PRIMARY = 'Criar conta grátis';
export const CTA_CALCULATORS = 'Usar as calculadoras';
export const CTA_OPEN_APP = 'Abrir o app';

export const ROUTES = {
  home: '/',
  calcDots: '/calculadoras/dots',
  calc1rm: '/calculadoras/1rm',
  calcAnilhas: '/calculadoras/anilhas',
  privacidade: '/privacidade',
  termos: '/termos',
} as const;

export const NAV_LINKS = [
  { href: '/#calculadoras', label: 'Calculadoras' },
  { href: '/#recursos', label: 'Recursos' },
  { href: '/#comparativo', label: 'Comparativo' },
] as const;

/** Vocabulário da faixa (seção 3 da spec). */
export const VOCAB = ['RPE', '%1RM', 'e1RM', 'DOTS', 'IPF GL', 'WILKS', 'TOTAL SBD'] as const;

/** Data de revisão dos textos legais — atualizar ao mudar privacidade/termos. */
export const LEGAL_UPDATED_AT = '2026-09-16';
