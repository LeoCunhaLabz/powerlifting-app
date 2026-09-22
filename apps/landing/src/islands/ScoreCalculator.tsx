import { useState } from 'react';
import { calculateDots, calculateWilks, calculateIpfGl } from '@onyx/calc';
import { compareTotal } from '@onyx/strength';
import { formatKg, formatNumber, parseDecimal } from '../lib/format';
import { NumberField, Segmented, Stat, Result } from './ui';
import { useFirstUse } from './useFirstUse';
import AnimatedNumber from './AnimatedNumber';

type Sex = 'm' | 'f';
type Gear = 'raw' | 'eq';

/** Calculadora completa DOTS · Wilks · IPF GL (rota /calculadoras/dots). */
export default function ScoreCalculator() {
  const [sex, setSex] = useState<Sex>('m');
  const [gear, setGear] = useState<Gear>('raw');
  const [bodyweight, setBodyweight] = useState('82,5');
  const [squat, setSquat] = useState('180');
  const [bench, setBench] = useState('122,5');
  const [deadlift, setDeadlift] = useState('210');
  const markUsed = useFirstUse('dots');

  const set = (setter: (v: string) => void) => (v: string) => {
    markUsed();
    setter(v);
  };

  const bw = parseDecimal(bodyweight);
  const s = parseDecimal(squat) || 0;
  const b = parseDecimal(bench) || 0;
  const d = parseDecimal(deadlift) || 0;
  const total = s + b + d;
  const isMale = sex === 'm';
  const valid = bw > 0 && total > 0;

  const dots = valid ? calculateDots(bw, total, isMale) : 0;
  const wilks = valid ? calculateWilks(bw, total, isMale) : 0;
  const ipfGl = valid ? calculateIpfGl(bw, total, isMale, gear === 'eq') : 0;
  const level = valid ? compareTotal(isMale, bw, total) : null;

  const progress =
    level && level.nextKg !== undefined
      ? Math.min(100, Math.max(0, ((total - level.levelMinKg) / Math.max(1, level.nextKg - level.levelMinKg)) * 100))
      : 100;

  return (
    <div className="calc">
      <div className="calc__head">
        <span className="calc__title">DOTS · Wilks · IPF GL</span>
        <div className="calc__row" style={{ gap: 8 }}>
          <Segmented<Sex>
            ariaLabel="Sexo"
            value={sex}
            onChange={(v) => {
              markUsed();
              setSex(v);
            }}
            options={[
              { value: 'm', label: 'Masc.' },
              { value: 'f', label: 'Fem.' },
            ]}
          />
          <Segmented<Gear>
            ariaLabel="Modalidade"
            value={gear}
            onChange={(v) => {
              markUsed();
              setGear(v);
            }}
            options={[
              { value: 'raw', label: 'Raw' },
              { value: 'eq', label: 'Equipado' },
            ]}
          />
        </div>
      </div>
      <div className="calc__body">
        <NumberField label="Peso corporal (kg)" value={bodyweight} onChange={set(setBodyweight)} placeholder="82,5" />
        <div className="calc__grid calc__grid--3">
          <NumberField label="Agachamento" value={squat} onChange={set(setSquat)} placeholder="180" suffix="kg" />
          <NumberField label="Supino" value={bench} onChange={set(setBench)} placeholder="122,5" suffix="kg" />
          <NumberField label="Terra" value={deadlift} onChange={set(setDeadlift)} placeholder="210" suffix="kg" />
        </div>
        <Result
          label="DOTS Score"
          unit="pts"
          hint={valid ? `Total SBD: ${formatKg(total)} kg` : 'Informe peso corporal e ao menos um levantamento.'}
        >
          {valid ? <AnimatedNumber value={dots} decimals={2} /> : '—'}
        </Result>
        <div className="calc__grid">
          <Stat label="Wilks (Classic)" value={valid ? formatNumber(wilks, 2) : '—'} />
          <Stat
            label="IPF GL Points"
            value={valid ? formatNumber(ipfGl, 2) : '—'}
            sub={gear === 'eq' ? 'equipado' : 'raw'}
          />
        </div>
        {level && (
          <div className="level" aria-live="polite">
            <div className="calc__row">
              <span className="field__label">Entre quem competiu no Brasil · {level.classLabel}</span>
              <span className="num" style={{ fontSize: 15 }}>
                {level.level}
              </span>
            </div>
            <div className="level__bar" aria-hidden="true">
              <div className="level__fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="calc__note">
              {`Acima de ${level.percentile}% dos ${level.n} atletas raw da categoria. `}
              {level.nextLevel && level.nextKg !== undefined
                ? `${level.nextLevel} a partir de ${formatKg(level.nextKg)} kg de total. `
                : 'Faixa mais alta da escada. '}
              {level.merged ? 'Categorias vizinhas agrupadas por poucos dados. ' : ''}
              Dados: OpenPowerlifting, competições no Brasil, últimos 10 anos.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
