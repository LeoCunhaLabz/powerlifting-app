import { useState } from 'react';
import { calculatePlates, DEFAULT_PLATES_KG } from '@onyx/calc';
import { BAR_WEIGHTS_KG, getPlateStyle } from '../data/plates';
import { formatKg, parseDecimal } from '../lib/format';
import { NumberField, Segmented, Stat, Result } from './ui';
import { useFirstUse } from './useFirstUse';
import PlateBar from './PlateBar';

type Bar = '20' | '15';
const STEP = 2.5;

/** Calculadora de anilhas (rota /calculadoras/anilhas): barra montada por lado. */
export default function PlateCalculator() {
  const [target, setTarget] = useState('142,5');
  const [bar, setBar] = useState<Bar>('20');
  const [available, setAvailable] = useState<number[]>([...DEFAULT_PLATES_KG]);
  const markUsed = useFirstUse('anilhas');

  const barWeight = Number(bar);
  const t = parseDecimal(target);
  const valid = t > 0;
  const result = valid ? calculatePlates(t, barWeight, available) : { plates: [], actualWeight: barWeight, remainingWeight: 0 };
  const perSide = result.plates.reduce((acc, p) => acc + p.plateWeight * p.count, 0);

  const adjust = (delta: number) => {
    markUsed();
    const base = valid ? t : barWeight;
    setTarget(formatKg(Math.max(barWeight, base + delta)));
  };

  const togglePlate = (w: number) => {
    markUsed();
    setAvailable((prev) => (prev.includes(w) ? prev.filter((p) => p !== w) : [...prev, w].sort((a, b) => b - a)));
  };

  return (
    <div className="calc">
      <div className="calc__head">
        <span className="calc__title">Anilhas</span>
        <Segmented<Bar>
          ariaLabel="Peso da barra"
          value={bar}
          onChange={(v) => {
            markUsed();
            setBar(v);
          }}
          options={BAR_WEIGHTS_KG.map((w) => ({ value: String(w) as Bar, label: `Barra ${w} kg` }))}
        />
      </div>
      <div className="calc__body">
        <div className="calc__row">
          <div style={{ flex: 1, minWidth: 160 }}>
            <NumberField
              label="Carga alvo"
              value={target}
              onChange={(v) => {
                markUsed();
                setTarget(v);
              }}
              suffix="kg"
              placeholder="142,5"
              accent
            />
          </div>
          <div className="stepper" aria-label="Ajustar carga">
            <button type="button" className="stepper__btn" onClick={() => adjust(-STEP * 2)}>
              −5
            </button>
            <button type="button" className="stepper__btn" onClick={() => adjust(-STEP)}>
              −2,5
            </button>
            <button type="button" className="stepper__btn" onClick={() => adjust(STEP)}>
              +2,5
            </button>
            <button type="button" className="stepper__btn" onClick={() => adjust(STEP * 2)}>
              +5
            </button>
          </div>
        </div>

        <PlateBar plates={result.plates} />

        <Result
          label="Por lado"
          hint={
            !valid
              ? 'Informe a carga alvo.'
              : result.remainingWeight > 0
                ? `Faltam ${formatKg(result.remainingWeight)} kg para o alvo com as anilhas disponíveis — barra fica com ${formatKg(result.actualWeight)} kg.`
                : t <= barWeight
                  ? 'Carga alvo menor ou igual à barra: só a barra.'
                  : `Barra ${formatKg(barWeight)} kg + ${formatKg(perSide)} kg de cada lado = ${formatKg(result.actualWeight)} kg.`
          }
        >
          {result.plates.length
            ? result.plates.map((p) => `${p.count}×${formatKg(p.plateWeight)}`).join(' · ')
            : '—'}
        </Result>

        <div className="calc__grid">
          <Stat label="Na barra" value={`${formatKg(result.actualWeight)} kg`} accent={result.remainingWeight === 0 && valid} />
          <Stat label="Anilhas por lado" value={String(result.plates.reduce((acc, p) => acc + p.count, 0))} />
        </div>

        <div className="field">
          <span className="field__label">Anilhas disponíveis (kg)</span>
          <div className="chips">
            {DEFAULT_PLATES_KG.map((w) => (
              <button
                key={w}
                type="button"
                className="chip"
                aria-pressed={available.includes(w)}
                onClick={() => togglePlate(w)}
              >
                <span className="chip__dot" style={{ background: getPlateStyle(w).color }} aria-hidden="true" />
                {formatKg(w)}
              </button>
            ))}
          </div>
        </div>
        <p className="calc__note">
          Algoritmo guloso: da anilha mais pesada para a mais leve, por lado. Cores no padrão IPF (25 vermelha,
          20 azul, 15 amarela, 10 verde, 5 branca, 2,5 preta). Mesmo cálculo que roda dentro do treino no app.
        </p>
      </div>
    </div>
  );
}
