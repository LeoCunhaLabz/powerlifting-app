import { useCallback, useState, type ReactNode } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { MaxesSheet } from '../components/workout/MaxesSheet/MaxesSheet';
import { exercisesNeedingMax } from '../utils/templateStart';

/**
 * Inicia uma rotina perguntando antes os máximos que faltam (#336): rotina por %1RM sem e1RM
 * no histórico abriria com as cargas em 0. Devolve `start` e a folha para renderizar.
 * `onStarted` roda depois que o treino começa (ex.: ir para a aba Treinar).
 */
export function useTemplateStart(onStarted: () => void): { start: (templateId: string) => void; sheet: ReactNode } {
  const { state, startWorkout, getMaxE1RM } = useWorkout();
  const [pending, setPending] = useState<{ templateId: string; names: string[] } | null>(null);

  const start = useCallback(
    (templateId: string) => {
      const template = state.templates.find((t) => t.id === templateId);
      const names = template ? exercisesNeedingMax(template, getMaxE1RM) : [];
      if (names.length > 0) {
        setPending({ templateId, names });
        return;
      }
      startWorkout(templateId);
      onStarted();
    },
    [state.templates, getMaxE1RM, startWorkout, onStarted],
  );

  const begin = (maxes?: Record<string, number>) => {
    if (!pending) return;
    startWorkout(pending.templateId, maxes);
    setPending(null);
    onStarted();
  };

  const sheet = pending ? (
    <MaxesSheet
      names={pending.names}
      unit={state.settings.units}
      onConfirm={begin}
      onSkip={() => begin()}
      onClose={() => setPending(null)}
    />
  ) : null;

  return { start, sheet };
}
