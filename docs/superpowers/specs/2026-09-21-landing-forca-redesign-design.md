# Landing ONYX — redesign de comunicação, calculadora "Quão forte você é" e passe visual

**Status:** design aprovado em 21/09/2026 (sessão de brainstorming com Leonardo).
**Referência visual:** `docs/superpowers/specs/2026-09-21-landing-forca-redesign/resultado-card-v4.html` (card de resultado, **normativo**) e `tipografia.html` (opção B = Archivo). São fragmentos HTML autocontidos: abrir no navegador. As alternativas descartadas (card A/B/C, A+B, V1) ficaram só na sessão.
**Substitui** as seções "Linha editorial", "Estrutura de seções", "Identidade visual > Fontes" e o uso de reactbits da spec `2026-09-16-landing-page-design.md`. Tokens de cor, responsividade e regras de performance daquela spec continuam valendo salvo onde esta diz o contrário.
**Escopo:** a HOME da landing, a nova página `/quao-forte-voce-e`, o pipeline de dados do OpenPowerlifting e a ponte de cadastro no app. Páginas evergreen e calculadoras existentes (`/calculadoras/*`, `/o-que-e-dots`, `/tabela-de-rpe`…) **não mudam**: quem chega nelas pesquisou o termo.

## 1. Problema e decisão

Feedback de um designer UX/UI que também é powerlifter (set/2026): a home é técnica demais — sete siglas nos primeiros segundos (hero + faixa de vocabulário), calculadora que pede "total SBD" e devolve pontos DOTS, três diferenciais com sigla no título. A página convence quem já está convencido.

**Decisão: manter o nicho, trocar o registro.** A landing continua sendo *de powerlifting* (barra, agachamento/supino/terra, competição), mas fala como um técnico explicando pra quem está começando, não como uma planilha. A calculadora do hero deixa de ser DOTS e passa a responder a pergunta que o lifter médio realmente tem: **"quão forte eu sou?"**, comparando com quem compete no Brasil (OpenPowerlifting).

Junto, um **passe visual de subtração**: os efeitos que denunciam página gerada por IA (borda elétrica, spotlight, tilt 3D, grade de pontos interativa, letreiro, gradientes e sombras pesadas) saem; a tipografia de display troca.

## 2. Persona

Treina 3–5×/semana, faz os três básicos, sabe o que é 1RM, talvez tenha ouvido falar de RPE, não sabe o que é DOTS, não compete (ainda). O concorrente real dele não é o Hevy: é a planilha do Google Sheets ou o PDF do coach.

## 3. Linha editorial (requisitos)

- **Benefício no título, termo na legenda.** Todo diferencial, critério do comparativo e card de calculadora segue esse padrão. Quem é técnico vê o termo e sabe que é real; quem não é entende o valor.
- **Toda frase de benefício mapeia pra uma feature que existe hoje no app.** Nada de modo competição (#289), coach compartilhado ou percentil global. Quem escreve copy confere contra o app antes.
- **Sem sigla solta no hero.** RPE/%1RM/DOTS aparecem só em legendas e no rodapé de cards.
- A tagline do GTM ("o app que fala a língua do powerlifting") **fica no footer**. O nicho continua assinado; só não abre a página.
- Tom sóbrio, zero hype fitness, zero emoji, zero travessão (decisões anteriores mantidas).
- Copy é voz do Leonardo: os textos desta spec são calibração de tom, não final. O que é normativo é a estrutura e o padrão.

## 4. Estrutura da home (ordem final)

| # | Seção | Conteúdo | Muda em relação a hoje |
|---|---|---|---|
| 1 | Nav | igual | — |
| 2 | **Hero** | kicker · H1 (§5) · subtítulo · CTAs; à direita a **ilha "Quão forte você é" em modo compacto** (§6). Fundo chapado. | calculadora DOTS sai; DotGrid e fade radial saem |
| 3 | **Isso é pra você** | 3 cenários curtos (§5) | nova; substitui a faixa de siglas (LogoLoop), que é removida |
| 4 | Diferenciais | os 6 cards com títulos reescritos (§5) | copy; sombra de hover sai |
| 5 | **Um treino no ONYX** | os 4 frames de celular existentes com legendas narrativas: *abre → vê a carga de hoje → registra como foi → vê se evoluiu* | legendas; TiltedCard sai |
| 6 | Ferramentas grátis, sem conta | os 3 cards de calculadora, títulos em pergunta (§5) | desce de posição; SpotlightCard sai |
| 7 | Comparativo | mesma tabela e mesmos valores/fontes; critérios reescritos (§5) | copy; ElectricBorder/FadeContent/glow/gradientes saem |
| 8 | CTA final | "Comece pelo cálculo. Fique pelo app." | gradiente de fundo sai |
| 9 | Footer | igual + tagline do GTM | — |

**Mobile:** hero empilha **título → calculadora → CTAs** (a calculadora é o gancho; a ordem muda em relação à spec anterior). Demais seções como hoje.

## 5. Copy (calibração de tom)

**Hero**
- Kicker: `App de treino · Powerlifting` (em `--text-secondary`, não brass).
- H1 (opção A aprovada): **"Quão forte você é? E quanto falta pro próximo nível?"** — monocromático, sem palavra em brass.
- Subtítulo: "Compare com quem compete no Brasil e treine com um app que calcula a carga certa de cada dia. Grátis, em português, funciona sem internet."
- CTAs da coluna de texto: "Criar conta grátis" e "Ver as calculadoras", **ambos em estilo secundário (contorno/texto)**. O único botão brass do hero é o da calculadora ("Ver meu resultado" → "Salvar e acompanhar a evolução"): a conversão principal passa pelo resultado, e isso mantém a disciplina de brass (§9). Nota: "Sem cartão. As calculadoras funcionam sem conta."
- `<title>`: "ONYX: descubra quão forte você é e treine powerlifting em português". Meta description segue o subtítulo.

**Isso é pra você** (3 cards, título + 1 frase)
- **Treina os três básicos na academia** — "Sem técnico, sem planilha. O ONYX diz quanto colocar na barra e guarda cada série."
- **Segue a planilha do coach** — "Registre o programa como ele foi escrito, por porcentagem ou RPE, e pare de fazer conta no meio do treino."
- **Pensa em competir** — "Veja onde você ficaria entre quem já competiu no Brasil e acompanhe seu total até o dia."

**Diferenciais** (`data/diferenciais.ts` ganha campo `term` para a legenda)

| Hoje (título) | Novo título | Legenda |
|---|---|---|
| RPE programável | Registre como foi a série, não só o peso | RPE, de 1 a 10 |
| %1RM sobre o e1RM atual | A carga certa pra hoje, calculada sozinha | %1RM sobre o seu máximo estimado |
| DOTS e IPF GL nativos | Descubra se você é forte pro seu peso | DOTS, Wilks e IPF GL |
| Offline por padrão | Funciona sem internet | PWA: registra sem sinal, sincroniza depois |
| Em português de verdade | Em português de verdade | Agachamento, supino e terra, sem tradução automática |
| Grátis | Grátis no essencial | Sem paywall no app e nas análises |

**Ferramentas grátis, sem conta** (cards): "Quanto você levanta 1 vez?" (→ `/calculadoras/1rm`) · "Como montar a barra" (→ `/calculadoras/anilhas`) · "Sua força pelo peso corporal" (→ `/calculadoras/dots`).

**Comparativo** (`data/comparativo.ts`: `criterio` vira o benefício, `detalhe` vira o termo; valores e `fonte` não mudam)

| Critério novo | Detalhe (termo) |
|---|---|
| Mostra se você é forte pro seu peso | DOTS · Wilks · IPF GL |
| Calcula a carga do dia pra você | %1RM sobre o máximo atual + RPE |
| Em português de verdade | Agachamento, supino e terra |
| Funciona sem internet | PWA: registra sem sinal, sincroniza depois |
| Grátis no essencial | Sem paywall no app e nas análises |

## 6. Calculadora "Quão forte você é"

Ilha React (`apps/landing/src/islands/StrengthCalculator.tsx`) com dois modos: **compacto** (hero: um lift) e **completo** (página própria: três lifts + total + DOTS). Mesmo componente, mesma lógica.

### 6.1 Entrada
- Sexo (segmentado Masc./Fem.), lift (segmentado Agacho/Supino/Terra), peso corporal (kg), **carga que você fez** (kg), **quantas reps** (segmentado fixo `1 · 3 · 5 · 8 · 10`; padrão 1).
- Nota abaixo: "1 rep = seu máximo. Fez 5 com 110? Coloca assim, a gente estima o máximo."
- Botão "Ver meu resultado" (resultado não é ao vivo: precisa dos dados completos para curva e percentil).
- Modo completo: os três lifts lado a lado, cada um com carga + reps (lift sem carga é ignorado). O resultado tem um segmentado **Agacho · Supino · Terra · Total** acima de um único card; abre em Total quando os três estão preenchidos, senão no último lift preenchido. Total e DOTS só existem com os três; no card de Total a linha "Máximo estimado" vira "Total estimado: 372 kg" quando algum lift veio de reps > 1, e o rodapé acrescenta "DOTS 251,3".
- Reps > 1 → máximo estimado por `calculateE1RM(weight, reps)` (`@onyx/calc`, sem RPE = Brzycki). Reps > 10 não são aceitas (estimativa ruim).

### 6.2 Card de resultado (normativo: `resultado-card-v4.html`)
Escala tipográfica de **4 tamanhos** (kicker 10 · label 12 · número 20 · destaque 48). De cima pra baixo:
1. Kicker: `Seu supino · até 83 kg · raw`.
2. **Destaque**: razão carga/peso corporal com uma casa decimal, "1,5×" + "o seu peso corporal".
3. Linha "Máximo estimado: **124 kg**" — **só quando reps > 1**. Não repetir a entrada ("110 × 5").
4. **Curva** de distribuição da categoria (histograma suavizado), área à esquerda do usuário preenchida em brass a 30 %; marcador sólido "Você · 124 kg"; **marcador tracejado da meta** "Pódio regional · 132 kg"; eixo com os quatro degraus, o atual em brass.
5. Grade de **2 números**: "**45 %** dos atletas da sua categoria levantam menos" (brass) · "**8 kg** faltam pra Pódio regional".
6. Rodapé em uma linha: "Dados: OpenPowerlifting · **1.240 atletas** até 83 kg · raw · últimos 10 anos" (o *n* é obrigatório).
7. CTA primário "Salvar e acompanhar a evolução" (§8). Linha secundária: "Compartilhar · adicionar agacho e terra" — o segundo link abre `/quao-forte-voce-e` já com os dados atuais na query (§6.4). No modo completo, só "Compartilhar".

Sem chip de nível: o nível vive no marcador da curva e no eixo.

### 6.3 Estados
- **Acima do P100** (mais forte que todos): marcador no extremo direito, "100 % dos atletas…", sem meta; rodapé igual.
- **Abaixo do P0**: marcador no extremo esquerdo, "0 %", meta = P25 (Competitivo).
- **Classe fundida** (§7.4): kicker mostra "até 52–57 kg"; rodapé acrescenta "categorias agrupadas por poucos dados".
- **Elite nacional**: sem meta; a linha "faltam X kg" some e a grade fica com um número.
- Entrada inválida (peso ≤ 0, carga ≤ 0): botão desabilitado; sem mensagens de erro vermelhas.

### 6.4 Compartilhar (v1, nesta entrega)
Link que **re-renderiza o resultado ao carregar**. Parâmetros: `s` (m|f), `bw`, e por lift `sq`/`rsq`, `bp`/`rbp`, `dl`/`rdl` (carga/reps); o modo compacto manda só o par do lift escolhido (ex.: `/quao-forte-voce-e?s=m&bw=82&bp=110&rbp=5`). Reps ausente = 1. Botão usa Web Share API (`navigator.share`) no celular e copia o link no desktop, com feedback "Link copiado". Imagem 1080×1920 pra story é **v2, escopo da #292** (mesmo componente, saída em canvas).

### 6.5 Página `/quao-forte-voce-e`
Layout `CalcLayout`. Conteúdo: a ilha em modo completo → "Como ler a escada" (os quatro degraus explicados em duas linhas cada) → **Metodologia** (fonte, filtros, janela, `generatedAt`, texto de atribuição completo do OpenPowerlifting com link pro GitLab, e **tabela com o *n* por sexo × categoria**) → "Leia também" com as evergreen. `<title>`: "Quão forte você é? Compare seu supino, agacho e terra com quem compete no Brasil". JSON-LD `WebApplication` como nas calculadoras existentes. Entra no sitemap e no footer ("Ferramentas"). **Não ganha card na seção 6 da home**: o hero já é a versão compacta e o link "adicionar agacho e terra" do card leva até ela.

### 6.6 Medição (Umami, `lib/analytics.ts`)
Eventos novos: `forca-resultado` (props: `lift`, `nivel`, `reps_gt_1`, `modo`), `forca-cta-app`, `forca-compartilhar`, `forca-add-lift`. Com o `registro-concluido` existente fecham o funil *resultado → CTA → conta*.

### 6.7 Acessibilidade e movimento
- A curva tem `role="img"` e `aria-label` com o percentil e a meta em texto ("Você está acima de 45 % dos atletas da categoria até 83 kg; faltam 8 kg para Pódio regional").
- Segmentados (sexo, lift, reps) são `radiogroup` navegáveis por teclado.
- **Única animação da landing:** ao revelar o resultado, o número sobe (CountUp existente) e a área da curva preenche uma vez (≤ 600 ms). Mobile e `prefers-reduced-motion` recebem o estado final direto.

## 7. Escada e dados

### 7.1 Escada (opção A aprovada)
| Degrau | Percentil da categoria | Leitura na página de metodologia |
|---|---|---|
| Estreante | < P25 | "Você já levanta o que muita gente levantou na primeira competição. Dá pra estrear." |
| Competitivo | P25–P50 | "Entre a metade de baixo de quem compete: já briga por posição em meets regionais." |
| Pódio regional | P50–P85 | "Acima da metade dos competidores: pódio em meets regionais é realista." |
| Elite nacional | ≥ P85 | "Entre os 15 % mais fortes que competiram no Brasil na sua categoria." |

Os kg de cada degrau saem direto da tabela de percentis (P25/P50/P85 da categoria). **Os cortes P50/P85 devem ser calibrados na execução da issue A olhando os números reais** (ex.: o P85 de supino até 83 kg parece um supino de nacional?) — Leonardo decide; a spec fixa a estrutura, não os cortes.

### 7.2 Fonte
- `https://openpowerlifting.gitlab.io/opl-csv/files/openpowerlifting-latest.zip` (~162 MB, ~4 M linhas). Colunas usadas: `Name, Sex, Event, Equipment, Date, MeetCountry, BodyweightKg, Best3SquatKg, Best3BenchKg, Best3DeadliftKg, TotalKg`.
- Licença: os CSVs são **domínio público** (README do opl-data). Atribuição é pedida, não exigida; usamos o texto que eles sugerem na página de metodologia e "Dados: OpenPowerlifting" no card.
- Nomes repetidos vêm como `Nome #2`; `Name` é a chave de atleta.

### 7.3 Filtros (etapa 1, reutilizável)
`MeetCountry = Brazil` · `Equipment = Raw` · `Date` ≥ hoje − 10 anos · `Sex ∈ {M, F}` · `BodyweightKg > 0`. Por lift: `Best3*Kg > 0` (negativo = tentativa falhada) e `Event` contém o lift (supino conta meets só de supino). Total: `Event = SBD` e `TotalKg > 0`. Sem filtro de federação, idade, tested ou estado.

### 7.4 Agregação (etapa 2)
1. **Melhor por atleta** na janela, por lift e por total; o `BodyweightKg` daquele melhor define a categoria.
2. Bins = classes IPF já usadas no app: M `59/66/74/83/93/105/120/120+`, F `47/52/57/63/69/76/84/84+`.
3. Por sexo × classe × `{squat, bench, deadlift, total}`: `n`, percentis P0…P100 de 5 em 5 (21 valores) e histograma de 20 faixas normalizado (0–1) com `min`/`max`.
4. **Amostra mínima `n ≥ 50`**: abaixo, funde com a classe vizinha mais pesada (repete se preciso); `merged: true` e `label: "até 52–57 kg"`.
5. `meta`: `source`, `generatedAt`, `windowFrom/To`, `filters`, `attribution`.

Formato (`apps/web/src/data/strength-percentiles.json`, ~20 KB; exemplo abreviado, arrays reais têm 21 e 20 valores):
```json
{
  "meta": { "source": "OpenPowerlifting", "generatedAt": "2026-10-01", "windowFrom": "2016-10-01", "windowTo": "2026-10-01",
            "filters": "MeetCountry=Brazil, Equipment=Raw", "attribution": "This page uses data from the OpenPowerlifting project, https://www.openpowerlifting.org. You may download a copy of the data at https://gitlab.com/openpowerlifting/opl-data." },
  "classes": {
    "M": [ { "maxBodyweight": 83, "label": "até 83 kg", "merged": false,
             "bench": { "n": 1240, "p": [40, 55, 62, ...21 valores], "hist": [0.01, 0.03, ...20 valores], "min": 40, "max": 250 },
             "squat": {}, "deadlift": {}, "total": {} } ],
    "F": []
  }
}
```

### 7.5 Código
- Script `apps/web/scripts/build-strength-percentiles.ts`, comando `npm run opl:percentiles -w @powerlifting/web`; faz download, stream-parse (sem carregar tudo em memória), agrega e grava o JSON. Etapa 1 (parse+filtro) e etapa 2 (agregação) em funções separadas — a etapa 1 é a fundação do explorador de atletas (#298).
- `apps/web/src/utils/strength.ts`: `compareLift({ sex, bodyweight, lift, oneRm })` e `compareTotal({ sex, bodyweight, total })` → `{ classLabel, merged, n, percentile, level, nextLevel?, nextKg?, kgToNext?, ratio, hist, p }`. `powerlifting.ts` continua puro.
- Landing ganha alias `@onyx/strength` (mesmo padrão do `@onyx/calc`).
- App: `getStrengthComparison` (faixas estáticas de DOTS) é **substituído** por `compareTotal`; `ComparisonEstimated.tsx` e a tela de análises passam a mostrar a escada real. Sem UI nova no app.
- **Refresh:** manual, trimestral, um comando + commit; `generatedAt` visível na metodologia. Sem cron, sem Action.

## 8. Ponte pro cadastro (app)

1. CTA "Salvar e acompanhar a evolução" abre `https://app.onyxtreino.com.br/registro#forca=<payload>`; payload = base64url de `{ "v": 1, "sex": "M"|"F", "bw": 82, "lifts": [{ "lift": "bench", "kg": 110, "reps": 5 }] }`. Fragmento: não vai pro servidor nem pro log do nginx.
2. O app lê `location.hash` na primeira renderização da rota de registro, guarda em `sessionStorage` (sobrevive ao redirect do Google Sign-In) e limpa a URL.
3. Após a conta criada, semeia: `settings.gender`, `settings.bodyweight`, uma entrada no `bodyweightLog` de hoje e **um treino de referência datado de hoje** com uma série por lift informado (ex.: supino 110 × 5), com nota "Registrado pela calculadora". Resultado: e1RM, recordes, DOTS e a escada aparecem no dashboard no primeiro acesso. Não cria conceito novo no app.
4. Payload ausente ou inválido → cadastro normal. Nunca bloqueia. `v` desconhecido → ignora.
5. Encode/decode do payload vive em `packages/shared` (usado pela landing e pelo app).

## 9. Passe visual (subtração)

| Onde | Sai | Entra |
|---|---|---|
| `sections/Hero.astro` | DotGrid (gsap), `background-image` de pontos, `hero__fade` | fundo chapado `--bg-primary` |
| `sections/VocabStrip.astro` | seção inteira (LogoLoop) | removida |
| `sections/CalculatorCards.astro` | SpotlightCard | card estático, hairline; hover = borda `--border-focus` |
| `sections/Differentials.astro` | sombra `0 16px 32px` no hover | nada |
| `sections/AppShowcase.astro` | TiltedCard | frames estáticos; sombra dos celulares ≤ `0 8px 24px rgba(0,0,0,.35)` |
| `sections/Comparison.astro` | ElectricBorder, FadeContent, `box-shadow: 0 0 34px`, gradientes de cabeçalho/rodapé da coluna | coluna ONYX: borda `--accent-border` 1px + fundo `--accent-soft` chapado |
| `sections/FinalCta.astro` | gradiente de fundo | chapado |
| `styles/tokens.css` | `--accent-gradient` (usos em `ArticleLayout`, `CalcLayout`, `phones.css`, `calc.css`) | `--accent-soft` chapado |
| `islands/calc.css`, `components/Nav.astro` | sombras `0 24px 64px` | hairline |
| `components/reactbits/` | pasta inteira (todos ficam órfãos) | — (CountUp: reimplementar como hook de 20 linhas na ilha, sem gsap) |
| `package.json` da landing | `gsap`, `motion`, `ogl` se não sobrar uso | — |

- **Disciplina de brass:** por viewport, no máximo um CTA + um destaque de dado. Kicker em `--text-secondary`.
- **Tipografia:** display **Archivo** (variável, `wght 800`, `wdth 85`; Google Fonts, self-host em woff2 como o resto) para H1/H2/números; corpo continua Plus Jakarta Sans. Outfit sai da landing (o `logo.svg` já é vetor, não depende da fonte). A escolha pode ser revisitada com as referências visuais do designer amigo — se mudar, muda só o token `--font-display`.
- **Componentes prontos:** nenhum para decoração. Comportamento (segmentados, foco, teclado) pode vir de Radix/Base UI headless, estilizado com os tokens.
- Regras da spec anterior que continuam: HTML do hero chega estático (LCP não espera JS), ilhas `client:load` só para a calculadora, tabela comparativa colapsa em ≤ 480 px.

## 10. Issues, ordem e verificação

| # | Issue | Escopo | Depende de |
|---|---|---|---|
| A | **#293 re-escopada**: percentis OpenPL Brasil — pipeline + `strength.ts` | §7 inteira + troca no app | — |
| D | Passe visual da landing | §9 inteira | — (paralela à A) |
| B | Calculadora "Quão forte você é" + `/quao-forte-voce-e` | §6 inteira | A, D |
| C | Home: copy e estrutura | §4 + §5, hero embute a ilha compacta | B |
| E | Cadastro pré-preenchido (app) | §8 | B (payload) — paralela à C |

Ordem: **A ∥ D → B → C ∥ E**. A #293 sai do gate com um comentário registrando as decisões desta spec e vira `status:aprovada`. O card de imagem pra story vai como comentário de escopo na #292.

**Verificação por issue**
- **A:** vitest com fixture CSV sintética (~200 linhas cobrindo `Best3` negativo, `Nome #2`, meet fora do Brasil, equipado, meet só de supino, classe com n < 50) → JSON esperado; `compareLift/compareTotal` nos limites de classe, classe fundida, acima de P100, abaixo de P0, reps > 1 via `calculateE1RM`. `powerlifting.test.ts` segue verde.
- **D:** checklist no PR + screenshots antes/depois por seção + Lighthouse (mobile) antes/depois. Build sem `gsap`/`motion` no bundle da landing.
- **B:** vitest para payload, formatação e e1RM com reps; **primeiro smoke Playwright da landing**: preencher → resultado → link gerado; `curl` da rota nova (200, title, sitemap).
- **C:** verificação manual como na #313 (curl das rotas, copy no lugar, mobile) + o smoke da B passando no hero.
- **E:** caso e2e no Playwright do app: abrir `/registro#forca=…` → criar conta → dashboard mostra treino de referência e peso corporal; payload inválido → cadastro normal.

## 11. Decisões fixadas (não reabrir sem nova sessão)

Base de comparação = OpenPowerlifting, meets no Brasil, raw, 10 anos, todas as federações/idades · escada A · card v4 · hero opção A · Archivo · reps como segmentado fixo · resultado por botão, não ao vivo · share v1 = link · handoff por fragmento + treino de referência · sem cron de refresh.

## 12. Pendências (resolver na execução, não bloqueiam a spec)

1. Calibrar os cortes P50/P85 da escada com os números reais (issue A).
2. Referências visuais do designer amigo podem ajustar `--font-display` e detalhes do passe visual (issue D) — não reabrem a estrutura.
3. Verificar no dump se `MeetState` está preenchido para o Brasil (só informa a viabilidade futura de recorte regional; fora de escopo aqui).
