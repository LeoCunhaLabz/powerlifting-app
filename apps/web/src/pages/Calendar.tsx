import React, { useState } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import type { Program, WorkoutTemplate } from '@powerlifting/shared';
import { ChevronLeft, ChevronRight, Play, CalendarDays } from 'lucide-react';

interface CalendarProps {
  onStartWorkoutTab: () => void;
}

// 0=Seg … 6=Dom (semana começa na segunda)
const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

/** Converte Date para string YYYY-MM-DD no fuso local. */
function toLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Índice 0=Seg…6=Dom para uma Date. */
function weekDayIdx(d: Date): number {
  return (d.getDay() + 6) % 7;
}

/** Conta quantos dias de treino existem entre startDate (inclusive) e targetDate (exclusive). */
function countTrainingDaysBefore(startDate: string, targetDate: string, trainingDays: number[]): number {
  if (!trainingDays.length) return 0;
  const start = new Date(startDate + 'T00:00:00');
  const target = new Date(targetDate + 'T00:00:00');
  if (target <= start) return 0;
  let count = 0;
  const cur = new Date(start);
  while (cur < target) {
    if (trainingDays.includes(weekDayIdx(cur))) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

/** Retorna o template index (no ciclo do programa) para um determinado slot de treino. */
function templateIndexForSlot(slotIndex: number, templateCount: number): number {
  return slotIndex % templateCount;
}

interface CalendarDay {
  date: string; // YYYY-MM-DD
  dayNum: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isTrainingDay: boolean;
  template: WorkoutTemplate | null;
  isDone: boolean;  // sessão realizada neste dia com este template
  isMissed: boolean; // dia de treino passado sem sessão
}

function buildCalendarDays(
  year: number,
  month: number,
  program: Program,
  templates: WorkoutTemplate[],
  history: { date: string; templateId?: string }[],
): CalendarDay[] {
  const today = toLocalDate(new Date());
  const startDate = program.startDate ?? program.createdAt.slice(0, 10);
  const trainingDays = program.trainingDays ?? [];

  // Conjunto de datas do histórico com templateId válido do programa
  const doneDates = new Set(
    history
      .filter(s => s.templateId && program.templateIds.includes(s.templateId))
      .map(s => s.date.slice(0, 10)),
  );

  // Primeiro dia do mês e da grade (semana começa na segunda)
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = weekDayIdx(firstOfMonth); // quantas células em branco antes do dia 1
  const lastOfMonth = new Date(year, month + 1, 0).getDate();

  const days: CalendarDay[] = [];

  // Células do mês anterior (preenche a primeira linha)
  const prevMonthLast = new Date(year, month, 0).getDate();
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthLast - i);
    days.push({
      date: toLocalDate(d),
      dayNum: d.getDate(),
      isCurrentMonth: false,
      isToday: false,
      isTrainingDay: false,
      template: null,
      isDone: false,
      isMissed: false,
    });
  }

  // Dias do mês corrente
  for (let d = 1; d <= lastOfMonth; d++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dateObj = new Date(date + 'T00:00:00');
    const isTrainingDay = trainingDays.includes(weekDayIdx(dateObj)) && date >= startDate;
    let template: WorkoutTemplate | null = null;

    if (isTrainingDay && program.templateIds.length > 0) {
      const slotIdx = countTrainingDaysBefore(startDate, date, trainingDays);
      const tplId = program.templateIds[templateIndexForSlot(slotIdx, program.templateIds.length)];
      template = templates.find(t => t.id === tplId) ?? null;
    }

    const isDone = isTrainingDay && doneDates.has(date);
    const isMissed = isTrainingDay && !isDone && date < today;

    days.push({
      date,
      dayNum: d,
      isCurrentMonth: true,
      isToday: date === today,
      isTrainingDay,
      template,
      isDone,
      isMissed,
    });
  }

  // Completar até múltiplo de 7
  const remaining = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    days.push({
      date: toLocalDate(d),
      dayNum: i,
      isCurrentMonth: false,
      isToday: false,
      isTrainingDay: false,
      template: null,
      isDone: false,
      isMissed: false,
    });
  }

  return days;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export const Calendar: React.FC<CalendarProps> = ({ onStartWorkoutTab }) => {
  const { state, startWorkout } = useWorkout();
  const { programs, templates, history } = state;

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0-based
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const activeProgram: Program | undefined = programs.find(p => p.isActive);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
    setSelectedDate(null);
  };

  if (!activeProgram) {
    return (
      <div style={styles.container}>
        <h1 style={styles.pageTitle}>CALENDÁRIO</h1>
        <div style={styles.empty}>
          <CalendarDays size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <p>Nenhum programa ativo.</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
            Crie e ative um programa em Rotinas → Programas para ver o calendário.
          </p>
        </div>
      </div>
    );
  }

  const hasTrainingDays = (activeProgram.trainingDays ?? []).length > 0;
  const days = hasTrainingDays
    ? buildCalendarDays(viewYear, viewMonth, activeProgram, templates, history)
    : null;

  const today = toLocalDate(new Date());
  const selectedDay = days?.find(d => d.date === selectedDate);

  const handleDayPress = (day: CalendarDay) => {
    if (!day.isCurrentMonth || !day.isTrainingDay) return;
    setSelectedDate(prev => (prev === day.date ? null : day.date));
  };

  const handleStart = (tplId: string) => {
    startWorkout(tplId);
    onStartWorkoutTab();
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>CALENDÁRIO</h1>

      {/* Program info */}
      <div style={styles.progBadge}>
        <span style={styles.progBadgeDot} />
        <span style={styles.progBadgeName}>{activeProgram.name}</span>
        <span style={styles.progBadgeSub}>{activeProgram.templateIds.length} rotina{activeProgram.templateIds.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Month nav */}
      <div style={styles.monthNav}>
        <button onClick={prevMonth} style={styles.navBtn}><ChevronLeft size={20} /></button>
        <span style={styles.monthLabel}>{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} style={styles.navBtn}><ChevronRight size={20} /></button>
      </div>

      {!hasTrainingDays ? (
        <div style={styles.empty}>
          <p>Configure os dias de treino do programa para ver a projeção no calendário.</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
            Vá em Rotinas → Programas → Editar.
          </p>
        </div>
      ) : (
        <>
          {/* Day-of-week headers */}
          <div style={styles.grid}>
            {DAY_LABELS.map(l => (
              <div key={l} style={styles.dayHeader}>{l}</div>
            ))}
            {days!.map(day => {
              const isSelected = day.date === selectedDate;
              let bg = 'transparent';
              let textColor: string = day.isCurrentMonth ? 'var(--text-primary)' : 'var(--text-muted)';
              let border = 'transparent';

              if (day.isDone) { bg = 'var(--accent)'; textColor = 'var(--accent-ink)'; }
              else if (day.isMissed) { bg = 'rgba(229,84,75,0.15)'; textColor = 'var(--error)'; }
              else if (day.isTrainingDay && day.isCurrentMonth) { bg = 'var(--accent-soft)'; textColor = 'var(--accent)'; }
              if (day.isToday) { border = 'var(--accent)'; }
              if (isSelected) { border = 'var(--text-primary)'; }

              return (
                <button
                  key={day.date}
                  onClick={() => handleDayPress(day)}
                  style={{
                    ...styles.dayCell,
                    backgroundColor: bg,
                    color: textColor,
                    border: `2px solid ${border}`,
                    opacity: !day.isCurrentMonth ? 0.4 : 1,
                    cursor: day.isTrainingDay && day.isCurrentMonth ? 'pointer' : 'default',
                  }}
                >
                  <span style={styles.dayNum}>{day.dayNum}</span>
                  {day.isTrainingDay && day.isCurrentMonth && day.template && (
                    <span style={styles.dayTplLabel}>
                      {day.template.name.split(' ')[0]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div style={styles.legend}>
            <span style={styles.legendItem}><span style={{ ...styles.legendDot, background: 'var(--accent)' }} /> Concluído</span>
            <span style={styles.legendItem}><span style={{ ...styles.legendDot, background: 'var(--accent-soft)', border: '1px solid var(--accent-border)' }} /> Planejado</span>
            <span style={styles.legendItem}><span style={{ ...styles.legendDot, background: 'rgba(229,84,75,0.2)' }} /> Perdido</span>
          </div>

          {/* Detail sheet */}
          {selectedDay && (
            <div style={styles.sheet}>
              <div style={styles.sheetHeader}>
                <span style={styles.sheetDate}>
                  {new Date(selectedDay.date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
                {selectedDay.isDone && <span style={styles.doneBadge}>Concluído</span>}
                {selectedDay.isMissed && <span style={styles.missedBadge}>Perdido</span>}
              </div>
              {selectedDay.template && (
                <>
                  <div style={styles.sheetTplName}>{selectedDay.template.name}</div>
                  <div style={styles.sheetSub}>{selectedDay.template.exercises.length} exercícios · {selectedDay.template.exercises.reduce((t, e) => t + e.sets.length, 0)} séries</div>
                  {selectedDay.template.description && (
                    <div style={styles.sheetDesc}>{selectedDay.template.description}</div>
                  )}
                  {!selectedDay.isDone && selectedDay.date <= today && selectedDay.template && (
                    <button onClick={() => handleStart(selectedDay.template!.id)} style={styles.startBtn}>
                      <Play size={15} fill="var(--accent-ink)" stroke="none" />
                      {selectedDay.isToday ? 'Iniciar treino de hoje' : 'Iniciar treino'}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', width: '100%', gap: 0 },
  pageTitle: { fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '0.05em', marginBottom: 14 },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 },
  progBadge: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--accent-border)', borderRadius: 'var(--radius-md)', marginBottom: 14 },
  progBadgeDot: { width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--accent)', flexShrink: 0 } as React.CSSProperties,
  progBadgeName: { fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', flex: 1 },
  progBadgeSub: { fontSize: 11, color: 'var(--text-muted)' },
  monthNav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  navBtn: { width: 36, height: 36, borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  monthLabel: { fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 12 },
  dayHeader: { textAlign: 'center', fontSize: 9, fontWeight: 800, color: 'var(--text-muted)', padding: '4px 0', letterSpacing: '0.05em' },
  dayCell: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 8, minHeight: 46, padding: '4px 2px', gap: 2, background: 'transparent' } as React.CSSProperties,
  dayNum: { fontSize: 13, fontWeight: 700, lineHeight: 1 },
  dayTplLabel: { fontSize: 8, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', opacity: 0.85 },
  legend: { display: 'flex', gap: 14, justifyContent: 'center', marginBottom: 16, flexWrap: 'wrap' },
  legendItem: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-secondary)' },
  legendDot: { width: 10, height: 10, borderRadius: 3, flexShrink: 0 } as React.CSSProperties,
  sheet: { backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '16px', marginTop: 4, display: 'flex', flexDirection: 'column', gap: 8 },
  sheetHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sheetDate: { fontSize: 13, color: 'var(--text-secondary)', textTransform: 'capitalize' },
  doneBadge: { fontSize: 10, fontWeight: 700, color: 'var(--accent)', backgroundColor: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 999, padding: '2px 8px' },
  missedBadge: { fontSize: 10, fontWeight: 700, color: 'var(--error)', backgroundColor: 'rgba(229,84,75,0.12)', border: '1px solid rgba(229,84,75,0.25)', borderRadius: 999, padding: '2px 8px' },
  sheetTplName: { fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' },
  sheetSub: { fontSize: 12, color: 'var(--text-muted)' },
  sheetDesc: { fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 },
  startBtn: { marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: 46, backgroundColor: 'var(--accent)', color: 'var(--accent-ink)', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 800 },
};

export default Calendar;
