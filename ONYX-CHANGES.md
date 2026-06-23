# ONYX — Redesign completo (tema, marca, nav, telas, análises)

Este pacote (`code/`) espelha a estrutura do repo `powerlifting-app/`. Copie os arquivos por cima
dos atuais **dentro de uma branch dedicada** e valide com `lint` + `build` antes do commit.

> ⚠️ Não tenho build do app React aqui, então **rode `npm run lint` e `npm run build` localmente**
> antes de commitar — corrija qualquer ajuste fino de tipo que apareça.

## O que mudou

### Marca & PWA
- **ONYX**: wordmark Outfit 900 + marca (anilha de frente). Ícones regenerados em `apps/web/public/`
  (`favicon.svg` vetorial, `favicon.ico`, `pwa-64/192/512`, `maskable-512`, `apple-touch-180`, `logo.svg`, `mark.svg`).
- Manifest/título do PWA renomeados para **ONYX** (`vite.config.ts`, `index.html`), `theme_color` `#060606`.

### Tema de acento (já existente, mantido)
- `--accent` único + `data-theme` (Onyx · Brass · Volt), padrão Brass. Telas restantes tematizadas
  (sem `#fff`/`#000` hardcoded em ações).

### Navegação
- **Barra de 5 slots com FAB central "Treinar"** (`App.tsx`). Análises volta para a barra; **Mais**
  agrupa Calculadoras + Configurações (sem Análises duplicada). Hub **Mais** vira tiles + resumo do atleta.

### Telas redesenhadas
- **Início** (`Dashboard.tsx`): retomar/iniciar treino, resumo da semana, peso (registro rápido + sparkline),
  mini-evolução e1RM/DOTS, PRs, histórico recente + modal.
- **Treino ativo** (`Workout.tsx`): linhas de série tocáveis e arejadas (coluna "anterior", chip de tipo
  N/W/D, RPE, check que dispara o descanso), calculadora de anilhas integrada.
- **Rotinas** (`Templates.tsx`): lista compacta com filtro Minhas/Embutidas; o card **expande** mostrando
  os exercícios; criação em **builder de cards** com prescrição por **% do 1RM _ou_ RPE** (um ou outro).
- **Análises** (`Analytics.tsx`): timeframe presets (4/12 sem · Ano · Tudo) **+ personalizado com duas datas**;
  tendência do total SBD; e1RM por levantamento; **peso corporal ao longo do tempo**;
  **heatmap muscular frente/costas** (medir por tonelagem/séries); tonelagem semanal; top exercícios;
  RPE médio/semana; e1RM relativo ao peso; + donut SBD, distribuição de RPE, frequência e PRs.
- **Calculadoras** (`Calculators.tsx`): abas segmentadas + barra visual (V1).

### Modelo de dados
- `packages/shared/src/workout.ts`: novo `BodyweightEntry` e `AppState.bodyweightLog`.
- `WorkoutContext.tsx`: `logBodyweight` / `deleteBodyweightEntry` / `getBodyweightAt`. O peso vigente em
  cada data alimenta DOTS/Wilks; registro novo vale dali pra frente; editar um registro antigo afeta só
  aquele período. Estados salvos antigos são normalizados (`bodyweightLog: []`).
- `utils/powerlifting.ts`: `getExerciseMuscles` (mapa exercício→grupo muscular), `MUSCLE_LABELS`,
  `getEffectiveBodyweight`.

### Docs
- `README.md` e `AGENTS.md` atualizados (tema, nav, marca/PWA).

## Arquivos (copiar por cima)

```
apps/web/index.html
apps/web/vite.config.ts
apps/web/public/{favicon.svg,favicon.ico,pwa-64x64.png,pwa-192x192.png,pwa-512x512.png,maskable-icon-512x512.png,apple-touch-icon-180x180.png,logo.svg,mark.svg}
apps/web/src/index.css
apps/web/src/App.tsx
apps/web/src/context/WorkoutContext.tsx
apps/web/src/utils/powerlifting.ts
apps/web/src/pages/{Dashboard,Workout,Templates,Analytics,Calculators,Settings,More}.tsx
apps/web/src/components/RestTimer.tsx
packages/shared/src/workout.ts
README.md
AGENTS.md
```
> `apps/web/src/components/PlateVisualizer.tsx` está incluído no pacote mas **não mudou** — pode ignorar.

## Branch, validação e commit

```bash
git checkout main && git pull
git checkout -b feat/onyx-redesign       # use feat/<nº-da-issue>-onyx-redesign se houver issue

# copie os arquivos acima do pacote (code/) por cima dos do repo, então:
npm install
npm run lint
npm run build
git add -A
git commit -m "feat: redesign ONYX — nav 5+FAB, Início/Análises/Treino/Rotinas/Calculadoras, peso & músculos, marca/PWA"
git push -u origin feat/onyx-redesign
```

## Notas
- **Sem novas dependências** — CSS inline/puro + lucide-react + SVG (gráficos e heatmap feitos à mão).
- Heatmap muscular = silhueta estilizada anatômica (frente/costas) colorida por intensidade.
- Se preferir fatiar em PRs menores (AGENTS favorece 1 PR/issue): tema+marca → nav+Mais → Início →
  Análises → Treino/Rotinas/Calculadoras reaproveitam estes mesmos arquivos.
