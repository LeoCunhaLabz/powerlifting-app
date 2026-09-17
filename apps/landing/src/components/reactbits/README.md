# Componentes copiados do reactbits.dev

Origem: [DavidHDev/react-bits](https://github.com/DavidHDev/react-bits), variante **TS + CSS**
(`src/ts-default/…`), licença MIT + Commons Clause. Copiados para o repo em 16/09/2026
(regra da spec: sem dependência do pacote `react-bits`; sem Tailwind).

| Componente | Deps | Onde entra | Adaptação local |
|---|---|---|---|
| `CountUp` | motion | número do DOTS no hero (desktop) | formatação `pt-BR` via prop `locale`, casas decimais fixas |
| `DotGrid` | gsap + InertiaPlugin | fundo do hero (desktop, `client:media`) | — |
| `LogoLoop` | — | faixa de vocabulário | — |
| `SpotlightCard` | — | cards das calculadoras | cores/raio via CSS vars do tema |
| `AnimatedContent` | gsap + ScrollTrigger | reveal dos diferenciais (desktop) | conteúdo visível no SSR (sem `visibility:hidden` inline) |
| `FadeContent` | gsap + ScrollTrigger | reveal do comparativo (desktop) | idem |
| `TiltedCard` | motion | frames de celular da seção "O app" (desktop) | recebe `children` no lugar de `imageSrc`; sem aviso mobile |
| `ElectricBorder` | — | coluna ONYX do comparativo (desktop) | — |

Regra de performance (spec): tudo que depende de gsap/motion só hidrata em desktop e
sem `prefers-reduced-motion` (`client:media` com `MOTION_MEDIA` de `src/lib/media.ts`).
Mobile recebe o mesmo layout em CSS estático.
