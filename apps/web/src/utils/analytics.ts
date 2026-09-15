// Instrumentação de uso (Umami, issue #290). O script externo é carregado no
// index.html e expõe window.umami; ele pode estar ausente (dev, adblock, CSP),
// então todo tracking é best-effort — analytics nunca pode quebrar o app.

type UmamiEventData = Record<string, string | number>;

interface Umami {
  track(event: string, data?: UmamiEventData): void;
  track(props: (base: Record<string, unknown>) => Record<string, unknown>): void;
}

declare global {
  interface Window {
    umami?: Umami;
  }
}

/** Registra um evento nomeado (ex.: 'treino-finalizado'). */
export function trackEvent(name: string, data?: UmamiEventData): void {
  try {
    window.umami?.track(name, data);
  } catch {
    // best-effort: nunca propagar erro de analytics
  }
}

/** Registra a troca de aba como pageview virtual — o SPA não muda de URL. */
export function trackTabView(tab: string): void {
  try {
    window.umami?.track(props => ({ ...props, url: `/${tab}`, title: tab }));
  } catch {
    // best-effort: nunca propagar erro de analytics
  }
}
