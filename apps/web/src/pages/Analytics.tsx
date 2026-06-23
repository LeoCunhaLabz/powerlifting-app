import React, { useState } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { calculateE1RM, calculateDots, calculateWilks, getExerciseMuscles, MUSCLE_LABELS, type MuscleGroup } from '../utils/powerlifting';
import type { WorkoutSession } from '@powerlifting/shared';
import { Award } from 'lucide-react';

type Period = '4w' | '12w' | 'year' | 'all' | 'custom';

interface LiftDef {
  label: string;
  short: string;
  color: string;
  match: (name: string) => boolean;
}

const LIFTS: LiftDef[] = [
  { label: 'Agachamento', short: 'Agach.', color: 'var(--accent)', match: (n) => n.includes('agachamento') || n.includes('squat') },
  { label: 'Supino', short: 'Supino', color: '#7b8aa6', match: (n) => n.includes('supino') || n.includes('bench') },
  { label: 'Terra', short: 'Terra', color: '#fafafa', match: (n) => n.includes('terra') || n.includes('deadlift') },
];

const RPE_COLORS: Record<number, string> = { 6: '#37b87f', 7: '#9ed16b', 8: '#e0a93f', 9: '#ef9a4d', 10: '#e5544b' };

const tonnageOf = (s: WorkoutSession): number =>
  s.exercises.reduce(
    (a, ex) => a + ex.sets.reduce((b, set) => b + (set.completed ? set.weight * set.reps : 0), 0),
    0,
  );

const relativeDate = (iso: string): string => {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) return 'Hoje';
  if (d === 1) return 'Ontem';
  if (d < 7) return `${d} dias`;
  const w = Math.floor(d / 7);
  return w <= 1 ? '1 sem' : `${w} sem`;
};

const weekStart = (t: number): number => {
  const d = new Date(t);
  const day = (d.getDay() + 6) % 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d.getTime();
};

const linePoints = (vals: number[], w: number, h: number, pad = 8): string => {
  if (vals.length === 0) return '';
  if (vals.length === 1) return `0,${h / 2} ${w},${h / 2}`;
  const min = Math.min(...vals), max = Math.max(...vals), span = max - min || 1;
  return vals
    .map((v, i) => {
      const x = (i / (vals.length - 1)) * w;
      const y = h - pad - ((v - min) / span) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
};

// ---- Mapa muscular (silhueta estilizada anatômica) ----
const ARM_L = 'M35 72 C30 74 30 92 33 110 C39 115 45 112 45 104 C45 88 43 74 35 72 Z';
const ARM_R = 'M125 72 C130 74 130 92 127 110 C121 115 115 112 115 104 C115 88 117 74 125 72 Z';
const FOREARM_L = 'M33 113 C29 122 28 146 33 168 C39 170 43 164 42 148 C41 130 39 118 33 113 Z';
const FOREARM_R = 'M127 113 C131 122 132 146 127 168 C121 170 117 164 118 148 C119 130 121 118 127 113 Z';
const LEG_L = 'M59 154 C54 160 56 205 62 238 C66 250 75 250 77 236 C79 198 73 158 59 154 Z';
const LEG_R = 'M101 154 C106 160 104 205 98 238 C94 250 85 250 83 236 C81 198 87 158 101 154 Z';
const CALF_L = 'M62 246 C58 258 59 300 65 330 C71 332 74 320 73 298 C72 270 69 252 62 246 Z';
const CALF_R = 'M98 246 C102 258 101 300 95 330 C89 332 86 320 87 298 C88 270 91 252 98 246 Z';

const MuscleMap: React.FC<{ view: 'front' | 'back'; fill: (m: MuscleGroup) => string }> = ({ view, fill }) => (
  <svg width="150" height="322" viewBox="0 0 160 360" fill="none">
    <ellipse cx="80" cy="24" rx="14" ry="16" fill="#191919" />
    <path d="M72 38 H88 L90 49 H70 Z" fill="#191919" />
    <path d="M58 140 H102 V158 Q80 168 58 158 Z" fill="#191919" />
    {view === 'front' ? (
      <>
        <path d="M65 47 Q80 43 95 47 L91 58 Q80 53 69 58 Z" fill={fill('trapezio')} />
        <path d="M50 54 Q34 56 33 72 Q42 78 52 70 Q54 60 50 54 Z" fill={fill('ombros')} />
        <path d="M110 54 Q126 56 127 72 Q118 78 108 70 Q106 60 110 54 Z" fill={fill('ombros')} />
        <path d="M78 58 C68 56 57 59 55 68 C54 80 62 87 78 85 Z" fill={fill('peito')} />
        <path d="M82 58 C92 56 103 59 105 68 C106 80 98 87 82 85 Z" fill={fill('peito')} />
        <path d={ARM_L} fill={fill('biceps')} />
        <path d={ARM_R} fill={fill('biceps')} />
        <path d={FOREARM_L} fill={fill('antebraco')} />
        <path d={FOREARM_R} fill={fill('antebraco')} />
        <rect x="67" y="89" width="26" height="50" rx="7" fill={fill('abdomen')} />
        <path d={LEG_L} fill={fill('quadriceps')} />
        <path d={LEG_R} fill={fill('quadriceps')} />
        <path d={CALF_L} fill={fill('panturrilha')} />
        <path d={CALF_R} fill={fill('panturrilha')} />
      </>
    ) : (
      <>
        <path d="M66 46 L80 58 L94 46 L91 64 L80 98 L69 64 Z" fill={fill('trapezio')} />
        <path d="M50 56 Q35 58 34 72 Q43 77 52 70 Z" fill={fill('ombros')} />
        <path d="M110 56 Q125 58 126 72 Q117 77 108 70 Z" fill={fill('ombros')} />
        <path d="M68 70 L80 100 L75 126 C64 120 59 92 68 70 Z" fill={fill('costas')} />
        <path d="M92 70 L80 100 L85 126 C96 120 101 92 92 70 Z" fill={fill('costas')} />
        <path d={ARM_L} fill={fill('triceps')} />
        <path d={ARM_R} fill={fill('triceps')} />
        <path d={FOREARM_L} fill={fill('antebraco')} />
        <path d={FOREARM_R} fill={fill('antebraco')} />
        <rect x="69" y="120" width="22" height="22" rx="6" fill={fill('lombar')} />
        <ellipse cx="70" cy="152" rx="12" ry="13" fill={fill('gluteos')} />
        <ellipse cx="90" cy="152" rx="12" ry="13" fill={fill('gluteos')} />
        <path d={LEG_L} fill={fill('posterior')} />
        <path d={LEG_R} fill={fill('posterior')} />
        <path d={CALF_L} fill={fill('panturrilha')} />
        <path d={CALF_R} fill={fill('panturrilha')} />
      </>
    )}
  </svg>
);

export const Analytics: React.FC = () => {
  const { state, getBodyweightAt } = useWorkout();
  const { history, settings, bodyweightLog } = state;
  const [period, setPeriod] = useState<Period>('12w');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [muscleView, setMuscleView] = useState<'front' | 'back'>('front');
  const [muscleMetric, setMuscleMetric] = useState<'tonnage' | 'sets'>('tonnage');

  const u = settings.units;
  const isMale = settings.gender === 'male';

  // --- Janela de tempo ---
  let from = 0;
  let to = Date.now();
  if (period === '4w') from = Date.now() - 4 * 7 * 86400000;
  else if (period === '12w') from = Date.now() - 12 * 7 * 86400000;
  else if (period === 'year') from = Date.now() - 365 * 86400000;
  else if (period === 'custom') {
    from = customStart ? new Date(customStart).getTime() : 0;
    to = customEnd ? new Date(customEnd).getTime() + 86400000 : Date.now();
  }
  const inRange = (iso: string) => {
    const t = new Date(iso).getTime();
    return t >= from && t <= to;
  };

  const sessions = history.filter((s) => inRange(s.date));
  const chrono = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
  const n = chrono.length;

  // --- Resumo ---
  const totalVolume = sessions.reduce((a, s) => a + tonnageOf(s), 0);
  const prCount = sessions.reduce(
    (a, s) => a + s.exercises.reduce((b, ex) => b + ex.sets.filter((set) => set.completed && set.isPr).length, 0),
    0,
  );
  const volumeLabel = totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}t` : `${Math.round(totalVolume)}`;

  // --- e1RM por levantamento ---
  const series = LIFTS.map((l) => {
    const pts: { i: number; v: number }[] = [];
    chrono.forEach((s, idx) => {
      let best = 0;
      s.exercises.forEach((ex) => {
        if (l.match(ex.name.toLowerCase())) {
          ex.sets.forEach((set) => {
            if (set.completed) {
              const e = calculateE1RM(set.weight, set.reps, set.rpe);
              if (e > best) best = e;
            }
          });
        }
      });
      if (best > 0) pts.push({ i: idx, v: best });
    });
    return { ...l, pts };
  });

  const allVals = series.flatMap((s) => s.pts.map((p) => p.v));
  const hasLine = allVals.length >= 2 && n >= 2;
  const maxV = allVals.length ? Math.max(...allVals) : 0;
  const minV = allVals.length ? Math.min(...allVals) : 0;
  const range = maxV - minV || 1;

  const padL = 8, padR = 8, padT = 16, padB = 22;
  const vbW = 320, vbH = 150;
  const chartW = vbW - padL - padR;
  const chartH = vbH - padT - padB;
  const xFor = (i: number) => padL + (n <= 1 ? chartW / 2 : (i / (n - 1)) * chartW);
  const yFor = (v: number) => padT + chartH - ((v - minV) / range) * chartH;
  const pathOf = (pts: { i: number; v: number }[]) =>
    pts.map((p, k) => `${k === 0 ? 'M' : 'L'} ${xFor(p.i).toFixed(1)} ${yFor(p.v).toFixed(1)}`).join(' ');

  const liftMax = series.map((s) => (s.pts.length ? Math.max(...s.pts.map((p) => p.v)) : 0));
  const sbdTotal = liftMax.reduce((a, b) => a + b, 0);
  let acc = 0;
  const segs = LIFTS.map((l, i) => {
    const pct = sbdTotal ? (liftMax[i] / sbdTotal) * 100 : 0;
    const seg = `${l.color} ${acc.toFixed(1)}% ${(acc + pct).toFixed(1)}%`;
    acc += pct;
    return seg;
  });
  const donutBg = sbdTotal ? `conic-gradient(${segs.join(', ')})` : 'var(--bg-tertiary)';

  const bwNow = getBodyweightAt(new Date().toISOString());
  const dots = sbdTotal ? calculateDots(bwNow, sbdTotal, isMale) : 0;
  const wilks = sbdTotal ? calculateWilks(bwNow, sbdTotal, isMale) : 0;

  // --- Tendência do total estimado (SBD) por sessão (running best) ---
  const totalTrend: number[] = (() => {
    const best: Record<string, number> = {};
    const out: number[] = [];
    chrono.forEach((s) => {
      s.exercises.forEach((ex) => {
        const ln = ex.name.toLowerCase();
        const li = LIFTS.findIndex((l) => l.match(ln));
        if (li < 0) return;
        ex.sets.forEach((set) => {
          if (set.completed) {
            const e = calculateE1RM(set.weight, set.reps, set.rpe);
            if (e > (best[LIFTS[li].label] || 0)) best[LIFTS[li].label] = e;
          }
        });
      });
      const t = LIFTS.reduce((a, l) => a + (best[l.label] || 0), 0);
      if (t > 0) out.push(Math.round(t));
    });
    return out;
  })();

  // --- e1RM relativo ao peso corporal ---
  const relTrend: number[] = (() => {
    const best: Record<string, number> = {};
    const out: number[] = [];
    chrono.forEach((s) => {
      s.exercises.forEach((ex) => {
        const ln = ex.name.toLowerCase();
        const li = LIFTS.findIndex((l) => l.match(ln));
        if (li < 0) return;
        ex.sets.forEach((set) => {
          if (set.completed) {
            const e = calculateE1RM(set.weight, set.reps, set.rpe);
            if (e > (best[LIFTS[li].label] || 0)) best[LIFTS[li].label] = e;
          }
        });
      });
      const t = LIFTS.reduce((a, l) => a + (best[l.label] || 0), 0);
      const w = getBodyweightAt(s.date);
      if (t > 0 && w > 0) out.push(Math.round((t / w) * 100) / 100);
    });
    return out;
  })();

  // --- Peso corporal no período ---
  const bwSeries = bodyweightLog
    .filter((e) => inRange(e.date))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => e.weight);
  const bwDelta = bwSeries.length >= 2 ? Math.round((bwSeries[bwSeries.length - 1] - bwSeries[0]) * 10) / 10 : 0;

  // --- Volume por músculo ---
  const muscleVal: Record<string, number> = {};
  sessions.forEach((s) =>
    s.exercises.forEach((ex) => {
      const vol = ex.sets.reduce((a, set) => a + (set.completed ? (muscleMetric === 'tonnage' ? set.weight * set.reps : 1) : 0), 0);
      if (!vol) return;
      const { primary, secondary } = getExerciseMuscles(ex.name);
      primary.forEach((m) => (muscleVal[m] = (muscleVal[m] || 0) + vol));
      secondary.forEach((m) => (muscleVal[m] = (muscleVal[m] || 0) + vol * 0.5));
    }),
  );
  const maxMuscle = Math.max(1, ...Object.values(muscleVal));
  const fillFor = (m: MuscleGroup): string => {
    const r = (muscleVal[m] || 0) / maxMuscle;
    if (r <= 0) return '#1a1a1a';
    return `rgba(227,168,59,${(0.18 + r * 0.82).toFixed(2)})`;
  };
  const topMuscles = (Object.entries(muscleVal) as [MuscleGroup, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const hasMuscle = topMuscles.length > 0;

  // --- Tonelagem semanal ---
  const weekMap: Record<number, number> = {};
  sessions.forEach((s) => {
    const k = weekStart(new Date(s.date).getTime());
    weekMap[k] = (weekMap[k] || 0) + tonnageOf(s);
  });
  const weekBars = Object.keys(weekMap)
    .map(Number)
    .sort((a, b) => a - b)
    .slice(-10)
    .map((k) => weekMap[k]);
  const maxWeekBar = weekBars.length ? Math.max(...weekBars, 1) : 1;

  // --- Top exercícios por volume ---
  const exVol: Record<string, number> = {};
  sessions.forEach((s) =>
    s.exercises.forEach((ex) => {
      const v = ex.sets.reduce((a, set) => a + (set.completed ? set.weight * set.reps : 0), 0);
      if (v) exVol[ex.name] = (exVol[ex.name] || 0) + v;
    }),
  );
  const topEx = Object.entries(exVol).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxEx = topEx.length ? topEx[0][1] : 1;

  // --- RPE médio por semana ---
  const rpeWeek: Record<number, { sum: number; count: number }> = {};
  sessions.forEach((s) => {
    const k = weekStart(new Date(s.date).getTime());
    s.exercises.forEach((ex) =>
      ex.sets.forEach((set) => {
        if (set.completed && set.rpe) {
          rpeWeek[k] = rpeWeek[k] || { sum: 0, count: 0 };
          rpeWeek[k].sum += set.rpe;
          rpeWeek[k].count += 1;
        }
      }),
    );
  });
  const rpeWeekVals = Object.keys(rpeWeek)
    .map(Number)
    .sort((a, b) => a - b)
    .slice(-8)
    .map((k) => Math.round((rpeWeek[k].sum / rpeWeek[k].count) * 10) / 10);

  // --- Distribuição de RPE ---
  const rpeCounts: Record<number, number> = { 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 };
  sessions.forEach((s) =>
    s.exercises.forEach((ex) =>
      ex.sets.forEach((set) => {
        if (set.completed && set.rpe) {
          const r = Math.round(set.rpe);
          if (r >= 6 && r <= 10) rpeCounts[r]++;
        }
      }),
    ),
  );
  const maxRpe = Math.max(...Object.values(rpeCounts), 1);
  const hasRpe = Object.values(rpeCounts).some((c) => c > 0);

  // --- Heatmap de frequência (últimas 5 semanas) ---
  const dayCounts: Record<string, number> = {};
  history.forEach((s) => {
    const key = new Date(s.date).toDateString();
    dayCounts[key] = (dayCounts[key] || 0) + 1;
  });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const heatCells: number[] = [];
  for (let i = 34; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    heatCells.push(dayCounts[d.toDateString()] || 0);
  }
  const heatStyle = (c: number): React.CSSProperties => {
    if (c <= 0) return { backgroundColor: 'var(--bg-tertiary)' };
    const op = c >= 3 ? 1 : c === 2 ? 0.7 : 0.4;
    return { backgroundColor: 'var(--accent)', opacity: op };
  };

  // --- Linha do tempo de PRs ---
  const prs: { name: string; weight: number; e1rm: number; date: string }[] = [];
  sessions.forEach((s) =>
    s.exercises.forEach((ex) =>
      ex.sets.forEach((set) => {
        if (set.completed && set.isPr) {
          prs.push({ name: ex.name, weight: set.weight, e1rm: calculateE1RM(set.weight, set.reps, set.rpe), date: s.date });
        }
      }),
    ),
  );
  prs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const topPrs = prs.slice(0, 5);

  const periods: { id: Period; label: string }[] = [
    { id: '4w', label: '4 sem' },
    { id: '12w', label: '12 sem' },
    { id: 'year', label: 'Ano' },
    { id: 'all', label: 'Tudo' },
  ];

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>ANÁLISES</h1>

      {/* Period filter */}
      <div style={styles.periodWrap}>
        {periods.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            style={{
              ...styles.periodBtn,
              backgroundColor: period === p.id ? 'var(--accent)' : 'var(--bg-secondary)',
              color: period === p.id ? 'var(--accent-ink)' : 'var(--text-secondary)',
              borderColor: period === p.id ? 'var(--accent)' : 'var(--border-color)',
            }}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => setPeriod('custom')}
          style={{
            ...styles.periodBtn,
            backgroundColor: period === 'custom' ? 'var(--accent-soft)' : 'var(--bg-secondary)',
            color: period === 'custom' ? 'var(--accent)' : 'var(--text-secondary)',
            borderColor: period === 'custom' ? 'var(--accent-border)' : 'var(--border-color)',
          }}
        >
          Personalizado
        </button>
      </div>
      {period === 'custom' && (
        <div style={styles.dateRow}>
          <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} style={styles.dateInput} />
          <span style={styles.dateArrow}>→</span>
          <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} style={styles.dateInput} />
        </div>
      )}

      {/* Summary */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryBox}>
          <span style={styles.summaryVal}>{sessions.length}</span>
          <span style={styles.summaryLabel}>Treinos</span>
        </div>
        <div style={styles.summaryBox}>
          <span style={styles.summaryVal}>{volumeLabel}<span style={styles.summaryUnit}>{totalVolume >= 1000 ? '' : ` ${u}`}</span></span>
          <span style={styles.summaryLabel}>Volume</span>
        </div>
        <div style={styles.summaryBox}>
          <span style={{ ...styles.summaryVal, color: 'var(--accent)' }}>{prCount}</span>
          <span style={styles.summaryLabel}>PRs</span>
        </div>
      </div>

      {/* Total SBD trend */}
      <div style={styles.card}>
        <div style={styles.cardHead}>
          <span style={styles.cardTitle}>Total estimado (SBD)</span>
          <span style={styles.cardMeta}>{Math.round(sbdTotal)} {u}</span>
        </div>
        {totalTrend.length >= 2 ? (
          <svg width="100%" height="90" viewBox="0 0 300 90" fill="none" preserveAspectRatio="none">
            <polyline points={linePoints(totalTrend, 300, 90, 10)} stroke="var(--accent)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <div style={styles.empty}>Complete treinos com os 3 levantamentos para ver a tendência.</div>
        )}
      </div>

      {/* e1RM line chart */}
      <div style={styles.card}>
        <div style={styles.cardHead}>
          <span style={styles.cardTitle}>e1RM por levantamento</span>
          <div style={styles.legend}>
            {LIFTS.map((l, idx) => (
              <span key={idx} style={styles.legendItem}>
                <span style={{ ...styles.legendDash, backgroundColor: l.color }} />
                {l.short}
              </span>
            ))}
          </div>
        </div>
        {hasLine ? (
          <svg viewBox={`0 0 ${vbW} ${vbH}`} style={styles.svg}>
            {[0.5, 1].map((f, idx) => {
              const y = padT + chartH - f * chartH;
              return <line key={idx} x1={padL} y1={y} x2={vbW - padR} y2={y} stroke="var(--border-color)" strokeWidth="1" />;
            })}
            {series.map((s, idx) =>
              s.pts.length >= 2 ? (
                <path key={idx} d={pathOf(s.pts)} fill="none" style={{ stroke: s.color }} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              ) : null,
            )}
            {series.map((s, idx) =>
              s.pts.length ? (
                <circle key={`c${idx}`} cx={xFor(s.pts[s.pts.length - 1].i)} cy={yFor(s.pts[s.pts.length - 1].v)} r="3.5" style={{ fill: s.color }} />
              ) : null,
            )}
          </svg>
        ) : (
          <div style={styles.empty}>Complete treinos com os 3 levantamentos para ver a evolução.</div>
        )}
      </div>

      {/* Bodyweight */}
      <div style={styles.card}>
        <div style={styles.cardHead}>
          <span style={styles.cardTitle}>Peso corporal</span>
          <span style={styles.cardMeta}>
            {bwSeries.length ? `${bwSeries[bwSeries.length - 1]} ${u}` : '—'}
            {bwDelta !== 0 ? ` · ${bwDelta > 0 ? '↑' : '↓'} ${Math.abs(bwDelta)}` : ''}
          </span>
        </div>
        {bwSeries.length >= 2 ? (
          <svg width="100%" height="80" viewBox="0 0 300 80" fill="none" preserveAspectRatio="none">
            <polyline points={linePoints(bwSeries, 300, 80, 8)} stroke="#cfcfd4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <div style={styles.empty}>Registre seu peso (no Início) para acompanhar a evolução.</div>
        )}
      </div>

      {/* Muscle heatmap */}
      <div style={styles.card}>
        <div style={styles.cardHead}>
          <span style={styles.cardTitle}>Volume por músculo</span>
          <div style={styles.segmented}>
            <button onClick={() => setMuscleView('front')} style={muscleView === 'front' ? styles.segOn : styles.segOff}>Frente</button>
            <button onClick={() => setMuscleView('back')} style={muscleView === 'back' ? styles.segOn : styles.segOff}>Costas</button>
          </div>
        </div>
        {hasMuscle ? (
          <>
            <div style={styles.muscleWrap}>
              <MuscleMap view={muscleView} fill={fillFor} />
            </div>
            <div style={styles.muscleChips}>
              {topMuscles.map(([m]) => (
                <span key={m} style={styles.muscleChip}>{MUSCLE_LABELS[m]}</span>
              ))}
            </div>
            <div style={styles.heatBarRow}>
              <span style={styles.heatLegendTxt}>Baixo</span>
              <span style={styles.heatGradient} />
              <span style={styles.heatLegendTxt}>Alto</span>
            </div>
            <div style={styles.muscleFootRow}>
              <span style={styles.cardMeta}>Medir por</span>
              <div style={styles.segmented}>
                <button onClick={() => setMuscleMetric('tonnage')} style={muscleMetric === 'tonnage' ? styles.segOn : styles.segOff}>Tonelagem</button>
                <button onClick={() => setMuscleMetric('sets')} style={muscleMetric === 'sets' ? styles.segOn : styles.segOff}>Séries</button>
              </div>
            </div>
          </>
        ) : (
          <div style={styles.empty}>Registre treinos para ver o volume por grupo muscular.</div>
        )}
      </div>

      {/* Weekly tonnage */}
      <div style={styles.card}>
        <div style={styles.cardHead}>
          <span style={styles.cardTitle}>Tonelagem semanal</span>
          <span style={styles.cardMeta}>últimas {weekBars.length || 0}</span>
        </div>
        {weekBars.length ? (
          <div style={styles.barsRow}>
            {weekBars.map((v, idx) => (
              <div
                key={idx}
                style={{ ...styles.bar, height: `${Math.max(6, (v / maxWeekBar) * 110)}px`, opacity: idx === weekBars.length - 1 ? 1 : 0.45 }}
                title={`${Math.round(v)} ${u}`}
              />
            ))}
          </div>
        ) : (
          <div style={styles.empty}>Sem sessões no período.</div>
        )}
      </div>

      {/* Top exercises */}
      <div style={styles.card}>
        <span style={styles.cardTitle}>Top exercícios por volume</span>
        {topEx.length ? (
          <div style={styles.topList}>
            {topEx.map(([name, v]) => (
              <div key={name} style={styles.topRow}>
                <span style={styles.topName}>{name}</span>
                <span style={styles.topTrack}>
                  <span style={{ ...styles.topFill, width: `${Math.max(6, (v / maxEx) * 100)}%` }} />
                </span>
                <span style={styles.topVal}>{v >= 1000 ? `${(v / 1000).toFixed(1)}t` : Math.round(v)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.empty}>Sem dados no período.</div>
        )}
      </div>

      {/* SBD distribution + scores */}
      <div style={styles.twoCol}>
        <div style={styles.card}>
          <span style={styles.cardTitle}>Total SBD</span>
          <div style={styles.donutWrap}>
            <div style={{ ...styles.donut, background: donutBg }} />
            <div style={styles.donutHole}>
              <span style={styles.donutVal}>{Math.round(sbdTotal)}</span>
              <span style={styles.donutUnit}>{u}</span>
            </div>
          </div>
          <div style={styles.donutLegend}>
            {LIFTS.map((l, idx) => (
              <span key={idx} style={styles.donutLegendRow}>
                <span style={styles.legendItem}>
                  <span style={{ ...styles.legendSquare, backgroundColor: l.color }} />
                  {l.short}
                </span>
                <span style={styles.donutPct}>{sbdTotal ? Math.round((liftMax[idx] / sbdTotal) * 100) : 0}%</span>
              </span>
            ))}
          </div>
        </div>
        <div style={styles.scoreCol}>
          <div style={styles.card}>
            <span style={styles.cardMeta}>DOTS</span>
            <span style={styles.scoreVal}>{dots || '—'}</span>
          </div>
          <div style={styles.card}>
            <span style={styles.cardMeta}>Wilks</span>
            <span style={styles.scoreVal}>{wilks || '—'}</span>
          </div>
        </div>
      </div>

      {/* RPE: média semanal + distribuição */}
      <div style={styles.twoCol}>
        <div style={styles.card}>
          <span style={styles.cardTitle}>RPE médio</span>
          <span style={styles.cardMeta}>por semana</span>
          {rpeWeekVals.length >= 2 ? (
            <svg width="100%" height="60" viewBox="0 0 140 60" fill="none" preserveAspectRatio="none">
              <polyline points={linePoints(rpeWeekVals, 140, 60, 8)} stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <div style={styles.emptySmall}>Sem RPE suficiente.</div>
          )}
        </div>
        <div style={styles.card}>
          <span style={styles.cardTitle}>e1RM / peso</span>
          <span style={styles.cardMeta}>força relativa</span>
          {relTrend.length >= 2 ? (
            <svg width="100%" height="60" viewBox="0 0 140 60" fill="none" preserveAspectRatio="none">
              <polyline points={linePoints(relTrend, 140, 60, 8)} stroke="#9ec5ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <div style={styles.emptySmall}>Sem dados suficientes.</div>
          )}
        </div>
      </div>

      {/* RPE distribution */}
      <div style={styles.card}>
        <span style={styles.cardTitle}>Distribuição de RPE</span>
        {hasRpe ? (
          <div style={styles.rpeList}>
            {[6, 7, 8, 9, 10].map((r) => (
              <div key={r} style={styles.rpeRow}>
                <span style={{ ...styles.rpeNum, color: RPE_COLORS[r] }}>{r}</span>
                <span style={styles.rpeTrack}>
                  <span style={{ ...styles.rpeFill, width: `${(rpeCounts[r] / maxRpe) * 100}%`, backgroundColor: RPE_COLORS[r] }} />
                </span>
                <span style={styles.rpeCount}>{rpeCounts[r]}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.empty}>Registre o RPE das séries para ver a distribuição.</div>
        )}
      </div>

      {/* Frequency heatmap */}
      <div style={styles.card}>
        <div style={styles.cardHead}>
          <span style={styles.cardTitle}>Frequência de treino</span>
          <span style={styles.cardMeta}>últimas 5 semanas</span>
        </div>
        <div style={styles.heatGrid}>
          {heatCells.map((c, idx) => (
            <span key={idx} style={{ ...styles.heatCell, ...heatStyle(c) }} />
          ))}
        </div>
      </div>

      {/* PR timeline */}
      <div style={styles.card}>
        <div style={styles.cardHeadIcon}>
          <Award size={16} />
          <span style={styles.cardTitle}>Linha do tempo de PRs</span>
        </div>
        {topPrs.length ? (
          <div style={styles.timeline}>
            {topPrs.map((pr, idx) => (
              <div key={idx} style={styles.tlRow}>
                <div style={styles.tlMarker}>
                  <span style={{ ...styles.tlDot, ...(idx === 0 ? styles.tlDotActive : {}) }} />
                  {idx < topPrs.length - 1 && <span style={styles.tlLine} />}
                </div>
                <div style={styles.tlBody}>
                  <div style={styles.tlInfo}>
                    <span style={styles.tlName}>{pr.name} · {pr.weight} {u}</span>
                    <span style={styles.tlSub}>e1RM {Math.round(pr.e1rm)} {u}</span>
                  </div>
                  <span style={styles.tlDate}>{relativeDate(pr.date)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.empty}>Nenhum recorde no período. Continue progredindo!</div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', width: '100%' },
  pageTitle: { fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '0.05em', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' },
  periodWrap: { display: 'flex', gap: '7px', flexWrap: 'wrap', marginBottom: '10px' },
  periodBtn: { height: '34px', padding: '0 13px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, border: '1px solid var(--border-color)' },
  dateRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' },
  dateInput: { flex: 1, height: '38px', fontSize: '13px', colorScheme: 'dark' },
  dateArrow: { color: 'var(--text-muted)' },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '16px' },
  summaryBox: { backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' },
  summaryVal: { fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' },
  summaryUnit: { fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' },
  summaryLabel: { fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' },
  card: { backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' },
  cardHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardHeadIcon: { display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' },
  cardTitle: { fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' },
  cardMeta: { fontSize: '11px', color: 'var(--text-muted)' },
  svg: { width: '100%', height: 'auto', overflow: 'visible' },
  legend: { display: 'flex', flexWrap: 'wrap', gap: '12px' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' },
  legendDash: { width: '10px', height: '3px', borderRadius: '2px' },
  legendSquare: { width: '8px', height: '8px', borderRadius: '2px' },
  segmented: { display: 'flex', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '9px', padding: '2px' },
  segOn: { fontSize: '11px', fontWeight: 700, color: 'var(--accent-ink)', background: 'var(--accent)', padding: '5px 11px', borderRadius: '7px' },
  segOff: { fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', padding: '5px 11px' },
  empty: { fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, textAlign: 'center', padding: '20px 8px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)' },
  emptySmall: { fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '14px 4px' },
  muscleWrap: { display: 'flex', justifyContent: 'center', padding: '4px 0' },
  muscleChips: { display: 'flex', flexWrap: 'wrap', gap: '7px', justifyContent: 'center' },
  muscleChip: { fontSize: '11px', fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', padding: '4px 10px', borderRadius: '999px' },
  heatBarRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  heatGradient: { flex: 1, height: '8px', borderRadius: '4px', background: 'linear-gradient(90deg, rgba(227,168,59,0.18), var(--accent))' },
  heatLegendTxt: { fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 },
  muscleFootRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  barsRow: { display: 'flex', alignItems: 'flex-end', gap: '6px', height: '120px' },
  bar: { flex: 1, backgroundColor: 'var(--accent)', borderRadius: '4px 4px 0 0' },
  topList: { display: 'flex', flexDirection: 'column', gap: '9px' },
  topRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  topName: { width: '92px', fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  topTrack: { flex: 1, height: '14px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' },
  topFill: { display: 'block', height: '100%', background: 'var(--accent)', borderRadius: '4px' },
  topVal: { width: '40px', fontSize: '10px', color: 'var(--text-secondary)', textAlign: 'right' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  donutWrap: { position: 'relative', width: '108px', height: '108px', alignSelf: 'center' },
  donut: { width: '108px', height: '108px', borderRadius: '50%' },
  donutHole: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '66px', height: '66px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  donutVal: { fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' },
  donutUnit: { fontSize: '8px', color: 'var(--text-muted)' },
  donutLegend: { display: 'flex', flexDirection: 'column', gap: '5px' },
  donutLegendRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  donutPct: { fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' },
  scoreCol: { display: 'flex', flexDirection: 'column', gap: '12px' },
  scoreVal: { fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' },
  rpeList: { display: 'flex', flexDirection: 'column', gap: '9px' },
  rpeRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  rpeNum: { width: '18px', fontSize: '12px', fontWeight: 800, textAlign: 'center' },
  rpeTrack: { flex: 1, height: '14px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '7px', overflow: 'hidden' },
  rpeFill: { display: 'block', height: '100%', borderRadius: '7px' },
  rpeCount: { width: '30px', fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'right' },
  heatGrid: { display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '5px' },
  heatCell: { width: '100%', aspectRatio: '1', borderRadius: '3px' },
  timeline: { display: 'flex', flexDirection: 'column' },
  tlRow: { display: 'flex', gap: '12px' },
  tlMarker: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  tlDot: { width: '11px', height: '11px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', border: '2px solid var(--border-focus)' },
  tlDotActive: { backgroundColor: 'var(--accent)', border: '2px solid var(--accent)' },
  tlLine: { width: '2px', flex: 1, backgroundColor: 'var(--border-color)' },
  tlBody: { display: 'flex', justifyContent: 'space-between', flex: 1, paddingBottom: '16px' },
  tlInfo: { display: 'flex', flexDirection: 'column' },
  tlName: { fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' },
  tlSub: { fontSize: '11px', color: 'var(--text-muted)' },
  tlDate: { fontSize: '11px', color: 'var(--text-muted)' },
};
export default Analytics;
