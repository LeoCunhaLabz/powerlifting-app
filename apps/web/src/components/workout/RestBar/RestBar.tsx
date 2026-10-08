import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useWorkout } from '../../../context/WorkoutContext';
import { Button, IconButton, Segments } from '../../../ui';
import { countdownFilled } from '../../../ui/Segments/segmentStates';
import { cx } from '../../../ui/cx';
import { REST_OVERTIME_LIMIT, formatClock, nextSetInfo, restStatus } from '../../../utils/restTimer';
import { alertRestEnd } from './restAlert';
import styles from './RestBar.module.css';

const SEGMENTS = 18;

/**
 * Descanso entre séries (#330, #341, #342), na faixa fixa acima da navegação.
 * - compacta: tempo, segmentos (o restante em dourado), "+30 s" e "Pular"; tocar no tempo abre;
 * - aberta: painel por cima do conteúdo com o exercício, a próxima série e "−30 s / +30 s / Pular descanso";
 * - encerrada: "Descanso encerrado", o tempo extra e a próxima série, até a próxima ação.
 */
export function RestBar() {
  const { restTimer, adjustRestTimer, stopRestTimer, activeWorkout, state } = useWorkout();
  const [now, setNow] = useState(() => Date.now());
  // Aberta para qual descanso (pelo início): ±30 s não muda o início, um descanso novo muda e fecha.
  const [openStart, setOpenStart] = useState<number | null>(null);
  // Fim que foi visto correndo nesta tela: só ele avisa ao chegar em zero (reabrir o app
  // com o descanso já vencido não apita de novo).
  const seenRunning = useRef<number | null>(null);
  const alerted = useRef<number | null>(null);

  useEffect(() => {
    if (!restTimer) return;
    const tick = () => setNow(Date.now());
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [restTimer]);

  const status = restTimer ? restStatus(restTimer, now) : null;
  const end = restTimer?.end ?? null;
  const ended = status?.ended ?? false;
  const expired = ended && (status?.overtime ?? 0) > REST_OVERTIME_LIMIT;

  useEffect(() => {
    if (end === null) return;
    if (!ended) {
      seenRunning.current = end;
      return;
    }
    if (seenRunning.current === end && alerted.current !== end) {
      alerted.current = end;
      alertRestEnd();
    }
  }, [end, ended]);

  useEffect(() => {
    if (expired) stopRestTimer();
  }, [expired, stopRestTimer]);

  if (!restTimer || !status || expired) return null;

  const start = restTimer.end - restTimer.total * 1000;
  const units = state.settings.units;
  return (
    <RestBarView
      status={status}
      exercise={restTimer.exercise}
      next={activeWorkout ? nextSetInfo(activeWorkout.exercises, units) : null}
      open={openStart === start}
      onOpen={() => setOpenStart(start)}
      onCollapse={() => setOpenStart(null)}
      onAdjust={adjustRestTimer}
      onSkip={stopRestTimer}
    />
  );
}

export interface RestBarViewProps {
  status: ReturnType<typeof restStatus>;
  /** Exercício da série que abriu o descanso. */
  exercise?: string;
  next: ReturnType<typeof nextSetInfo>;
  open: boolean;
  onOpen: () => void;
  onCollapse: () => void;
  onAdjust: (deltaSeconds: number) => void;
  /** Pular (correndo) ou fechar (encerrado). */
  onSkip: () => void;
}

/** Desenho da barra de descanso nos três estados (sem contexto: o catálogo usa direto). */
export function RestBarView({ status, exercise, next, open, onOpen, onCollapse, onAdjust, onSkip }: RestBarViewProps) {
  const ended = status.ended;
  const filled = countdownFilled(status.remaining, status.total, SEGMENTS);
  const segmentsLabel = `${formatClock(status.remaining)} de ${formatClock(status.total)} de descanso restantes`;
  // Anúncio único para leitor de tela; o tempo correndo não é anunciado a cada segundo.
  const live = <span className={styles.srOnly} aria-live="polite">{ended ? 'Descanso encerrado' : ''}</span>;

  if (ended) {
    return (
      <section className={cx(styles.bar, styles.ended)} aria-label="Descanso">
        {live}
        <span className={styles.overtime}>
          <span className={styles.srOnly}>Tempo extra </span>+{formatClock(status.overtime)}
        </span>
        <span className={styles.endedText}>
          <span className={styles.endedTitle}>Descanso encerrado</span>
          {next && <span className={styles.endedNext}>{`Próxima: ${next.exercise}, ${next.set}${next.load ? `, ${next.load}` : ''}`}</span>}
        </span>
        <Button variant="secondary" className={styles.small} onClick={onSkip}>Fechar</Button>
      </section>
    );
  }

  if (open) {
    return (
      <section className={styles.panel} aria-label="Descanso">
        {live}
        <IconButton
          variant="plain"
          className={styles.handle}
          aria-label="Recolher descanso"
          aria-expanded="true"
          icon={<ChevronDown size={20} />}
          onClick={onCollapse}
        />
        <div className={styles.top}>
          <div className={styles.block}>
            <span className={styles.label}>Descanso</span>
            <span className={styles.timeLg}>{formatClock(status.remaining)}</span>
          </div>
          {next && (
            <div className={cx(styles.block, styles.right)}>
              <span className={styles.label}>Próxima série</span>
              {next.load && <span className={styles.load}>{next.load}</span>}
              <span className={styles.nextName}>{`${next.exercise}, ${next.set}`}</span>
            </div>
          )}
        </div>
        <p className={styles.caption}>
          {exercise
            ? `${exercise}, descanso de ${formatClock(status.total)}`
            : `Descanso de ${formatClock(status.total)}`}
        </p>
        <Segments total={SEGMENTS} filled={filled} mode="countdown" label={segmentsLabel} />
        <div className={styles.actions}>
          <Button variant="secondary" onClick={() => onAdjust(-30)} aria-label="Tirar 30 segundos">−30 s</Button>
          <Button variant="secondary" onClick={() => onAdjust(30)} aria-label="Somar 30 segundos">+30 s</Button>
          <Button variant="primary" onClick={onSkip}>Pular descanso</Button>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.bar} aria-label="Descanso">
      {live}
      <button
        type="button"
        className={styles.main}
        aria-expanded="false"
        aria-label={`Abrir descanso, ${formatClock(status.remaining)} restantes`}
        onClick={onOpen}
      >
        <span className={styles.time} aria-hidden="true">{formatClock(status.remaining)}</span>
        <Segments total={SEGMENTS} filled={filled} mode="countdown" label={segmentsLabel} className={styles.segments} />
      </button>
      <Button variant="secondary" className={styles.small} onClick={() => onAdjust(30)} aria-label="Somar 30 segundos">+30 s</Button>
      <Button variant="secondary" className={styles.small} onClick={onSkip}>Pular</Button>
    </section>
  );
}
