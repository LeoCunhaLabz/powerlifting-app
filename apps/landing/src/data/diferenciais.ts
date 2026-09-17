/** Seção 5 da spec: 6 diferenciais. Ícones são chaves resolvidas em Differentials.astro. */
export type DifferentialIcon = 'bars' | 'percent' | 'clock' | 'wifi' | 'globe' | 'check';

export interface Differential {
  icon: DifferentialIcon;
  title: string;
  text: string;
}

export const DIFFERENTIALS: Differential[] = [
  {
    icon: 'bars',
    title: 'RPE programável',
    text: 'Prescreva séries por RPE e registre o esforço real, série a série — não só o peso.',
  },
  {
    icon: 'percent',
    title: '%1RM sobre o e1RM atual',
    text: 'Programas por porcentagem calculados sobre o seu estimado de hoje — não sobre um máximo de seis meses atrás.',
  },
  {
    icon: 'clock',
    title: 'DOTS e IPF GL nativos',
    text: 'Força relativa em todas as análises — recordes, evolução e comparativos já saem em pontos.',
  },
  {
    icon: 'wifi',
    title: 'Offline por padrão',
    text: 'PWA: registra na academia sem sinal e sincroniza quando a rede voltar.',
  },
  {
    icon: 'globe',
    title: 'Em português de verdade',
    text: 'Agachamento, supino e terra — sem tradução automática de app genérico.',
  },
  {
    icon: 'check',
    title: 'Grátis',
    text: 'Sem paywall no essencial. Crie a conta e treine.',
  },
];
