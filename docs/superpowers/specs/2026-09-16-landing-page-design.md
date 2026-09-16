# Landing page pública ONYX — spec de design (issue #250)

**Status:** direção aprovada em 16/09/2026 (sessão de exploração visual).
**Referência visual:** canvas "Landing ONYX" — https://claude.ai/artifact/SHkabVuMsWeNoxoJfUWTVS
(página "Final — Utility-first" = spec visual; página "Direções exploradas" = alternativas descartadas, manter como registro).
**Escopo desta spec:** a HOME da landing. Rotas de calculadora, páginas evergreen e privacidade/termos são conteúdo da issue #250, mas o design delas deriva desta home.

## Decisão

Direção **Utility-first** ("a calculadora demonstra o produto em 5 segundos"), híbrida com:
- a seção **"O app"** com 3 frames de celular (herdada da direção Editorial);
- a **tabela comparativa** (herdada da direção Comparativo), com 4 colunas de produto: **ONYX · Strong · Hevy · Outros (apps genéricos)**.

## Linha editorial

- **Tom técnico-sóbrio:** fala de igual para igual com quem treina powerlifting; RPE/%1RM/DOTS sem tutorial na home (as evergreen educam). Zero hype fitness, zero emoji.
- **Hero copy aprovado (GTM #260), não alterar:** "O diário de treino que fala a língua do powerlifting: RPE, %1RM, DOTS e total SBD — grátis, em português, offline." (Na home: título até "powerlifting.", com a palavra "powerlifting" em brass; o restante como subtítulo.)
- CTA primário único, repetido pela página: **"Criar conta grátis"** → app.onyxtreino.com.br. Secundário: **"Usar as calculadoras"** (âncora/rotas públicas).

## Estrutura de seções (ordem final, desktop)

| # | Seção | Conteúdo | reactbits (TS + CSS) |
|---|---|---|---|
| 1 | Nav | logo (anel brass + ONYX) · Calculadoras · Recursos · Comparativo · CTA "Abrir o app" | — |
| 2 | Hero 2 colunas | esquerda: kicker + H1 + sub + CTAs; direita: **calculadora DOTS funcional** (Masc/Fem, peso corporal, total SBD → DOTS gigante + Wilks + IPF GL). Fundo: dot grid sutil com fade radial | Count Up (resultado), Dot Grid (fundo, lazy) |
| 3 | Faixa de vocabulário | RPE · %1RM · e1RM · DOTS · IPF GL · WILKS · TOTAL SBD | Logo Loop / Scroll Velocity |
| 4 | Calculadoras públicas | 3 cards → rotas próprias: DOTS/Wilks/IPF GL · 1RM por RPE (tabela RTS + Brzycki/Epley) · Anilhas (mini-visualização com cores IPF) | Spotlight Card |
| 5 | Diferenciais | 6 cards: RPE programável · %1RM sobre e1RM atual · DOTS/IPF GL nativos · Offline (PWA) · pt-BR · Grátis | Animated Content (reveal) |
| 6 | O app | 3 frames de celular com UI recriada: treino ativo (RPE + coluna ANT.) · dashboard (central, maior) · resumo pós-treino (PRs) | Tilted Card / Card Swap |
| 7 | Comparativo | tabela 5 colunas (critério + ONYX/Strong/Hevy/Outros); coluna ONYX destacada em brass com glow; valores: ✓ brass, "parcial"/"varia"/"assinatura"/"anúncios" em muted | Electric Border (coluna ONYX), Fade Content |
| 8 | CTA final + footer | "Comece pelo cálculo. Fique pelo diário." + CTAs + links: Privacidade · Termos · O que é DOTS · Tabela de RPE | — |

A implementação real da calculadora do hero reutiliza os cálculos puros de `apps/web/src/utils/powerlifting.ts` (`calculateDots`, `calculateWilks`, `calculateIpfGl`) como ilha React.

## Identidade visual

- **Tokens** (de `apps/web/src/index.css`): fundos `#000/#060606/#161616/#1e1e1e`; texto `#fafafa/#9a9aa0/#5c5c61`; borda `#242424`; accent brass `#e3a83b` + `--accent-soft rgba(227,168,59,.12)` + `--accent-border rgba(227,168,59,.30)` + `--accent-ink #1a1304`; radius 4/8/14 + pills 999px; gradiente 135° accent-soft→transparente.
- **Tokens novos da landing** (não existem no app): hairline `#1a1a1a` (divisórias mais sutis que `--border-color`), superfície de tabela `#0d0d0d`, hover de link `#f0c06a`.
- **Fontes:** Outfit (display/números; **carregar também o peso 900** — o `logo.svg` usa e o app não carrega) + Plus Jakarta Sans (corpo). Google Fonts com `preconnect`; avaliar self-host (workbox já aceita woff2).
- **Assets:** `apps/web/public/logo.svg` (wordmark) e `favicon.svg` (anel) — prontos, não referenciados pelo app. Falta **imagem OG** (lacuna conhecida; a arte do hero pode virar o og-image).
- Cor fora do brass só em: anilhas IPF (25 `#ef4444` · 20 `#3b82f6` · 15 `#eab308` · 10 `#10b981` · 5 branco · frac. `#6b7280`).

## Responsividade e performance (requisitos, não sugestões)

- Mobile-first real (o artboard 390px é normativo): hero empilha (copy → CTAs → calculadora full-width); a tabela comparativa **colapsa Strong/Hevy/Outros numa coluna única "Outros apps"** em ≤ 480px; seção "O app" vira 1 frame (dashboard) ou carrossel.
- **Orçamento de movimento:** tudo que depende de gsap/ogl (Dot Grid, Count Up animado, Tilted Card, Electric Border) entra como **ilha Astro lazy (`client:visible`/`client:idle`), só desktop**; mobile e `prefers-reduced-motion` recebem o mesmo layout com CSS estático. O HTML do hero (texto + calculadora renderizada) deve chegar estático para o crawler — LCP não espera JS.
- reactbits sempre na variante **TS + CSS** (projeto sem Tailwind); componentes copiados para o repo (sem dependência de pacote react-bits).

## Pendências a validar antes de publicar

1. **Tabela comparativa:** os valores (parcial/✗/assinatura/anúncios de Strong, Hevy e genéricos) estão como placeholder — validar célula a célula contra a análise competitiva da issue #255.
2. **Claim "sincroniza quando a rede voltar":** confirmar que descreve o comportamento real do PWA + API hoje.
3. Números de exemplo dos mockups (total 512,5 / DOTS 335,6 / e1RMs 180/122,5/210) são amostras coerentes entre si — na implementação, a calculadora calcula de verdade.
