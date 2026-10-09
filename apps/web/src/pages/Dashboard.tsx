import React, { useMemo, useState } from 'react';
import { Award, ChevronRight, List, Play, Plus } from 'lucide-react';
import type { WorkoutSession } from '@powerlifting/shared';
import { useWorkout } from '../context/WorkoutContext';
import { Block, Button, IconButton, ScreenHeader, Segments, Sheet, Stat } from '../ui';
import { cx } from '../ui/cx';
import BodyweightLogList from '../components/BodyweightLogList';
import { WeekStrip } from '../components/home/WeekStrip/WeekStrip';
import { SessionSheet } from '../components/home/SessionSheet/SessionSheet';
import { WeightSheet } from '../components/home/WeightSheet/WeightSheet';
import { RoutinePickerSheet } from '../components/home/RoutinePickerSheet/RoutinePickerSheet';
import { useTemplateStart } from '../hooks/useTemplateStart';
import { EMPTY_VALUE, formatCompact, formatNumber } from '../utils/format';
import {
  barHeights, bodyweightSummary, bodyweightTrendText, dayHeadline, longDate, programWeek, relativeDay,
  sessionRecordsText, strengthSummary, templateMeta, tonnage, tonnageText, trendText, weekSummary,
} from '../utils/home';
import styles from './Dashboard.module.css';

interface DashboardProps {
  onStartWorkoutTab: () => void;
  /** Navega para o Histórico completo; opcionalmente abre uma sessão (em edição). */
  onNavigateHistory: (opts?: { sessionId?: string; edit?: boolean }) => void;
}

const sessionLine = (s: WorkoutSession, now: Date, unit: string) => {
  const parts = [relativeDay(new Date(s.date), now)];
  if (s.duration > 0) parts.push(`${Math.round(s.duration / 60)} min`);
  const t = tonnage(s);
  if (t > 0) parts.push(tonnageText(t, unit));
  return parts.join(', ');
};

const joinNames = (names: string[]) =>
  names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;

/** Mini-barras do total nas últimas 12 semanas: a atual em branco, as anteriores recuadas. */
function StrengthBars({ values, unit }: { values: (number | null)[]; unit: string }) {
  const present = values.filter((v): v is number => v !== null);
  if (present.length < 2) return null;
  const heights = barHeights(values);
  const W = 6;
  const GAP = 2.5;
  const H = 40;
  const width = values.length * W + (values.length - 1) * GAP;
  const label = `Total nas últimas 12 semanas, de ${formatNumber(Math.min(...present), 1)} a ${formatNumber(Math.max(...present), 1)} ${unit}`;
  return (
    <svg className={styles.bars} width={width} height={H} viewBox={`0 0 ${width} ${H}`} role="img" aria-label={label}>
      {heights.map((h, i) => {
        if (h <= 0) return null;
        const barH = Math.max(2, h * H);
        return (
          <rect
            key={i}
            x={i * (W + GAP)}
            y={H - barH}
            width={W}
            height={barH}
            rx={1}
            className={i === values.length - 1 ? styles.barNow : styles.bar}
          />
        );
      })}
    </svg>
  );
}

export const Dashboard: React.FC<DashboardProps> = ({ onStartWorkoutTab, onNavigateHistory }) => {
  const { state, activeWorkout, startWorkout, repeatWorkout, logBodyweight, getNextTemplate, deleteHistorySession } = useWorkout();
  const { history, settings, bodyweightLog, programs, templates } = state;
  const u = settings.units;

  const [selected, setSelected] = useState<WorkoutSession | null>(null);
  const [sheet, setSheet] = useState<'weight' | 'weightLog' | 'routines' | null>(null);
  // Rotina por %1RM sem máximo pergunta antes os máximos (#336).
  const templateStart = useTemplateStart(onStartWorkoutTab);

  const now = new Date();
  // Recalculam só quando os dados mudam, não a cada render (#267).
  const { strength, week, lastSession } = useMemo(() => {
    const at = new Date();
    return {
      strength: strengthSummary(history, at),
      week: weekSummary(history, at),
      lastSession: history.length ? history.reduce((a, b) => (a.date > b.date ? a : b)) : null,
    };
  }, [history]);
  const bw = useMemo(() => bodyweightSummary(bodyweightLog), [bodyweightLog]);

  const suggestedTemplate = getNextTemplate();
  const activeProgram = programs.find((p) => p.isActive && !p.deleted);
  const fromProgram = !!(activeProgram && suggestedTemplate && activeProgram.templateIds.includes(suggestedTemplate.id));
  const blockWeek = fromProgram && activeProgram ? programWeek(activeProgram, now) : null;
  const weeklyTarget = activeProgram?.trainingDays?.length ?? 0;

  const headline = dayHeadline({ hasActiveWorkout: !!activeWorkout, history, program: activeProgram, now });

  const handleStart = () => {
    if (activeWorkout) onStartWorkoutTab();
    else if (suggestedTemplate) templateStart.start(suggestedTemplate.id);
    else handleAvulso();
  };
  function handleAvulso() {
    if (!activeWorkout) startWorkout();
    onStartWorkoutTab();
  }
  // Conta nova (#336): o card oferece registrar o treino de hoje ou usar uma rotina pronta.
  const isFirstWorkout = history.length === 0 && !activeWorkout;
  const builtInTemplates = templates.filter((t) => t.isBuiltIn && !t.archived && !t.deleted);

  // ---- Próximo treino ----
  let nextKicker = 'Próximo treino';
  let nextTitle = suggestedTemplate?.name ?? 'Treino avulso';
  let nextMeta: string | null = suggestedTemplate ? templateMeta(suggestedTemplate) : 'Comece vazio e adicione os exercícios.';
  if (activeWorkout) {
    const sets = activeWorkout.exercises.flatMap((ex) => ex.sets);
    // O título da tela já diz "Treino em andamento": aqui vai a hora de início.
    nextKicker = `Começou às ${new Date(activeWorkout.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    nextTitle = activeWorkout.name;
    nextMeta = `${sets.filter((s) => s.completed).length} de ${sets.length} séries`;
  }

  const hasAnyLift = strength.lifts.some((l) => l.record > 0);
  const weekTon = week.tonnage > 0 ? tonnageText(week.tonnage, u) : null;
  const bwTrend = bw ? bodyweightTrendText(bw, u) : null;
  const records = lastSession ? sessionRecordsText(lastSession) : null;

  return (
    <div className={styles.screen}>
      <ScreenHeader title={headline} meta={longDate(now)} />

      {isFirstWorkout ? (
        <Block className={styles.first}>
          <h2 className={styles.nextTitle}>Comece pelo treino de hoje</h2>
          <span className={styles.nextMeta}>Monte com os exercícios que você já faz, ou use uma rotina pronta.</span>
          <div className={styles.nextActions}>
            <Button variant="primary" size="lg" block icon={<Play size={17} fill="currentColor" strokeWidth={0} />} onClick={handleAvulso}>
              Registrar o treino de hoje
            </Button>
            <Button variant="secondary" block onClick={() => setSheet('routines')}>Usar uma rotina pronta</Button>
          </div>
        </Block>
      ) : (
      /* Próximo treino: o card inteiro inicia; o botão é o alvo acessível. */
      <Block className={styles.next} onClick={handleStart}>
        <span className={styles.kicker}>{nextKicker}</span>
        <h2 className={styles.nextTitle}>{nextTitle}</h2>
        {!activeWorkout && fromProgram && activeProgram && (
          <div className={styles.program}>
            {blockWeek && (
              // Largura por semana (22 px cada, como no mock): o Segments ocupa o espaço que receber.
              <span
                className={styles.programSegments}
                style={{ width: `calc(${blockWeek.count} * 22px + ${blockWeek.count - 1} * var(--seg-gap))` }}
              >
                <Segments
                  total={blockWeek.count}
                  filled={blockWeek.week - 1}
                  size="sm"
                  label={`Semana ${blockWeek.week} de ${blockWeek.count} do bloco`}
                />
              </span>
            )}
            <span>{blockWeek ? `${activeProgram.name}, semana ${blockWeek.week} de ${blockWeek.count}` : activeProgram.name}</span>
          </div>
        )}
        {nextMeta && <span className={styles.nextMeta}>{nextMeta}</span>}
        <div className={styles.nextActions}>
          <Button
            variant="primary"
            size="lg"
            block
            icon={<Play size={17} fill="currentColor" strokeWidth={0} />}
            onClick={(event) => {
              event.stopPropagation();
              handleStart();
            }}
          >
            {activeWorkout ? 'Continuar treino' : 'Começar treino'}
          </Button>
          {!activeWorkout && suggestedTemplate && (
            <Button
              variant="link"
              block
              onClick={(event) => {
                event.stopPropagation();
                handleAvulso();
              }}
            >
              Treino avulso
            </Button>
          )}
        </div>
      </Block>
      )}

      {/* Sua força: total atual (12 semanas), tendência e os três levantamentos. */}
      <Block label="Sua força" aside="soma dos três e1RM, 12 semanas">
        {strength.total !== null ? (
          <div className={styles.totalArea}>
            <Stat value={strength.total} decimals={1} unit={u} size="xl" />
            {/* Barras na linha da tendência: ao lado do número, o "kg" quebrava em 375 px. */}
            <div className={styles.trendRow}>
              {strength.trend && <p className={styles.trend}>{trendText(strength.trend, u)}</p>}
              <StrengthBars values={strength.weekly} unit={u} />
            </div>
          </div>
        ) : (
          <p className={styles.note}>
            {hasAnyLift && strength.missing.length < 3
              ? `Falta registrar ${joinNames(strength.missing.map((m) => m.toLowerCase()))} nas últimas 12 semanas para somar o total.`
              : hasAnyLift
                ? 'Nenhum agachamento, supino ou terra nas últimas 12 semanas.'
                : 'Registre agachamento, supino e terra para ver seu total e a evolução.'}
          </p>
        )}
        {hasAnyLift && (
          <ul className={styles.lifts}>
            {strength.lifts.map((l) => (
              <li key={l.lift} className={styles.lift}>
                <span className={styles.liftName}>{l.label}</span>
                <span className={styles.liftValue}>
                  {l.current > 0 && l.current >= l.record && (
                    <span role="img" aria-label="Recorde" className={styles.recordIcon}>
                      <Award size={16} aria-hidden="true" />
                    </span>
                  )}
                  {l.record > l.current && <span className={styles.recordNote}>recorde {formatNumber(l.record, 1)}</span>}
                  <span className={cx(styles.liftNum, l.current === 0 && styles.liftEmpty)}>
                    {l.current > 0 ? formatNumber(l.current, 1) : EMPTY_VALUE}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Block>

      {/* Esta semana: só depois do primeiro treino (#338). */}
      {history.length > 0 && (
        <Block label="Esta semana" aside={week.streak >= 2 ? `${week.streak} semanas seguidas` : undefined}>
          <div className={styles.weekLine}>
            <span className={styles.weekCount}>{week.count}</span>
            <span className={styles.weekOf}>
              {weeklyTarget > 0
                ? `de ${weeklyTarget} ${weeklyTarget === 1 ? 'treino' : 'treinos'}`
                : week.count === 1 ? 'treino' : 'treinos'}
            </span>
            {weekTon && <span className={styles.weekTon}>{weekTon} {weekTon.endsWith(' t') ? 'levantadas' : 'levantados'}</span>}
          </div>
          <WeekStrip days={week.days} todayIdx={week.todayIdx} />
        </Block>
      )}

      {/* Peso corporal e último treino. */}
      <Block className={styles.flush}>
        <div className={styles.weightRow}>
          <div className={styles.weightInfo}>
            <span className={styles.kicker}>Peso corporal</span>
            {bw ? (
              <div className={styles.weightLine}>
                <span className={styles.weightNum}>{formatCompact(bw.latest, 1)}</span>
                <span className={styles.weightUnit}>{u}</span>
                {bwTrend && <span className={styles.weightTrend}>{bwTrend}</span>}
              </div>
            ) : (
              <span className={styles.weightEmpty}>Não informado</span>
            )}
          </div>
          <div className={styles.weightActions}>
            {bw ? (
              <>
                <IconButton aria-label="Ver registros de peso" icon={<List size={20} />} onClick={() => setSheet('weightLog')} />
                <IconButton aria-label="Registrar peso" icon={<Plus size={20} />} onClick={() => setSheet('weight')} />
              </>
            ) : (
              <Button variant="secondary" icon={<Plus size={16} />} onClick={() => setSheet('weight')}>Registrar</Button>
            )}
          </div>
        </div>

        {lastSession && (
          <button type="button" className={styles.lastRow} onClick={() => setSelected(lastSession)}>
            <span className={styles.lastInfo}>
              <span className={styles.kicker}>Último treino</span>
              <span className={styles.lastName}>{lastSession.name}</span>
              <span className={styles.lastMeta}>{sessionLine(lastSession, now, u)}</span>
              {records && (
                <span className={styles.lastRecord}>
                  <Award size={15} aria-hidden="true" /> {records}
                </span>
              )}
            </span>
            <ChevronRight size={18} className={styles.chevron} aria-hidden="true" />
          </button>
        )}
      </Block>

      {selected && (
        <SessionSheet
          session={selected}
          meta={`${longDate(new Date(selected.date))}${selected.duration > 0 ? `, ${Math.round(selected.duration / 60)} min` : ''}`}
          templates={templates}
          units={u}
          hasActiveWorkout={!!activeWorkout}
          onRepeat={() => {
            repeatWorkout(selected);
            setSelected(null);
            onStartWorkoutTab();
          }}
          onEdit={() => onNavigateHistory({ sessionId: selected.id, edit: true })}
          onDelete={() => {
            deleteHistorySession(selected.id);
            setSelected(null);
          }}
          onOpenHistory={() => onNavigateHistory()}
          onClose={() => setSelected(null)}
        />
      )}

      {sheet === 'weight' && (
        <WeightSheet
          unit={u}
          onSave={(weight) => {
            logBodyweight(weight);
            setSheet(null);
          }}
          onClose={() => setSheet(null)}
        />
      )}

      {sheet === 'routines' && (
        <RoutinePickerSheet
          templates={builtInTemplates}
          onPick={(id) => {
            setSheet(null);
            templateStart.start(id);
          }}
          onClose={() => setSheet(null)}
        />
      )}
      {templateStart.sheet}

      {sheet === 'weightLog' && (
        <Sheet
          open
          onClose={() => setSheet(null)}
          title="Registros de peso"
          actions={<Button variant="link" block onClick={() => setSheet(null)}>Fechar</Button>}
        >
          <BodyweightLogList />
        </Sheet>
      )}
    </div>
  );
};

export default Dashboard;
