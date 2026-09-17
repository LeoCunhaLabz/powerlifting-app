import { useId, useState } from 'react';
import { calculateE1RM, calculateE1RMBrzycki, calculateE1RMEpley, RPE_PERCENTAGES } from '@onyx/calc';
import { formatKg, formatNumber, parseDecimal } from '../lib/format';
import { RPE_TABLE_COLUMNS } from '../lib/rpe';
import { NumberField, Stat, Result } from './ui';
import { useFirstUse } from './useFirstUse';
import AnimatedNumber from './AnimatedNumber';

const RPE_OPTIONS = RPE_TABLE_COLUMNS;
const REPS_ROWS = Object.keys(RPE_PERCENTAGES)
  .map(Number)
  .sort((a, b) => a - b);

/** Calculadora de 1RM por RPE (rota /calculadoras/1rm) com a tabela RTS interativa. */
export default function OneRmCalculator() {
  const [weight, setWeight] = useState('150');
  const [reps, setReps] = useState('5');
  const [rpe, setRpe] = useState<string>('8');
  const markUsed = useFirstUse('1rm');
  const rpeId = useId();

  const w = parseDecimal(weight);
  const r = Math.floor(parseDecimal(reps));
  const rpeVal = rpe === '' ? undefined : Number(rpe);
  const valid = w > 0 && r > 0;

  const e1rmRts = valid && rpeVal !== undefined ? calculateE1RM(w, r, rpeVal) : 0;
  const brzycki = valid ? calculateE1RMBrzycki(w, r) : 0;
  const epley = valid ? calculateE1RMEpley(w, r) : 0;
  const inTable = valid && rpeVal !== undefined && r <= 12;
  const pct = inTable ? RPE_PERCENTAGES[r]?.[rpeVal] : undefined;

  const main = rpeVal !== undefined ? e1rmRts : brzycki;

  return (
    <div className="calc">
      <div className="calc__head">
        <span className="calc__title">1RM por RPE</span>
        <span className="calc__note">Tabela RTS · Brzycki · Epley</span>
      </div>
      <div className="calc__body">
        <div className="calc__grid calc__grid--3">
          <NumberField
            label="Carga"
            value={weight}
            onChange={(v) => {
              markUsed();
              setWeight(v);
            }}
            suffix="kg"
            placeholder="150"
            accent
          />
          <NumberField
            label="Repetições"
            value={reps}
            onChange={(v) => {
              markUsed();
              setReps(v.replace(/[^\d]/g, ''));
            }}
            inputMode="numeric"
            placeholder="5"
          />
          <div className="field">
            <label className="field__label" htmlFor={rpeId}>
              RPE
            </label>
            <div className="field__control">
              <select
                id={rpeId}
                className="field__select"
                value={rpe}
                onChange={(e) => {
                  markUsed();
                  setRpe(e.target.value);
                }}
              >
                {RPE_OPTIONS.map((v) => (
                  <option key={v} value={String(v)}>
                    {formatKg(v)}
                  </option>
                ))}
                <option value="">sem RPE</option>
              </select>
            </div>
          </div>
        </div>

        <Result
          label={rpeVal !== undefined ? 'e1RM · tabela RTS' : 'e1RM · Brzycki'}
          unit="kg"
          hint={
            !valid
              ? 'Informe carga e repetições maiores que zero.'
              : rpeVal !== undefined && !inTable
                ? 'Acima de 12 repetições a tabela RTS não se aplica; usamos Brzycki.'
                : pct !== undefined
                  ? `${formatKg(w)} kg × ${r} @ RPE ${formatKg(rpeVal!)} = ${formatNumber(pct * 100, 0)}% do 1RM`
                  : undefined
          }
        >
          {valid ? <AnimatedNumber value={main} decimals={1} /> : '—'}
        </Result>

        <div className="calc__grid">
          <Stat label="Brzycki" value={valid ? `${formatKg(brzycki)} kg` : '—'} sub="sem RPE" />
          <Stat label="Epley" value={valid ? `${formatKg(epley)} kg` : '—'} sub="sem RPE" />
        </div>

        <div className="rpe-table__wrap">
          <table className="rpe-table">
            <caption className="sr-only">Percentual do 1RM por repetições e RPE (tabela RTS)</caption>
            <thead>
              <tr>
                <th scope="col">Reps</th>
                {RPE_OPTIONS.map((v) => (
                  <th key={v} scope="col">
                    RPE {formatKg(v)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {REPS_ROWS.map((row) => (
                <tr key={row}>
                  <th scope="row">{row}</th>
                  {RPE_OPTIONS.map((col) => {
                    const isRow = inTable && row === r;
                    const isCol = inTable && col === rpeVal;
                    const cls = isRow && isCol ? 'is-hit' : isRow ? 'is-row' : isCol ? 'is-col' : '';
                    return (
                      <td key={col} className={cls}>
                        {formatNumber(RPE_PERCENTAGES[row][col] * 100, 0)}%
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="calc__note">
          e1RM = carga ÷ percentual da tabela (Mike Tuchscherer, RTS). Brzycki e Epley servem de contraprova
          quando não há RPE registrado. Arredondamento para 0,1 kg, igual ao app.
        </p>
      </div>
    </div>
  );
}
