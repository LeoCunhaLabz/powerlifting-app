import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { 
  AppState, 
  WorkoutSession, 
  WorkoutTemplate, 
  Settings, 
  ExerciseState, 
  SetState,
  BodyweightEntry,
  SyncStatus,
  Program,
  WeekOverride,
} from '@powerlifting/shared';
import { calculateE1RM, DEFAULT_PLATES_KG, getEffectiveBodyweight } from '../utils/powerlifting';
import { isValidImportedState } from '../utils/validateAppState';
import { useSyncManager } from '../hooks/useSyncManager';

interface WorkoutContextType {
  state: AppState;
  activeWorkout: WorkoutSession | null;
  startWorkout: (templateId?: string) => void;
  repeatWorkout: (session: WorkoutSession) => void;
  cancelWorkout: () => void;
  completeActiveWorkout: () => void;
  addExerciseToActiveWorkout: (name: string) => void;
  removeExerciseFromActiveWorkout: (index: number) => void;
  addSetToExercise: (exerciseIndex: number) => void;
  removeSetFromExercise: (exerciseIndex: number, setIndex: number) => void;
  updateSet: (exerciseIndex: number, setIndex: number, fields: Partial<SetState>) => void;
  updateWorkoutNotes: (notes: string) => void;
  saveTemplate: (template: Omit<WorkoutTemplate, 'id'> & { id?: string }) => void;
  deleteTemplate: (templateId: string) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  getMaxE1RM: (exerciseName: string) => number;
  exportData: () => string;
  importData: (jsonData: string) => boolean;
  restTimerDuration: number;
  setRestTimerDuration: (duration: number) => void;
  restTimerEnd: number | null;
  startRestTimer: (seconds: number) => void;
  stopRestTimer: () => void;
  logBodyweight: (weight: number, date?: string) => void;
  deleteBodyweightEntry: (date: string) => void;
  getBodyweightAt: (date: string | number | Date) => number;
  saveError: string | null;
  dismissSaveError: () => void;
  syncStatus: SyncStatus;
  /** Baixa dados do servidor e faz merge com o estado local (útil para refresh manual). */
  pullFromServer: () => Promise<void>;
  /** Cria ou atualiza um programa. */
  saveProgram: (program: Omit<Program, 'id' | 'createdAt'> & { id?: string }) => void;
  /** Remove um programa pelo id. */
  deleteProgram: (programId: string) => void;
  /** Retorna o próximo template a treinar com base no programa ativo + histórico.
   *  Fallback: primeiro template customizado, depois primeiro built-in. */
  getNextTemplate: () => WorkoutTemplate | undefined;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

// Built-in Templates
const BUILT_IN_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'built-in-lp-beginner',
    name: 'Iniciante LP (Treino A)',
    description: 'Progressão linear clássica focada em força base para atletas iniciantes. Execute 3 vezes por semana alternando com Treino B.',
    isBuiltIn: true,
    exercises: [
      {
        name: 'Agachamento',
        sets: [
          { reps: 5, type: 'W', weightPercentage: 50 },
          { reps: 5, type: 'W', weightPercentage: 70 },
          { reps: 5, type: 'N', weightPercentage: 100 },
          { reps: 5, type: 'N', weightPercentage: 100 },
          { reps: 5, type: 'N', weightPercentage: 100 }
        ]
      },
      {
        name: 'Supino Reto',
        sets: [
          { reps: 5, type: 'W', weightPercentage: 50 },
          { reps: 5, type: 'W', weightPercentage: 70 },
          { reps: 5, type: 'N', weightPercentage: 100 },
          { reps: 5, type: 'N', weightPercentage: 100 },
          { reps: 5, type: 'N', weightPercentage: 100 }
        ]
      },
      {
        name: 'Levantamento Terra',
        sets: [
          { reps: 5, type: 'W', weightPercentage: 60 },
          { reps: 5, type: 'W', weightPercentage: 80 },
          { reps: 5, type: 'N', weightPercentage: 100 }
        ]
      }
    ]
  },
  {
    id: 'built-in-madcow-5x5',
    name: 'Madcow 5x5 - Segunda-Feira',
    description: 'Foco em construir volume com rampas de peso progressivas até a série mais pesada de 5 repetições (100% da meta semanal).',
    isBuiltIn: true,
    exercises: [
      {
        name: 'Agachamento',
        sets: [
          { reps: 5, type: 'N', weightPercentage: 50 },
          { reps: 5, type: 'N', weightPercentage: 62.5 },
          { reps: 5, type: 'N', weightPercentage: 75 },
          { reps: 5, type: 'N', weightPercentage: 87.5 },
          { reps: 5, type: 'N', weightPercentage: 100 }
        ]
      },
      {
        name: 'Supino Reto',
        sets: [
          { reps: 5, type: 'N', weightPercentage: 50 },
          { reps: 5, type: 'N', weightPercentage: 62.5 },
          { reps: 5, type: 'N', weightPercentage: 75 },
          { reps: 5, type: 'N', weightPercentage: 87.5 },
          { reps: 5, type: 'N', weightPercentage: 100 }
        ]
      },
      {
        name: 'Remada Curvada',
        sets: [
          { reps: 5, type: 'N', weightPercentage: 50 },
          { reps: 5, type: 'N', weightPercentage: 62.5 },
          { reps: 5, type: 'N', weightPercentage: 75 },
          { reps: 5, type: 'N', weightPercentage: 87.5 },
          { reps: 5, type: 'N', weightPercentage: 100 }
        ]
      }
    ]
  },
  {
    id: 'built-in-wendler-531',
    name: 'Jim Wendler 5/3/1 - Supino (Semana 1)',
    description: 'Semana 1 (Série de 5 repetições) do ciclo clássico de força. Última série de Supino é AMRAP (máximas repetições possíveis).',
    isBuiltIn: true,
    exercises: [
      {
        name: 'Supino Reto',
        sets: [
          { reps: 5, type: 'W', weightPercentage: 40 },
          { reps: 5, type: 'W', weightPercentage: 50 },
          { reps: 5, type: 'W', weightPercentage: 60 },
          { reps: 5, type: 'N', weightPercentage: 65 },
          { reps: 5, type: 'N', weightPercentage: 75 },
          { reps: 5, type: 'N', weightPercentage: 85 } // AMRAP
        ]
      },
      {
        name: 'Desenvolvimento Militar',
        sets: [
          { reps: 10, type: 'N', weightPercentage: 60 },
          { reps: 10, type: 'N', weightPercentage: 60 },
          { reps: 10, type: 'N', weightPercentage: 60 }
        ]
      },
      {
        name: 'Barra Fixa',
        sets: [
          { reps: 8, type: 'N', weightPercentage: 70 },
          { reps: 8, type: 'N', weightPercentage: 70 },
          { reps: 8, type: 'N', weightPercentage: 70 }
        ]
      }
    ]
  }
];

const DEFAULT_SETTINGS: Settings = {
  units: 'kg',
  barWeight: 20,
  availablePlates: DEFAULT_PLATES_KG,
  bodyweight: 80,
  gender: 'male',
  isEquipped: false,
  theme: 'brass'
};

const DEFAULT_STATE: AppState = {
  history: [],
  templates: BUILT_IN_TEMPLATES,
  settings: DEFAULT_SETTINGS,
  bodyweightLog: [],
  programs: [],
};

// ---------------------------------------------------------------------------
// Helper de merge puro — reutilizado em pullFromServer e no pull inicial de boot
// Regras:
//   - Workouts:  servidor vence para IDs existentes; locais-only são preservados
//   - Templates: servidor vence para IDs já sincronizados (syncedAt definido);
//               templates locais PENDENTES (sem syncedAt) são preservados para
//               evitar perda antes do push terminar; built-ins nunca são substituídos
// ---------------------------------------------------------------------------
// Helper puro: índice da semana atual (0-based) a partir da data de início
// e do número de semanas do mesociclo (ciclo volta ao 0 após weekCount semanas).
// ---------------------------------------------------------------------------
function currentWeekIndex(startDate: string, weekCount: number): number {
  const start = new Date(startDate + 'T00:00:00');
  const now = new Date();
  const elapsed = Math.max(0, Math.floor((now.getTime() - start.getTime()) / (7 * 24 * 3600 * 1000)));
  return weekCount > 0 ? elapsed % weekCount : 0;
}

// ---------------------------------------------------------------------------
function mergePullResult(
  prev: AppState,
  result: { workouts: WorkoutSession[]; templates: WorkoutTemplate[] },
  now: string,
): AppState {
  // Workouts
  const serverWorkoutIds = new Set(result.workouts.map(w => w.id));
  const localWorkoutsOnly = prev.history.filter(h => !serverWorkoutIds.has(h.id));
  const mergedHistory = [
    ...result.workouts.map(w => ({ ...w, syncedAt: now })),
    ...localWorkoutsOnly,
  ];

  // Templates
  const localCustomMap = new Map(
    prev.templates.filter(t => !t.isBuiltIn).map(t => [t.id, t]),
  );
  const builtIns = prev.templates.filter(t => t.isBuiltIn);
  const serverTplIds = new Set(result.templates.map(t => t.id));

  const mergedTemplates = [
    ...builtIns,
    ...result.templates.map(t => {
      const local = localCustomMap.get(t.id);
      // Preservar versão local quando pendente (editada mas ainda não enviada)
      if (local && !local.syncedAt) return local;
      return { ...t, syncedAt: now };
    }),
    // Locais custom sem correspondência no servidor (novos, ainda não sincronizados)
    ...prev.templates.filter(t => !t.isBuiltIn && !serverTplIds.has(t.id)),
  ];

  return { ...prev, history: mergedHistory, templates: mergedTemplates };
}

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load State from LocalStorage
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem('powerlifting_app_state');
      if (saved) {
        const parsed = JSON.parse(saved) as AppState;
        // Merge with built-in templates to make sure they are always present or updated
        const customTemplates = parsed.templates?.filter(t => !t.isBuiltIn) || [];
        parsed.templates = [...BUILT_IN_TEMPLATES, ...customTemplates];
        parsed.settings = { ...DEFAULT_SETTINGS, ...parsed.settings };
        parsed.bodyweightLog = parsed.bodyweightLog || [];
        parsed.programs = (parsed as AppState).programs || [];
        return parsed;
      }
    } catch (e) {
      console.error('Failed to load app state from localStorage:', e);
    }
    return DEFAULT_STATE;
  });

  // Active Workout session state
  const [activeWorkout, setActiveWorkout] = useState<WorkoutSession | null>(() => {
    try {
      const saved = localStorage.getItem('powerlifting_active_workout');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load active workout from localStorage:', e);
    }
    return null;
  });

  // Rest Timer State
  const [restTimerDuration, setRestTimerDuration] = useState(120); // 2 minutes default
  const [restTimerEnd, setRestTimerEnd] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem('powerlifting_rest_timer_end');
      return saved ? parseInt(saved, 10) : null;
    } catch (e) {
      console.error('Failed to load rest timer from localStorage:', e);
    }
    return null;
  });

  // Sinaliza falha ao persistir no localStorage (cota cheia, modo privado, indisponivel)
  const [saveError, setSaveError] = useState<string | null>(null);
  const dismissSaveError = useCallback(() => setSaveError(null), []);

  // --- Sync Manager ---
  const onSyncComplete = useCallback(
    (result: { workouts: WorkoutSession[]; templates: WorkoutTemplate[] }) => {
      const now = new Date().toISOString();
      setState(prev => ({
        ...prev,
        history: prev.history.map(s => {
          const matched = result.workouts.find(w => w.id === s.id);
          return matched ? { ...s, syncedAt: now } : s;
        }),
        templates: prev.templates.map(t => {
          const matched = result.templates.find(w => w.id === t.id);
          return matched ? { ...t, syncedAt: now } : t;
        }),
      }));
    },
    [],
  );

  const { syncStatus, triggerSync, pullFromServer: syncPull } = useSyncManager({ onSyncComplete });

  // Faz pull do servidor e merge com estado local (reutiliza mergePullResult)
  const pullFromServer = useCallback(async () => {
    const result = await syncPull();
    if (!result) return;
    const now = new Date().toISOString();
    setState(prev => mergePullResult(prev, result, now));
  }, [syncPull]);

  // Pull inicial ao montar (= usuário acabou de autenticar)
  useEffect(() => {
    let cancelled = false;
    syncPull().then(result => {
      if (!result || cancelled) return;
      const now = new Date().toISOString();
      setState(prev => mergePullResult(prev, result, now));
    });
    return () => { cancelled = true; };
  // Roda apenas uma vez ao montar
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Detecta itens sem syncedAt e dispara push automaticamente (built-ins excluídos)
  useEffect(() => {
    const customTemplates = state.templates.filter(t => !t.isBuiltIn);
    const hasPending =
      state.history.some(s => !s.syncedAt) ||
      customTemplates.some(t => !t.syncedAt);
    if (hasPending) {
      triggerSync({ workouts: state.history, templates: customTemplates });
    }
  // triggerSync é estável (useCallback com deps [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.history, state.templates]);

  // Escreve no localStorage com tratamento de erro: limpa o aviso no sucesso,
  // sinaliza ao usuario no caso de falha em vez de quebrar/perder dados em silencio.
  // Obs.: o setSaveError no sucesso usa update funcional que faz bail-out quando ja
  // esta null, entao nao ha render em cascata (o lint set-state-in-effect e falso-positivo aqui).
  const safeSetItem = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
      setSaveError(prev => (prev === null ? prev : null));
    } catch (e) {
      console.error(`Failed to save "${key}" to localStorage:`, e);
      setSaveError('Não foi possível salvar localmente. O armazenamento pode estar cheio ou indisponível.');
    }
  };

  // Sync state to local storage on change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- ver safeSetItem (bail-out no sucesso)
    safeSetItem('powerlifting_app_state', JSON.stringify(state));
  }, [state]);

  // Aplica o tema de acento no documento (lido pelo CSS via [data-theme])
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.settings.theme);
  }, [state.settings.theme]);

  // Sync active workout to local storage on change
  useEffect(() => {
    if (activeWorkout) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- ver safeSetItem (bail-out no sucesso)
      safeSetItem('powerlifting_active_workout', JSON.stringify(activeWorkout));
    } else {
      try { localStorage.removeItem('powerlifting_active_workout'); } catch { /* SecurityError: falha silenciosa */ }
    }
  }, [activeWorkout]);

  // Sync rest timer target time to local storage
  useEffect(() => {
    if (restTimerEnd !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- ver safeSetItem (bail-out no sucesso)
      safeSetItem('powerlifting_rest_timer_end', restTimerEnd.toString());
    } else {
      try { localStorage.removeItem('powerlifting_rest_timer_end'); } catch { /* SecurityError: falha silenciosa */ }
    }
  }, [restTimerEnd]);

  // Rest Timer Functions — definidas antes das funcoes que as referenciam nos deps
  const stopRestTimer = useCallback(() => {
    setRestTimerEnd(null);
  }, []);

  const startRestTimer = useCallback((seconds: number) => {
    const endTime = Date.now() + seconds * 1000;
    setRestTimerEnd(endTime);
  }, []);

  // Helper: Find absolute max e1RM for an exercise from history
  const getMaxE1RM = useCallback((exerciseName: string): number => {
    let max = 0;
    const lowerName = exerciseName.toLowerCase();
    
    state.history.forEach(session => {
      session.exercises.forEach(ex => {
        if (ex.name.toLowerCase() === lowerName) {
          ex.sets.forEach(set => {
            if (set.completed && set.weight && set.reps) {
              const e1rm = calculateE1RM(set.weight, set.reps, set.rpe);
              if (e1rm > max) max = e1rm;
            }
          });
        }
      });
    });

    // Fallback defaults if no history exists (realistic values for beginner lifter)
    if (max === 0) {
      if (lowerName.includes('agachamento') || lowerName.includes('squat')) return state.settings.units === 'kg' ? 100 : 225;
      if (lowerName.includes('supino') || lowerName.includes('bench')) return state.settings.units === 'kg' ? 80 : 175;
      if (lowerName.includes('terra') || lowerName.includes('deadlift')) return state.settings.units === 'kg' ? 120 : 265;
      if (lowerName.includes('desenvolvimento') || lowerName.includes('press')) return state.settings.units === 'kg' ? 50 : 110;
      return state.settings.units === 'kg' ? 60 : 135; // Default for accessories
    }

    return max;
  }, [state]);

  // Start a new workout session
  const startWorkout = useCallback((templateId?: string) => {
    let sessionName = 'Treino Avulso';
    let exercises: ExerciseState[] = [];

    if (templateId) {
      const template = state.templates.find(t => t.id === templateId);
      if (template) {
        sessionName = template.name;
        exercises = template.exercises.map((ex, exIdx) => {
          // Pre-fill weights based on percentage of 1RM
          const maxE1RM = getMaxE1RM(ex.name);
          return {
            id: `ex-${exIdx}-${Date.now()}`,
            name: ex.name,
            sets: ex.sets.map((set, setIdx) => {
              let calculatedWeight = 0;
              if (set.weightPercentage) {
                // Calculate weight using percentage of 1RM
                calculatedWeight = (maxE1RM * set.weightPercentage) / 100;
                // Round to nearest 2.5 kg/lbs
                calculatedWeight = Math.round(calculatedWeight / 2.5) * 2.5;
              }
              return {
                id: `set-${exIdx}-${setIdx}-${Date.now()}`,
                weight: calculatedWeight,
                reps: set.reps,
                rpe: set.rpe,
                completed: false,
                type: set.type,
                percentage: set.weightPercentage
              };
            })
          };
        });

        // Fallback: exercícios sem %1RM — pré-preenche com o peso da última sessão
        exercises = exercises.map((ex) => {
          const hasWeightFromPct = ex.sets.some(s => s.weight > 0);
          if (hasWeightFromPct) return ex;
          const lastSession = [...state.history]
            .sort((a, b) => b.date.localeCompare(a.date))
            .find(s => s.exercises.some(e => e.name.toLowerCase() === ex.name.toLowerCase()));
          if (!lastSession) return ex;
          const prevEx = lastSession.exercises.find(e => e.name.toLowerCase() === ex.name.toLowerCase());
          if (!prevEx) return ex;
          return {
            ...ex,
            sets: ex.sets.map((set, setIdx) => {
              const prevSet = prevEx.sets[setIdx] ?? prevEx.sets[prevEx.sets.length - 1];
              return prevSet?.weight > 0 ? { ...set, weight: prevSet.weight } : set;
            }),
          };
        });

        // Aplicar sobrescritas de periodização semanal (se o programa ativo tiver overrides)
        const activeProgram = state.programs.find(p => p.isActive);
        if (activeProgram?.weekOverrides?.length && activeProgram.templateIds.includes(templateId)) {
          const startDate = activeProgram.startDate ?? activeProgram.createdAt.slice(0, 10);
          const weekIdx = currentWeekIndex(startDate, activeProgram.weekCount ?? 1);
          exercises = exercises.map(ex => {
            const ov: WeekOverride | undefined = activeProgram.weekOverrides!.find(
              o => o.weekIndex === weekIdx && o.exerciseName === ex.name
            );
            if (!ov) return ex;
            const baseSets = ex.sets.slice(0, ov.sets ?? ex.sets.length);
            const maxE1RM = getMaxE1RM(ex.name);
            return {
              ...ex,
              sets: baseSets.map((set, setIdx) => {
                const ovPct = ov.weightPercentage;
                const ovWeight = ovPct
                  ? Math.round((maxE1RM * ovPct / 100) / 2.5) * 2.5
                  : set.weight;
                return {
                  ...set,
                  id: `set-${ex.id}-${setIdx}-${Date.now()}`,
                  reps: ov.reps ?? set.reps,
                  weight: ovWeight,
                  rpe: ov.rpe ?? set.rpe,
                  percentage: ovPct ?? set.percentage,
                };
              }),
            };
          });
        }
      }
    }

    const newSession: WorkoutSession = {
      id: `session-${Date.now()}`,
      name: sessionName,
      date: new Date().toISOString(),
      duration: 0,
      exercises,
      notes: '',
      templateId: templateId,
    };

    setActiveWorkout(newSession);
  }, [state, getMaxE1RM]);

  // Repetir um treino anterior: novo ID, nova data, mesmos exercicios/pesos, series resetadas
  const repeatWorkout = useCallback((session: WorkoutSession) => {
    const newSession: WorkoutSession = {
      id: `session-${Date.now()}`,
      name: session.name,
      date: new Date().toISOString(),
      duration: 0,
      notes: '',
      exercises: session.exercises.map((ex, exIdx) => ({
        ...ex,
        id: `ex-${exIdx}-${Date.now()}`,
        sets: ex.sets.map((set, setIdx) => ({
          ...set,
          id: `set-${exIdx}-${setIdx}-${Date.now()}`,
          completed: false,
          isPr: undefined,
        })),
      })),
    };
    setActiveWorkout(newSession);
  }, []);

  // Cancel active workout
  const cancelWorkout = useCallback(() => {
    setActiveWorkout(null);
    stopRestTimer();
  }, [stopRestTimer]);

  // Complete and save active workout
  const completeActiveWorkout = useCallback(() => {
    if (!activeWorkout) return;

    // Filter out exercises with no completed sets, or sets that aren't marked completed
    const finalizedExercises = activeWorkout.exercises
      .map(ex => {
        const completedSets = ex.sets.filter(s => s.completed);
        return {
          ...ex,
          sets: completedSets
        };
      })
      .filter(ex => ex.sets.length > 0);

    if (finalizedExercises.length === 0) {
      // If nothing was completed, just cancel
      setActiveWorkout(null);
      return;
    }

    // Determine duration
    const startTime = new Date(activeWorkout.date).getTime();
    const duration = Math.round((Date.now() - startTime) / 1000);

    const completedSession: WorkoutSession = {
      ...activeWorkout,
      exercises: finalizedExercises,
      duration: duration > 0 ? duration : 60, // Minimum 1 minute
      date: new Date().toISOString() // Set completion date/time
    };

    // Check for Personal Records (PRs) in the new workout
    // A PR is when a completed set's e1RM is higher than any previously completed set's e1RM
    // We calculate this by checking previous history (before adding this session)
    completedSession.exercises.forEach(ex => {
      const lowerName = ex.name.toLowerCase();
      // Get historical max e1RM *before* this workout
      let historicalMax = 0;
      state.history.forEach(session => {
        session.exercises.forEach(oldEx => {
          if (oldEx.name.toLowerCase() === lowerName) {
            oldEx.sets.forEach(oldSet => {
              if (oldSet.completed) {
                const e1rm = calculateE1RM(oldSet.weight, oldSet.reps, oldSet.rpe);
                if (e1rm > historicalMax) historicalMax = e1rm;
              }
            });
          }
        });
      });

      // Mark the set(s) that exceed this historical max as PR
      let sessionMaxE1RM = 0;
      let prSetIdx = -1;

      ex.sets.forEach((set, idx) => {
        const currentE1RM = calculateE1RM(set.weight, set.reps, set.rpe);
        if (currentE1RM > sessionMaxE1RM) {
          sessionMaxE1RM = currentE1RM;
          prSetIdx = idx;
        }
      });

      // If the best e1RM of this session beats historical max, mark it as PR
      if (sessionMaxE1RM > historicalMax && prSetIdx !== -1) {
        ex.sets[prSetIdx].isPr = true;
      }
    });

    setState(prev => ({
      ...prev,
      history: [completedSession, ...prev.history] // Newest first
    }));

    setActiveWorkout(null);
    stopRestTimer();
  }, [activeWorkout, state, stopRestTimer]);

  // Add exercise to active workout
  const addExerciseToActiveWorkout = useCallback((name: string) => {
    if (!activeWorkout) return;

    const newExercise: ExerciseState = {
      id: `ex-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name,
      sets: [
        {
          id: `set-${Date.now()}-0`,
          weight: 0,
          reps: 5,
          completed: false,
          type: 'N'
        }
      ]
    };

    setActiveWorkout(prev => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: [...prev.exercises, newExercise]
      };
    });
  }, [activeWorkout]);

  // Remove exercise from active workout
  const removeExerciseFromActiveWorkout = useCallback((index: number) => {
    if (!activeWorkout) return;
    setActiveWorkout(prev => {
      if (!prev) return null;
      const newExercises = [...prev.exercises];
      newExercises.splice(index, 1);
      return {
        ...prev,
        exercises: newExercises
      };
    });
  }, [activeWorkout]);

  // Add set to exercise in active workout
  const addSetToExercise = useCallback((exerciseIndex: number) => {
    if (!activeWorkout) return;

    setActiveWorkout(prev => {
      if (!prev) return null;
      const newExercises = [...prev.exercises];
      const targetEx = newExercises[exerciseIndex];
      
      // Copy last set values as default
      const lastSet = targetEx.sets[targetEx.sets.length - 1];
      const newSet: SetState = {
        id: `set-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        weight: lastSet ? lastSet.weight : 0,
        reps: lastSet ? lastSet.reps : 5,
        rpe: lastSet ? lastSet.rpe : undefined,
        rir: lastSet ? lastSet.rir : undefined,
        completed: false,
        type: lastSet ? lastSet.type : 'N'
      };

      targetEx.sets = [...targetEx.sets, newSet];
      return {
        ...prev,
        exercises: newExercises
      };
    });
  }, [activeWorkout]);

  // Remove set from exercise in active workout
  const removeSetFromExercise = useCallback((exerciseIndex: number, setIndex: number) => {
    if (!activeWorkout) return;

    setActiveWorkout(prev => {
      if (!prev) return null;
      const newExercises = [...prev.exercises];
      const targetEx = newExercises[exerciseIndex];
      targetEx.sets = targetEx.sets.filter((_, idx) => idx !== setIndex);
      return {
        ...prev,
        exercises: newExercises
      };
    });
  }, [activeWorkout]);

  // Update specific set in active workout
  const updateSet = useCallback((exerciseIndex: number, setIndex: number, fields: Partial<SetState>) => {
    if (!activeWorkout) return;

    setActiveWorkout(prev => {
      if (!prev) return null;
      const newExercises = [...prev.exercises];
      const targetEx = newExercises[exerciseIndex];
      const targetSet = targetEx.sets[setIndex];
      
      const wasCompleted = targetSet.completed;
      const isNowCompleted = fields.completed !== undefined ? fields.completed : wasCompleted;

      targetEx.sets[setIndex] = {
        ...targetSet,
        ...fields
      };

      // Trigger Rest Timer when a set is completed
      if (!wasCompleted && isNowCompleted) {
        startRestTimer(restTimerDuration);
      }

      return {
        ...prev,
        exercises: newExercises
      };
    });
  }, [activeWorkout, startRestTimer, restTimerDuration]);

  // Update notes of the active workout session
  const updateWorkoutNotes = useCallback((notes: string) => {
    if (!activeWorkout) return;
    setActiveWorkout(prev => prev ? { ...prev, notes } : null);
  }, [activeWorkout]);

  // Save/Create a workout template
  const saveTemplate = useCallback((templateData: Omit<WorkoutTemplate, 'id'> & { id?: string }) => {
    setState(prev => {
      const existingIndex = templateData.id ? prev.templates.findIndex(t => t.id === templateData.id) : -1;
      const updatedTemplates = [...prev.templates];

      const template: WorkoutTemplate = {
        id: templateData.id || `template-${Date.now()}`,
        name: templateData.name,
        description: templateData.description,
        exercises: templateData.exercises,
        isBuiltIn: false,
        updatedAt: new Date().toISOString(),
        // syncedAt intencionalmente omitido — marca como pendente de sync
      };

      if (existingIndex > -1) {
        updatedTemplates[existingIndex] = template;
      } else {
        updatedTemplates.push(template);
      }

      return {
        ...prev,
        templates: updatedTemplates
      };
    });
  }, []);

  // Delete a template
  const deleteTemplate = useCallback((templateId: string) => {
    setState(prev => ({
      ...prev,
      templates: prev.templates.filter(t => t.id !== templateId || t.isBuiltIn) // Cannot delete built-ins
    }));
  }, []);

  // Update user configurations
  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    setState(prev => {
      const mergedSettings = { ...prev.settings, ...newSettings };
      
      // If units changed, adjust bar weight and plates accordingly
      if (newSettings.units && newSettings.units !== prev.settings.units) {
        if (newSettings.units === 'lbs') {
          mergedSettings.barWeight = 45;
          mergedSettings.availablePlates = [55, 45, 35, 25, 10, 5, 2.5];
        } else {
          mergedSettings.barWeight = 20;
          mergedSettings.availablePlates = [25, 20, 15, 10, 5, 2.5, 1.25, 0.5, 0.25];
        }
      }

      // Bounds: barra e peso corporal devem ser > 0; anilhas: array nao-vazio com valores > 0.
      // Revert para o valor anterior quando o novo valor for invalido.
      if (newSettings.barWeight !== undefined && mergedSettings.barWeight <= 0) {
        mergedSettings.barWeight = prev.settings.barWeight;
      }
      if (newSettings.bodyweight !== undefined && mergedSettings.bodyweight <= 0) {
        mergedSettings.bodyweight = prev.settings.bodyweight;
      }
      if (newSettings.availablePlates !== undefined) {
        const validPlates = mergedSettings.availablePlates.filter(p => p > 0);
        mergedSettings.availablePlates = validPlates.length > 0 ? validPlates : prev.settings.availablePlates;
      }

      return {
        ...prev,
        settings: mergedSettings
      };
    });
  }, []);

  // Export entire state to stringified JSON
  const exportData = useCallback((): string => {
    return JSON.stringify(state, null, 2);
  }, [state]);

  // Import JSON string back into state
  const importData = useCallback((jsonData: string): boolean => {
    try {
      const parsed: unknown = JSON.parse(jsonData);
      if (!isValidImportedState(parsed)) {
        return false;
      }
      const customTemplates = parsed.templates.filter((t) => !t.isBuiltIn);
      const normalized: AppState = {
        ...parsed,
        templates: [...BUILT_IN_TEMPLATES, ...customTemplates],
        settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
        bodyweightLog: parsed.bodyweightLog ?? [],
        programs: (parsed as AppState).programs ?? [],
      };
      setState(normalized);
      return true;
    } catch (e) {
      console.error('Import failed:', e);
    }
    return false;
  }, []);

  // Bodyweight log
  const logBodyweight = useCallback((weight: number, date?: string) => {
    if (!weight || weight <= 0) return;
    const iso = date || new Date().toISOString();
    const dayKey = iso.slice(0, 10);
    setState(prev => {
      const log: BodyweightEntry[] = [
        ...prev.bodyweightLog.filter(e => e.date.slice(0, 10) !== dayKey),
        { date: iso, weight },
      ].sort((a, b) => a.date.localeCompare(b.date));
      const latest = log[log.length - 1];
      return {
        ...prev,
        bodyweightLog: log,
        settings: { ...prev.settings, bodyweight: latest ? latest.weight : prev.settings.bodyweight },
      };
    });
  }, []);

  const deleteBodyweightEntry = useCallback((date: string) => {
    setState(prev => {
      const log = prev.bodyweightLog.filter(e => e.date !== date);
      const latest = log[log.length - 1];
      return {
        ...prev,
        bodyweightLog: log,
        settings: { ...prev.settings, bodyweight: latest ? latest.weight : prev.settings.bodyweight },
      };
    });
  }, []);

  const getBodyweightAt = useCallback((date: string | number | Date): number =>
    getEffectiveBodyweight(state.bodyweightLog, date, state.settings.bodyweight)
  , [state.bodyweightLog, state.settings.bodyweight]);

  // ---- Programs ----

  const saveProgram = useCallback((programData: Omit<Program, 'id' | 'createdAt'> & { id?: string }) => {
    setState(prev => {
      const existingIndex = programData.id ? prev.programs.findIndex(p => p.id === programData.id) : -1;
      const updatedPrograms = [...prev.programs];
      // Se o novo programa for marcado como ativo, desativa os demais
      const deactivated = programData.isActive
        ? updatedPrograms.map(p => ({ ...p, isActive: false }))
        : [...updatedPrograms];
      const program: Program = {
        id: programData.id || `program-${Date.now()}`,
        name: programData.name,
        description: programData.description,
        templateIds: programData.templateIds,
        isActive: programData.isActive,
        startDate: programData.startDate,
        trainingDays: programData.trainingDays,
        weekCount: programData.weekCount,
        weekOverrides: programData.weekOverrides,
        createdAt: existingIndex > -1 ? prev.programs[existingIndex].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (existingIndex > -1) {
        deactivated[existingIndex] = program;
      } else {
        deactivated.push(program);
      }
      return { ...prev, programs: deactivated };
    });
  }, []);

  const deleteProgram = useCallback((programId: string) => {
    setState(prev => ({
      ...prev,
      programs: prev.programs.filter(p => p.id !== programId),
    }));
  }, []);

  /** Próximo template baseado no programa ativo + histórico de sessões. */
  const getNextTemplate = useCallback((): WorkoutTemplate | undefined => {
    const activeProgram = state.programs.find(p => p.isActive);
    if (activeProgram && activeProgram.templateIds.length > 0) {
      const { templateIds } = activeProgram;
      // Encontra o índice do último template executado que pertence ao programa
      const sorted = [...state.history].sort((a, b) => b.date.localeCompare(a.date));
      const lastMatch = sorted.find(s => s.templateId && templateIds.includes(s.templateId));
      if (lastMatch && lastMatch.templateId) {
        const lastIdx = templateIds.indexOf(lastMatch.templateId);
        const nextIdx = (lastIdx + 1) % templateIds.length;
        const nextId = templateIds[nextIdx];
        const next = state.templates.find(t => t.id === nextId);
        if (next) return next;
      }
      // Nenhum treino do programa ainda — retorna o primeiro da sequência
      const first = state.templates.find(t => t.id === templateIds[0]);
      if (first) return first;
    }
    // Fallback: primeiro template customizado, depois qualquer template
    return state.templates.find(t => !t.isBuiltIn) ?? state.templates[0];
  }, [state.programs, state.history, state.templates]);

  // Rest Timer Functions (startRestTimer/stopRestTimer definidos acima)
  return (
    <WorkoutContext.Provider value={useMemo(() => ({
      state,
      activeWorkout,
      startWorkout,
      repeatWorkout,
      cancelWorkout,
      completeActiveWorkout,
      addExerciseToActiveWorkout,
      removeExerciseFromActiveWorkout,
      addSetToExercise,
      removeSetFromExercise,
      updateSet,
      updateWorkoutNotes,
      saveTemplate,
      deleteTemplate,
      updateSettings,
      getMaxE1RM,
      exportData,
      importData,
      restTimerDuration,
      setRestTimerDuration,
      restTimerEnd,
      startRestTimer,
      stopRestTimer,
      logBodyweight,
      deleteBodyweightEntry,
      getBodyweightAt,
      saveError,
      dismissSaveError,
      syncStatus,
      pullFromServer,
      saveProgram,
      deleteProgram,
      getNextTemplate,
    }), [
      state, activeWorkout, startWorkout, repeatWorkout, cancelWorkout, completeActiveWorkout,
      addExerciseToActiveWorkout, removeExerciseFromActiveWorkout, addSetToExercise,
      removeSetFromExercise, updateSet, updateWorkoutNotes, saveTemplate, deleteTemplate,
      updateSettings, getMaxE1RM, exportData, importData, restTimerDuration,
      restTimerEnd, startRestTimer, stopRestTimer, logBodyweight, deleteBodyweightEntry,
      getBodyweightAt, saveError, dismissSaveError, syncStatus, pullFromServer,
      saveProgram, deleteProgram, getNextTemplate,
    ])}>
      {children}
    </WorkoutContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
};
