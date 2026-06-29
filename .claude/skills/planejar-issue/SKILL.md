---
name: planejar-issue
description: >-
  Desempacota uma issue APROVADA do GitHub num plano técnico claro (arquivos, funções,
  tarefas verificáveis) e confirma o escopo com o usuário antes de implementar. Use sempre
  que o usuário disser "planejar issue #N", "qual é o plano", "o que fazer na issue", "como
  resolvo a #N" ou pedir um plano de implementação para uma issue antes de escrever código.
  É a etapa anterior à execução; não escreve código, só planeja.
---

# Planejar a issue

Seu objetivo é **desempacotar uma issue aprovada** num **plano técnico claro e viável** que você (ou a skill `executar-issue`) possa seguir sem ambiguidade. Você **não escreve código aqui** — só lê, raciocina e propõe o plano.

Alvo: o argumento passado na invocação (`$ARGUMENTS`) — o número da issue. Se vier vazio, pergunte qual issue planejar (ou ofereça pegar a mais prioritária aprovada com `gh issue list --state open --label status:aprovada --search "sort:created-asc"`).

## Fonte da verdade

Leia [AGENTS.md](../../../AGENTS.md), [copilot-instructions.md](../../../.github/copilot-instructions.md) e a issue no GitHub. Convenções que o plano precisa respeitar:

- Stack: React 19 + TS strict + Vite, CSS puro, **pt-BR** na UI.
- **Escopo mínimo:** só o que a issue pede. Sem refactors, features ou dependências extras sem justificativa forte.
- **Estado** só via `useWorkout()` (nunca `localStorage` direto); tipos via `@powerlifting/shared`; cálculos puros em `apps/web/src/utils/powerlifting.ts`; CSS puro com as variables de `apps/web/src/index.css`.
- Pré-condição: a issue idealmente está em **`status:aprovada`**. Se estiver em `status:triagem`/`status:bloqueada`, avise — aprovar é decisão do usuário.

## Passos

1. **Ler a issue** — `gh issue view <N>` (título, descrição, critérios de aceite, labels). Entenda o problema antes de propor solução.
2. **Desempacotar o escopo:**
   - Que **mudança de código** precisa acontecer? (quais arquivos, funções, UI)
   - Qual o **mínimo necessário** sem overengineering?
   - Há **dependências** com outras issues (`Depende de: #M`)? Em que ordem?
3. **Listar tarefas técnicas** claras e verificáveis (criar/editar arquivo X, função Y com assinatura Z, atualizar componente W, validar build + lint).
4. **Confirmar com o usuário:** leia o plano de volta e pergunte *"É isso? Alguma mudança no escopo antes de implementar?"*. **Só após o "ok"** sugira seguir para `executar-issue`.

## Saída esperada (template)

```markdown
# Plano técnico — issue #N: <Título>

**Critérios de aceite:** <resumo dos critérios da issue>

## Escopo (a confirmar)
- Mudar X em apps/web/src/...
- Adicionar cálculo Y em powerlifting.ts
- Atualizar estado em WorkoutContext (campo Z)

## Tarefas
1. Preparação
   - [ ] Branch `<type>/<N>-<resumo>` a partir de `main`
   - [ ] (Dependência: espera issue #M em main, se houver)
2. Implementação
   - [ ] Arquivo A: <o que muda>
   - [ ] Arquivo B: <o que muda>
3. Validação
   - [ ] `npm run build` passa (type-check incluso)
   - [ ] `npm run lint` sem novos erros
   - [ ] Textos de UI em pt-BR
4. Finalização
   - [ ] PR com template, `Closes #N`
   - [ ] Docs em sincronia (se estrutura/comandos/caminhos mudarem)

## Notas / Trade-offs
- <decisões e trade-offs relevantes>

---
**Posso prosseguir para a execução?**
```
