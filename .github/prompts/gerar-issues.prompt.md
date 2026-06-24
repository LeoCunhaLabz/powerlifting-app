---
description: "Analisa o app por todas as frentes (segurança, infra, frontend, UI/UX, backend, features, dashboards, escala/perf, DX/dívida técnica), checa as issues já abertas para evitar duplicação e propõe um backlog priorizado por ROI — sem overengineering. Use para 'gerar issues', 'o que fazer a seguir', 'próximas evoluções', 'backlog priorizado', 'ideias de melhoria'."
name: "Gerar issues"
argument-hint: "Opcional: frente/tema (ex.: 'segurança', 'UX do Workout', 'performance', 'dashboards')"
agent: Plan
---

# Gerar novas issues para evoluir o app

Você está em **modo de planejamento**: **não edite código**. O objetivo é me ajudar a decidir **quais são as próximas evoluções de maior retorno** para o app de powerlifting e **redigir issues enxutas** prontas para o GitHub — equilibrando todas as frentes (segurança, infra, frontend, UI/UX, backend, funcionalidades, visualizações/dashboards, escala/performance, DX/dívida técnica), **sem overengineering**.

Contexto: leia [AGENTS.md](../../AGENTS.md) e [.github/copilot-instructions.md](../copilot-instructions.md). Respeite a stack e os limites do projeto (React 19 + TS strict + Vite, web client-side com `localStorage`, CSS puro "Chalk & Onyx" em 480px, pt-BR, fase 2 introduzindo `apps/api` com Fastify + Postgres).

Foco opcional desta rodada: `${input:tema:Frente/tema (deixe vazio para uma varredura geral por todas as frentes)}`.

## Princípios (inegociáveis)

- **ROI primeiro.** Priorize o que entrega **mais valor pelo menor esforço/risco**. Há infinitas melhorias possíveis; o trabalho aqui é **escolher poucas e certas**, não listar tudo.
- **Sem overengineering.** Prefira a menor mudança que entrega valor. Nada de abstrações, libs, padrões ou arquitetura "para o futuro" sem necessidade clara **agora**. Veja a lista de armadilhas abaixo.
- **Valor real, não "seria legal".** Cada issue explica o problema/benefício concreto para o usuário ou para a saúde do projeto.
- **Escopo de 1 PR.** Se algo for grande, **quebre em issues menores** e indique ordem/dependências.
- **Coerente com a stack atual.** Sem dependências novas sem justificativa forte; sem backend/rede no `apps/web` até a issue de sync.
- **Não duplicar.** Toda proposta é checada contra as issues **abertas e fechadas** antes de ser sugerida (ver passo 1).

## Frentes a varrer

Use isto como checklist de cobertura. Numa varredura geral, passe por **todas**; com tema definido, foque na frente pedida (mas sinalize riscos críticos que cruzar no caminho, sobretudo de segurança).

1. **Segurança** — auth/JWT/refresh tokens, hashing de senha, exposição de dados sensíveis (`password_hash`), validação de entrada (Zod), CORS, rate limit, headers, secrets em env, OWASP Top 10.
2. **Infra / deploy** — Docker, docker-compose vs Dokploy, migrations no boot, healthchecks, variáveis de ambiente, CI/CD, observabilidade básica (logs/erros).
3. **Backend (`apps/api`)** — modelagem do schema, rotas, tratamento de erro consistente, paginação, contratos com o front, tipos compartilhados em `@powerlifting/shared`.
4. **Frontend (`apps/web`)** — arquitetura de estado (`WorkoutContext`), correção de cálculos (`powerlifting.ts`), edge cases de persistência, robustez de componentes.
5. **UI/UX** — atrito em fluxos (Workout, Templates), feedback visual, estados vazio/carregando/erro, mobile-first 480px, acessibilidade (contraste, foco, labels), consistência com "Chalk & Onyx".
6. **Funcionalidades de domínio** — recursos de powerlifting que faltam e agregam (ex.: progressão, histórico, PRs, planejamento de mesociclo) — só se couberem em escopo enxuto.
7. **Visualizações / dashboards** — gráficos de progresso, tendências de e1RM, volume, frequência; clareza > sofisticação.
8. **Escala / performance** — re-renders, tamanho do bundle, custo de cálculos, índices/queries no Postgres, tamanho do estado em `localStorage`.
9. **DX / dívida técnica / docs** — tipos frágeis, duplicação, ausência de testes em pontos críticos, docs (`AGENTS.md`) desatualizadas.

## Passo a passo

1. **Mapear o que já existe (evitar duplicação).**
   - Liste as issues **abertas** e as **fechadas recentes** do GitHub. Tente, em ordem:
     - as ferramentas de GitHub disponíveis (busca/fetch de issues), ou
     - o terminal: `gh issue list --state open --limit 100` e `gh issue list --state closed --limit 50` (se o `gh` estiver autenticado).
   - Se **não** conseguir acessar o GitHub, **pare e peça** a lista de issues abertas (ou um print), e deixe claro no resultado que a checagem de duplicidade foi feita só com o que recebeu.
   - Para cada proposta nova, confirme que **não** colide com issue aberta; se for relacionada a uma existente, referencie (`relacionada a #N`) em vez de duplicar.

2. **Investigar oportunidades** explorando a codebase pelas **frentes** acima (use os agentes/subagentes de exploração quando ajudar). Procure problemas concretos, não hipóteses genéricas.

3. **Propor um backlog priorizado por ROI.** Apresente uma tabela única, ordenada por prioridade:

   `# | Frente | Título | Valor | Esforço | Risco/Urgência | ROI | Depende de`

   - **Valor:** Alto / Médio / Baixo (impacto no usuário ou na saúde do projeto).
   - **Esforço:** P / M / G (cabe em 1 PR? G provavelmente precisa quebrar).
   - **Risco/Urgência:** Alto para correção de segurança/bug de dados; senão Médio/Baixo.
   - **ROI:** síntese (Valor alto + Esforço P/M ⇒ topo). **Segurança e bugs de correção sobem na fila** mesmo com valor "de usuário" baixo.
   - Logo abaixo da tabela, escreva **um parágrafo curto de recomendação**: as 3–5 issues que eu deveria fazer **primeiro** e por quê.
   - Mapeie cada linha para as **labels de sequenciamento** (prioridade/esforço/status) — ver seção abaixo.

4. **Perguntar antes de redigir** quais itens da tabela transformar em issues prontas.

5. **Redigir as issues** aprovadas no formato padrão abaixo, prontas para colar no GitHub. Issues novas nascem com `status:triagem` (ainda não aprovadas).

> Fluxo completo (gerar → planejar → executar → aprovar) documentado em [.github/prompts/README.md](README.md).

## Armadilhas de overengineering a evitar (exemplos deste projeto)

Não proponha (a menos que haja dor real e medível agora): trocar o estado por Redux/Zustand "por boas práticas"; introduzir Tailwind/CSS-in-JS/biblioteca de UI; criar camada de abstração/genéricos para um único uso; microserviços ou filas; cache/ORM/índices para volume de dados que não existe; GraphQL; testes E2E pesados antes de testes unitários dos cálculos; reescrever o que funciona. Se algo assim parecer necessário, **justifique a dor concreta** na issue ou descarte.

## Sistema de labels (define a ordem de execução)

As labels não são decorativas: elas respondem **"o que fazer a seguir e em que ordem"**. Toda issue deve sair com **4 eixos**:

1. **Tipo** (o que é): `bug` · `enhancement` · `documentation` · `tech-debt`.
2. **Área** (onde): `security` · `infra` · `backend` · `performance` · `ux` (frentes sem label própria — frontend/dashboards/dx — ficam no campo "Frente").
3. **Prioridade** (dirige a ordem): `p0` (segurança/perda de dados — faz primeiro) · `p1` (alta) · `p2` (média) · `p3` (baixa).
4. **Esforço** (acha quick wins): `esforco:p` · `esforco:m` · `esforco:g`.

E **1 eixo de status** (estado no fluxo / porta de aprovação):

- `status:triagem` — proposta nova, **ainda não aprovada** (toda issue gerada aqui começa assim).
- `status:aprovada` — escopo aprovado, pronta para `/planejar-proxima-issue` e `/executar-issue`.
- `status:bloqueada` — espera uma dependência (`Depende de: #N`).
- `status:em-andamento` — já tem branch/PR.

`fase-*` é reservado a **épicos de roadmap** (ex.: sincronização = `fase-3`), não a cada bug/UX pequeno. A regra de ordem prática: **p0 antes de p1 antes de p2/p3**, e dentro da mesma prioridade prefira `esforco:p` (quick wins). Issues `status:bloqueada` saem da fila até a dependência fechar.

## Formato de cada issue (saída)

```
### <tipo>: <título curto e claro>

**Contexto / Problema**
<o que está acontecendo hoje e por que importa — valor concreto>

**Proposta**
<a menor mudança que resolve>

**Escopo**
- [ ] <passo objetivo>
- [ ] <passo objetivo>

**Fora de escopo**
- <o que NÃO entra agora (corte explícito contra overengineering)>

**Critérios de aceite**
- <verificável>

**Arquivos prováveis:** <caminhos>
**Frente:** <segurança | infra | backend | frontend | ux | dashboards | perf | dx>
**Labels sugeridas:** <tipo> + <área> + <prioridade `p0`–`p3`> + <`esforco:p|m|g`> + `status:triagem`
**Branch sugerido:** <type>/<resumo> · **Esforço:** P/M/G · **Depende de:** <#N ou —>
```
