---
description: "Fecha o ciclo de um PR aberto: lê os review comments do GitHub Copilot, resolve os óbvios (pergunta nos duvidosos), valida build/lint, faz rebase em main, resolve conflitos e — após seu ok — faz squash merge e apaga o branch. Use para 'finalizar PR', 'resolver os comments e mergear', 'fechar a issue #N'."
name: "Finalizar o PR (review + merge)"
argument-hint: "Número do PR ou da issue (vazio = PR do branch atual)"
agent: agent
---

# Finalizar o PR (review + merge)

Fecha a **última etapa** do ciclo de uma issue: trata os review comments, sincroniza com `main` e mergeia. É a automação do que você repetia à mão **depois** que o `/executar-issue` sobe o PR.

Alvo: `${input:pr:Número do PR ou da issue (deixe vazio para usar o PR do branch atual)}`.

Fonte da verdade das convenções: [AGENTS.md](../../AGENTS.md) e [.github/copilot-instructions.md](../copilot-instructions.md). Fluxo completo: [README.md](README.md).

## Regras de execução (inegociáveis)

- **Pausa obrigatória antes do merge.** Resolve comments, valida, rebaseia e resolve conflitos; então **apresenta um resumo e espera meu "ok"** para o squash merge. **Nunca** mergeie sem aprovação explícita.
- **Comments do Copilot — resolver os óbvios, perguntar nos duvidosos:**
  - **Óbvio** (aplicar direto): bug claro, typo, edge case não tratado, violação evidente das convenções do projeto, sugestão de baixo risco e dentro do escopo da issue.
  - **Duvidoso** (parar e perguntar): muda escopo/comportamento, é questão de preferência/estilo discutível, exige decisão de design, ou conflita com `AGENTS.md`/escopo mínimo. **Não** aplique sozinho — liste e pergunte.
  - Comments que você **discordar** com fundamento (ex.: falso positivo, fere o escopo mínimo): não aplique; explique o porquê no resumo e, se útil, responda na thread.
- **Escopo mínimo.** Só mexa no que o comment pede. Sem refactors/features oportunistas.
- **pt-BR** na UI; **TypeScript strict** (sem imports/variáveis não usados). Estado só via `useWorkout()`; tipos via `@powerlifting/shared`; cálculos puros em `apps/web/src/utils/powerlifting.ts`; CSS puro com as variables de [apps/web/src/index.css](../../apps/web/src/index.css).

## Passos

1. **Identificar o PR.**
   - Se recebi um número, descubra se é PR ou issue: `gh pr view <N>` ou `gh issue view <N>`. Se for issue, ache o PR com `Closes #N` (`gh pr list --search "<N> in:body" --state open`).
   - Se veio vazio, use o PR do branch atual: `gh pr view --json number,headRefName,title,url`.
   - Confirme o branch, o número do PR e a issue vinculada antes de prosseguir.

2. **Buscar os review comments do Copilot.**
   - Reviews e threads inline:
     ```bash
     gh pr view <N> --json reviews,comments,reviewThreads
     gh api repos/{owner}/{repo}/pulls/<N>/comments
     ```
   - Filtre os autorados pelo **GitHub Copilot** (bot de review). Se o `gh` não estiver disponível/autenticado, **pare e peça** os comments (ou um print) e diga que segui só com o que recebi.
   - Se ainda não houver comments do Copilot, **avise e pergunte** se quer esperar o review ou seguir só com build/lint + merge.

3. **Triar cada comment** em **óbvio** vs **duvidoso** (critérios acima). Monte uma lista curta:
   - `✅ aplicar` — o que vou corrigir e onde.
   - `❓ perguntar` — o que precisa da sua decisão (com a sua recomendação).
   - `🚫 não aplicar` — falso positivo / fora de escopo, com justificativa.

4. **Aplicar os óbvios** em commits coerentes. **Parar e perguntar** nos duvidosos antes de mexer neles.

5. **Validar:** `npm run build` (type-check incluso) e `npm run lint` — **sem novos erros**. Não há testes.

6. **Empurrar as correções** para o branch do PR. Se útil, **responder/resolver** as threads tratadas (`gh api` ou a extensão de PR), para o PR ficar limpo.

7. **Sincronizar com `main`:** `git fetch origin` e **rebase** em `origin/main`.
   - **Resolva conflitos** preservando a intenção das duas pontas (não descarte trabalho alheio). Rode `npm run build` + `npm run lint` de novo após resolver.
   - Empurre com `git push --force-with-lease` (nunca `--force` puro).

8. **PAUSA — resumo para aprovação.** Apresente:
   - Comments aplicados / pendentes / recusados.
   - Resultado de `build` e `lint`.
   - Estado do rebase (limpo ou conflitos resolvidos).
   - O comando de merge que vou rodar.
   - Pergunte: **"Posso fazer o squash merge?"**

9. **Após meu "ok": squash merge + limpeza.**
   ```bash
   gh pr merge <N> --squash --delete-branch \
     --subject "<type>(escopo): <resumo> (#N)" \
     --body "Closes #<issue>"
   ```
   - Garanta `status:em-andamento` → issue fechada pelo `Closes #N` (ajuste labels se necessário: `gh issue edit <issue> --remove-label status:em-andamento`).
   - Volte para `main` e `git pull` para deixar o repo limpo para a próxima issue.

## Saída esperada

Ao terminar (ou na pausa), reporte de forma enxuta:
- PR e issue tratados, comments aplicados/pendentes/recusados.
- `build`/`lint` ok, rebase limpo, conflitos resolvidos (se houve).
- Confirmação do merge (ou o ponto exato em que estou aguardando sua decisão).
