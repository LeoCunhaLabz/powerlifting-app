---
description: "Planeje a próxima issue aprovada: leia a issue, defina escopo/tarefas, confirme com o usuário antes de passar para `/executar-issue`. Use para 'planejar issue #N', 'qual é o plano', 'o que fazer agora'."
name: "Planejar a próxima issue"
argument-hint: "Número da issue a planejar"
agent: plan
---

# Planejar a próxima issue

Você está em **modo de planejamento**. O objetivo é **desempacotar uma issue aprovada** (do backlog ou GitHub) e definir um **plano técnico claro e viável** que você (ou um subagente de execução) possa seguir sem ambiguidade.

## Contexto

Leia [AGENTS.md](../../AGENTS.md), [.github/copilot-instructions.md](../copilot-instructions.md) e a issue no GitHub. Respeite:
- Stack: React 19 + TS strict + Vite, CSS puro, pt-BR.
- **Escopo mínimo**: só o que a issue pede.
- Sem novas dependências sem justificativa forte.
- Estado: `useWorkout()`, tipos de `@powerlifting/shared`, cálculos puros em `powerlifting.ts`.

## Passos

1. **Ler a issue** (título, descrição, critérios de aceite, labels).

2. **Desempacotar o escopo:**
   - Que **mudança de código** precisa acontecer? (quais arquivos, funções, UI).
   - Qual é o **mínimo necessário** sem overengineering?
   - Há **dependências** com outras issues? Qual a ordem?

3. **Listar tarefas técnicas** claras e verificáveis:
   - [ ] Criar/editar arquivo X
   - [ ] Adicionar função Y com signature Z
   - [ ] Atualizar componente Z para fazer W
   - [ ] Testar caso de uso C
   - [ ] Validar build + lint

4. **Confirmar com o usuário:**
   - "É isso que você quer?" (leia o plano de volta).
   - Pergunte: "Alguma mudança no escopo antes de implementar?"
   - **Só após OK**, libere para `/executar-issue`.

## Saída esperada (template)

```markdown
# Plano técnico para issue #N: <Título>

**Issue:** [Aqui o link ou resumo dos critérios de aceite]

## Escopo (confirmado)

- Mudar X em apps/web/src/...
- Adicionar cálculo Y em powerlifting.ts
- Atualizar estado em WorkoutContext (adicionar campo Z)
- ...

## Tarefas

1. **Preparação**
   - [ ] Branch `<type>/<N>-<resumo>` a partir de `main`
   - [ ] (Se houver dependência: "Espera issue #M estar em main")

2. **Implementação**
   - [ ] Arquivo A: (descrição concisa do que muda)
   - [ ] Arquivo B: (descrição concisa)
   - [ ] ...

3. **Validação**
   - [ ] `npm run build` passa (type-check incluso)
   - [ ] `npm run lint` sem novos erros
   - [ ] Textos de UI em pt-BR

4. **Finalização**
   - [ ] PR com template, `Closes #N`
   - [ ] Docs em sincronia (se estrutura/comandos mudarem)

## Notas / Trade-offs

- Se houver decisão importante ou trade-off, descreva aqui.

---

**Seu ok para prosseguir com `/executar-issue`?**
```
