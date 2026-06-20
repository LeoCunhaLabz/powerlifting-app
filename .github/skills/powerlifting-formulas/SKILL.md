---
name: powerlifting-formulas
description: "Conhecimento de domínio das fórmulas de powerlifting deste app: e1RM (tabela RPE da RTS + Brzycki), Wilks, DOTS, IPF GL e cálculo de anilhas. Use ao implementar, revisar ou explicar cálculos de força em src/utils/powerlifting.ts."
---

# Fórmulas de Powerlifting

Referência de domínio para os cálculos em [src/utils/powerlifting.ts](../../../src/utils/powerlifting.ts). Todas as funções são **puras** e retornam `0` para entradas inválidas.

## e1RM — `calculateE1RM(weight, reps, rpe?)`

1RM estimado. Duas estratégias:

- **Com RPE (6,5–10):** usa a **tabela RPE da RTS** (Mike Tuchscherer) — `RPE_PERCENTAGES[reps][rpe]` dá a fração do 1RM. `e1RM = weight / percentual`. O RPE é arredondado para o 0,5 mais próximo; reps válidos de 1 a 12.
- **Sem RPE (fallback Brzycki):** `e1RM = weight / (1.0278 - 0.0278 * reps)`; para `reps === 1`, retorna o próprio `weight`.

Resultado arredondado para **0,1**.

## Wilks — `calculateWilks(bodyweight, total, isMale)`

Coeficiente Wilks clássico. `coeff = 500 / denominador`, onde o denominador é um polinômio de grau 5 do peso corporal com constantes específicas por gênero. `pontuação = total * coeff`, arredondada para **0,01**.

## DOTS — `calculateDots(bodyweight, total, isMale)`

`coeff = 500 / denominador`, com denominador polinomial de grau 4 do peso corporal (constantes por gênero). Arredonda para **0,01**.

## IPF GL Points — `calculateIpfGl(bodyweight, total, isMale, isEquipped?)`

`coeff = 100 / (a - b * e^(-c * bodyweight))`; constantes `a, b, c` variam por gênero **e** por modalidade (raw vs. equipado). `pontuação = total * coeff`, arredondada para **0,01**.

> `total` = soma de Agachamento + Supino + Terra (1RMs). `bodyweight` e `total` na mesma unidade.

## Anilhas — `calculatePlates(targetWeight, barWeight, availablePlates)`

Algoritmo **guloso** (maiores anilhas primeiro) que calcula a montagem **por lado** da barra:

- Carga por lado = `(targetWeight - barWeight) / 2`.
- Itera as anilhas em ordem decrescente, encaixando o máximo de cada.
- Retorna `{ plates: [{ plateWeight, count }], actualWeight, remainingWeight }`, onde `count` é por lado e `remainingWeight` é o resíduo não montável.

Padrões: `DEFAULT_PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25, 0.5, 0.25]`, `DEFAULT_PLATES_LBS = [55, 45, 35, 25, 10, 5, 2.5]`.

## Convenções ao alterar

- Mantenha funções puras; nada de estado/efeitos/rede.
- Preserve o arredondamento (e1RM → 0,1; pontuações → 0,01).
- Co-localize tabelas/constantes no próprio arquivo.
- Cite a fonte da fórmula em comentário curto.
