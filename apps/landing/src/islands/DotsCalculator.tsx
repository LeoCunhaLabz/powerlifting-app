import { useState } from 'react';
import { calculateDots, calculateWilks, calculateIpfGl } from '@onyx/calc';
import { formatNumber, parseDecimal } from '../lib/format';
import { NumberField, Segmented, Stat, Result } from './ui';
import { useFirstUse } from './useFirstUse';
import AnimatedNumber from './AnimatedNumber';

type Sex = 'm' | 'f';

// Defaults do mockup (amostra coerente). A calculadora calcula de verdade a partir deles —
// o HTML do servidor já chega com DOTS/Wilks/IPF GL resolvidos (LCP não espera JS).
const DEFAULT_BODYWEIGHT = '82,5';
const DEFAULT_TOTAL = '512,5';

/** Calculadora DOTS do hero (seção 2 da spec): entrada mínima, resultado gigante. */
export default function DotsCalculator() {
  const [sex, setSex] = useState<Sex>('m');
  const [bodyweight, setBodyweight] = useState(DEFAULT_BODYWEIGHT);
  const [total, setTotal] = useState(DEFAULT_TOTAL);
  const markUsed = useFirstUse('hero-dots');

  const bw = parseDecimal(bodyweight);
  const tt = parseDecimal(total);
  const isMale = sex === 'm';
  const valid = bw > 0 && tt > 0;

  const dots = valid ? calculateDots(bw, tt, isMale) : 0;
  const wilks = valid ? calculateWilks(bw, tt, isMale) : 0;
  const ipfGl = valid ? calculateIpfGl(bw, tt, isMale, false) : 0;

  return (
    <div className="calc">
      <div className="calc__head">
        <span className="calc__title">Calculadora DOTS</span>
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
      </div>
      <div className="calc__body">
        <div className="calc__grid">
          <NumberField
            label="Peso corporal (kg)"
            value={bodyweight}
            onChange={(v) => {
              markUsed();
              setBodyweight(v);
            }}
            placeholder="82,5"
          />
          <NumberField
            label="Total SBD (kg)"
            value={total}
            onChange={(v) => {
              markUsed();
              setTotal(v);
            }}
            placeholder="512,5"
            accent
          />
        </div>
        <Result label="DOTS Score" unit="pts" hint={valid ? undefined : 'Informe peso corporal e total maiores que zero.'}>
          {valid ? <AnimatedNumber value={dots} decimals={2} /> : '—'}
        </Result>
        <div className="calc__grid">
          <Stat label="Wilks (Classic)" value={valid ? formatNumber(wilks, 2) : '—'} />
          <Stat label="IPF GL Points" value={valid ? formatNumber(ipfGl, 2) : '—'} sub="raw" />
        </div>
      </div>
    </div>
  );
}
