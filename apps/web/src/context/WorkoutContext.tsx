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
  CustomExercise,
} from '@powerlifting/shared';
import { calculateE1RM, DEFAULT_PLATES_KG, getEffectiveBodyweight } from '../utils/powerlifting';

/** Recalculates isPr flags for all sessions chronologically. */
function recalculatePRs(history: WorkoutSession[]): WorkoutSession[] {
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const result: WorkoutSession[] = [];
  for (const session of sorted) {
    const prev = result;
    const updatedExercises = session.exercises.map((ex) => {
      const lowerName = ex.name.toLowerCase();
      let historicalMax = 0;
      prev.forEach((ps) =>
        ps.exercises.forEach((pe) => {
          if (pe.name.toLowerCase() === lowerName) {
            pe.sets.forEach((ps2) => {
              if (ps2.completed) {
                const e = calculateE1RM(ps2.weight, ps2.reps, ps2.rpe);
                if (e > historicalMax) historicalMax = e;
              }
            });
          }
        })
      );
      let sessionMax = 0;
      let prIdx = -1;
      ex.sets.forEach((s, i) => {
        if (!s.completed) return;
        const e = calculateE1RM(s.weight, s.reps, s.rpe);
        if (e > sessionMax) { sessionMax = e; prIdx = i; }
      });
      const updatedSets = ex.sets.map((s, i) => ({
        ...s,
        isPr: i === prIdx && sessionMax > historicalMax ? true : undefined,
      }));
      return { ...ex, sets: updatedSets };
    });
    result.push({ ...session, exercises: updatedExercises });
  }
  return result;
}
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
  updateExerciseNotes: (exerciseIndex: number, notes: string) => void;
  saveTemplate: (template: Omit<WorkoutTemplate, 'id'> & { id?: string }) => void;
  deleteTemplate: (templateId: string) => void;
  archiveTemplate: (templateId: string) => void;
  unarchiveTemplate: (templateId: string) => void;
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
  /** Atualiza uma sessão do histórico (correção de dados) e recalcula PRs. */
  updateHistorySession: (session: WorkoutSession) => void;
  /** Remove uma sessão do histórico e recalcula PRs das demais. */
  deleteHistorySession: (sessionId: string) => void;
  /** Adiciona uma anilha customizada à lista (validação: > 0, sem duplicatas, ordena decrescente). */
  addCustomPlate: (weight: number) => void;
  /** Remove uma anilha customizada da lista. */
  removeCustomPlate: (weight: number) => void;
  /** Cria um exercício customizado (ignora vazio/duplicado por nome). Retorna o nome normalizado salvo. */
  addCustomExercise: (name: string) => string;
  /** Remove um exercício customizado pelo id. */
  removeCustomExercise: (id: string) => void;
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
  customPlates: [],
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
  customExercises: [],
};

const DEMO_ACCOUNT_EMAIL = 'leonardovalcesio@gmail.com';

const DEMO_TEMPLATE_IDS = {
  lowerStrength: 'demo-lower-strength',
  upperPower: 'demo-upper-power',
  deadliftTechnique: 'demo-deadlift-technique',
} as const;

function daysAgoIso(daysAgo: number, baseDate = new Date()): string {
  const date = new Date(baseDate);
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

function dayKeyDaysAgo(daysAgo: number, baseDate = new Date()): string {
  return daysAgoIso(daysAgo, baseDate).slice(0, 10);
}

function createDemoState(baseDate = new Date()): AppState {
  const demoTemplates: WorkoutTemplate[] = [
    {
      id: DEMO_TEMPLATE_IDS.lowerStrength,
      name: 'Lower Strength',
      description: 'Sessão de base para agachamento e terra com foco em volume controlado.',
      exercises: [
        {
          name: 'Agachamento',
          restSeconds: 180,
          sets: [
            { reps: 5, weightPercentage: 65, type: 'W' },
            { reps: 5, weightPercentage: 75, type: 'N' },
            { reps: 3, weightPercentage: 82.5, type: 'N' },
          ],
        },
        {
          name: 'Levantamento Terra',
          restSeconds: 210,
          sets: [
            { reps: 5, weightPercentage: 60, type: 'W' },
            { reps: 4, weightPercentage: 72.5, type: 'N' },
            { reps: 3, weightPercentage: 80, type: 'N' },
          ],
        },
        {
          name: 'Abdominal na Polia',
          restSeconds: 60,
          sets: [
            { reps: 12, type: 'N' },
            { reps: 12, type: 'N' },
          ],
        },
      ],
    },
    {
      id: DEMO_TEMPLATE_IDS.upperPower,
      name: 'Upper Power',
      description: 'Bloco de supino com remada e tríceps para dar contraste visual ao histórico.',
      exercises: [
        {
          name: 'Supino Reto',
          restSeconds: 180,
          sets: [
            { reps: 5, weightPercentage: 60, type: 'W' },
            { reps: 4, weightPercentage: 72.5, type: 'N' },
            { reps: 3, weightPercentage: 80, type: 'N' },
          ],
        },
        {
          name: 'Remada Curvada',
          restSeconds: 120,
          sets: [
            { reps: 8, type: 'N' },
            { reps: 8, type: 'N' },
            { reps: 8, type: 'N' },
          ],
        },
        {
          name: 'Tríceps na Polia',
          restSeconds: 75,
          sets: [
            { reps: 10, type: 'N' },
            { reps: 10, type: 'N' },
          ],
        },
      ],
    },
    {
      id: DEMO_TEMPLATE_IDS.deadliftTechnique,
      name: 'Deadlift Technique',
      description: 'Sessão curta para destacar terra, técnica e um pouco de acessórios.',
      exercises: [
        {
          name: 'Levantamento Terra',
          restSeconds: 210,
          sets: [
            { reps: 3, weightPercentage: 70, type: 'W' },
            { reps: 3, weightPercentage: 80, type: 'N' },
            { reps: 2, weightPercentage: 87.5, type: 'N' },
          ],
        },
        {
          name: 'Puxada na Barra',
          restSeconds: 90,
          sets: [
            { reps: 8, type: 'N' },
            { reps: 8, type: 'N' },
            { reps: 8, type: 'N' },
          ],
        },
      ],
    },
  ];

  const history: WorkoutSession[] = [
    {
      id: 'demo-session-4',
      name: 'Lower Strength - PR day',
      date: daysAgoIso(2, baseDate),
      duration: 4_260,
      templateId: DEMO_TEMPLATE_IDS.lowerStrength,
      notes: 'Sessão forte para mostrar PRs no histórico e no resumo do dashboard.',
      exercises: [
        {
          id: 'demo-ex-4-1',
          name: 'Agachamento',
          notes: 'Série mais pesada do seed',
          sets: [
            { id: 'demo-set-4-1-1', weight: 100, reps: 5, rpe: 7, completed: true, type: 'W' },
            { id: 'demo-set-4-1-2', weight: 122.5, reps: 4, rpe: 8, completed: true, type: 'N' },
            { id: 'demo-set-4-1-3', weight: 132.5, reps: 3, rpe: 8.5, completed: true, type: 'N', isPr: true },
          ],
        },
        {
          id: 'demo-ex-4-2',
          name: 'Levantamento Terra',
          sets: [
            { id: 'demo-set-4-2-1', weight: 110, reps: 3, rpe: 7.5, completed: true, type: 'W' },
            { id: 'demo-set-4-2-2', weight: 132.5, reps: 3, rpe: 8, completed: true, type: 'N' },
            { id: 'demo-set-4-2-3', weight: 145, reps: 2, rpe: 8.5, completed: true, type: 'N', isPr: true },
          ],
        },
      ],
    },
    {
      id: 'demo-session-3',
      name: 'Deadlift Technique',
      date: daysAgoIso(6, baseDate),
      duration: 3_180,
      templateId: DEMO_TEMPLATE_IDS.deadliftTechnique,
      notes: 'Trabalho técnico com volume moderado.',
      exercises: [
        {
          id: 'demo-ex-3-1',
          name: 'Levantamento Terra',
          sets: [
            { id: 'demo-set-3-1-1', weight: 100, reps: 3, rpe: 7, completed: true, type: 'W' },
            { id: 'demo-set-3-1-2', weight: 122.5, reps: 3, rpe: 7.5, completed: true, type: 'N' },
            { id: 'demo-set-3-1-3', weight: 135, reps: 2, rpe: 8, completed: true, type: 'N' },
          ],
        },
        {
          id: 'demo-ex-3-2',
          name: 'Puxada na Barra',
          sets: [
            { id: 'demo-set-3-2-1', weight: 50, reps: 8, rpe: 7, completed: true, type: 'N' },
            { id: 'demo-set-3-2-2', weight: 50, reps: 8, rpe: 7, completed: true, type: 'N' },
            { id: 'demo-set-3-2-3', weight: 50, reps: 8, rpe: 7, completed: true, type: 'N' },
          ],
        },
      ],
    },
    {
      id: 'demo-session-2',
      name: 'Upper Power',
      date: daysAgoIso(10, baseDate),
      duration: 3_540,
      templateId: DEMO_TEMPLATE_IDS.upperPower,
      notes: 'Sessão com supino pesado e acessórios de empurrar.',
      exercises: [
        {
          id: 'demo-ex-2-1',
          name: 'Supino Reto',
          sets: [
            { id: 'demo-set-2-1-1', weight: 70, reps: 5, rpe: 6.5, completed: true, type: 'W' },
            { id: 'demo-set-2-1-2', weight: 82.5, reps: 4, rpe: 7.5, completed: true, type: 'N' },
            { id: 'demo-set-2-1-3', weight: 90, reps: 3, rpe: 8, completed: true, type: 'N', isPr: true },
          ],
        },
        {
          id: 'demo-ex-2-2',
          name: 'Remada Curvada',
          sets: [
            { id: 'demo-set-2-2-1', weight: 60, reps: 8, rpe: 7, completed: true, type: 'N' },
            { id: 'demo-set-2-2-2', weight: 60, reps: 8, rpe: 7, completed: true, type: 'N' },
            { id: 'demo-set-2-2-3', weight: 60, reps: 8, rpe: 7, completed: true, type: 'N' },
          ],
        },
      ],
    },
    {
      id: 'demo-session-1',
      name: 'Lower Strength',
      date: daysAgoIso(14, baseDate),
      duration: 4_080,
      templateId: DEMO_TEMPLATE_IDS.lowerStrength,
      notes: 'Primeira sessão para abrir o histórico com base sólida.',
      exercises: [
        {
          id: 'demo-ex-1-1',
          name: 'Agachamento',
          sets: [
            { id: 'demo-set-1-1-1', weight: 90, reps: 5, rpe: 6.5, completed: true, type: 'W' },
            { id: 'demo-set-1-1-2', weight: 105, reps: 5, rpe: 7, completed: true, type: 'N' },
            { id: 'demo-set-1-1-3', weight: 112.5, reps: 3, rpe: 7.5, completed: true, type: 'N' },
          ],
        },
        {
          id: 'demo-ex-1-2',
          name: 'Levantamento Terra',
          sets: [
            { id: 'demo-set-1-2-1', weight: 100, reps: 3, rpe: 6.5, completed: true, type: 'W' },
            { id: 'demo-set-1-2-2', weight: 115, reps: 3, rpe: 7, completed: true, type: 'N' },
            { id: 'demo-set-1-2-3', weight: 125, reps: 2, rpe: 7.5, completed: true, type: 'N' },
          ],
        },
      ],
    },
  ];

  return {
    history,
    templates: [...BUILT_IN_TEMPLATES, ...demoTemplates],
    settings: {
      ...DEFAULT_SETTINGS,
      bodyweight: 81.6,
      customPlates: [1.25, 2.5],
      theme: 'brass',
    },
    bodyweightLog: [
      { date: dayKeyDaysAgo(14, baseDate), weight: 80.4 },
      { date: dayKeyDaysAgo(10, baseDate), weight: 80.9 },
      { date: dayKeyDaysAgo(6, baseDate), weight: 81.2 },
      { date: dayKeyDaysAgo(2, baseDate), weight: 81.6 },
    ],
    programs: [
      {
        id: 'demo-program-strength-cycle',
        name: 'Ciclo Demo de Força',
        description: 'Programa curto para visualizar calendário, templates e histórico no celular.',
        templateIds: [
          DEMO_TEMPLATE_IDS.lowerStrength,
          DEMO_TEMPLATE_IDS.upperPower,
          DEMO_TEMPLATE_IDS.deadliftTechnique,
        ],
        isActive: true,
        createdAt: daysAgoIso(15, baseDate),
        updatedAt: daysAgoIso(2, baseDate),
        startDate: dayKeyDaysAgo(13, baseDate),
        trainingDays: [1, 3, 5],
        weekCount: 3,
        weekOverrides: [
          { weekIndex: 0, exerciseName: 'Agachamento', reps: 4, weightPercentage: 80, sets: 4 },
          { weekIndex: 1, exerciseName: 'Supino Reto', reps: 3, weightPercentage: 85, sets: 4 },
          { weekIndex: 2, exerciseName: 'Levantamento Terra', reps: 2, weightPercentage: 87.5, sets: 3 },
        ],
      },
    ],
    customExercises: [],
  };
}

function hasMeaningfulUserData(state: AppState): boolean {
  return (
    state.history.length > 0 ||
    state.templates.some((template) => !template.isBuiltIn) ||
    state.bodyweightLog.length > 0 ||
    state.programs.length > 0 ||
    state.customExercises.length > 0
  );
}

function shouldSeedDemoData(
  demoEmail: string | null | undefined,
  state: AppState,
  activeWorkout: WorkoutSession | null,
): boolean {
  return (
    demoEmail?.trim().toLowerCase() === DEMO_ACCOUNT_EMAIL &&
    activeWorkout === null &&
    !hasMeaningfulUserData(state)
  );
}

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

export const WorkoutProvider: React.FC<{ children: React.ReactNode; storageScopeId?: string | null; demoEmail?: string | null }> = ({ children, storageScopeId, demoEmail }) => {
  const storageScope = storageScopeId?.trim() ? storageScopeId.trim() : 'global';
  const storageKeys = {
    state: `powerlifting_app_state_${storageScope}`,
    activeWorkout: `powerlifting_active_workout_${storageScope}`,
    restTimerEnd: `powerlifting_rest_timer_end_${storageScope}`,
  };

  // Load State from LocalStorage
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(storageKeys.state);
      if (saved) {
        const parsed = JSON.parse(saved) as AppState;
        // Merge with built-in templates to make sure they are always present or updated
        const customTemplates = parsed.templates?.filter(t => !t.isBuiltIn) || [];
        parsed.templates = [...BUILT_IN_TEMPLATES, ...customTemplates];
        parsed.settings = { ...DEFAULT_SETTINGS, ...parsed.settings };
        parsed.bodyweightLog = parsed.bodyweightLog || [];
        parsed.programs = (parsed as AppState).programs || [];
        parsed.customExercises = (parsed as AppState).customExercises || [];
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
      const saved = localStorage.getItem(storageKeys.activeWorkout);
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
      const saved = localStorage.getItem(storageKeys.restTimerEnd);
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
    setState(prev => (
      shouldSeedDemoData(demoEmail, prev, activeWorkout) && result.workouts.length === 0 && result.templates.length === 0
        ? createDemoState(new Date())
        : mergePullResult(prev, result, now)
    ));
  }, [activeWorkout, demoEmail, syncPull]);

  // Pull inicial ao montar (= usuário acabou de autenticar)
  useEffect(() => {
    let cancelled = false;
    syncPull().then(result => {
      if (!result || cancelled) return;
      const now = new Date().toISOString();
      setState(prev => (
        shouldSeedDemoData(demoEmail, prev, activeWorkout) && result.workouts.length === 0 && result.templates.length === 0
          ? createDemoState(new Date())
          : mergePullResult(prev, result, now)
      ));
    });
    return () => { cancelled = true; };
  // Roda apenas uma vez ao montar
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkout, demoEmail]);

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
    safeSetItem(storageKeys.state, JSON.stringify(state));
  }, [state, storageKeys.state]);

  // Aplica o tema de acento no documento (lido pelo CSS via [data-theme])
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.settings.theme);
  }, [state.settings.theme]);

  // Sync active workout to local storage on change
  useEffect(() => {
    if (activeWorkout) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- ver safeSetItem (bail-out no sucesso)
      safeSetItem(storageKeys.activeWorkout, JSON.stringify(activeWorkout));
    } else {
      try { localStorage.removeItem(storageKeys.activeWorkout); } catch { /* SecurityError: falha silenciosa */ }
    }
  }, [activeWorkout, storageKeys.activeWorkout]);

  // Sync rest timer target time to local storage
  useEffect(() => {
    if (restTimerEnd !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- ver safeSetItem (bail-out no sucesso)
      safeSetItem(storageKeys.restTimerEnd, restTimerEnd.toString());
    } else {
      try { localStorage.removeItem(storageKeys.restTimerEnd); } catch { /* SecurityError: falha silenciosa */ }
    }
  }, [restTimerEnd, storageKeys.restTimerEnd]);

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
            notes: ex.notes,
            restSeconds: ex.restSeconds,
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

    // Determine duration from the active session start time
    const startTime = new Date(activeWorkout.date).getTime();
    const rawDuration = Math.round((Date.now() - startTime) / 1000);
    const duration = Number.isFinite(rawDuration) && rawDuration > 0 ? rawDuration : 0;

    const completedSession: WorkoutSession = {
      ...activeWorkout,
      exercises: finalizedExercises,
      duration,
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
      history: [completedSession, ...prev.history]
        .sort((a, b) => b.date.localeCompare(a.date))
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
        startRestTimer(targetEx.restSeconds ?? restTimerDuration);
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

  // Update notes of a specific exercise in the active workout
  const updateExerciseNotes = useCallback((exerciseIndex: number, notes: string) => {
    if (!activeWorkout) return;
    setActiveWorkout(prev => {
      if (!prev) return null;
      const exercises = prev.exercises.map((ex, i) =>
        i === exerciseIndex ? { ...ex, notes } : ex
      );
      return { ...prev, exercises };
    });
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

  // Archive / unarchive a template
  const archiveTemplate = useCallback((templateId: string) => {
    setState(prev => ({
      ...prev,
      templates: prev.templates.map(t => t.id === templateId ? { ...t, archived: true } : t),
    }));
  }, []);

  const unarchiveTemplate = useCallback((templateId: string) => {
    setState(prev => ({
      ...prev,
      templates: prev.templates.map(t => t.id === templateId ? { ...t, archived: false } : t),
    }));
  }, []);

  const updateHistorySession = useCallback((updatedSession: WorkoutSession) => {
    setState(prev => {
      const newHistory = prev.history.map(s =>
        s.id === updatedSession.id ? updatedSession : s
      );
      return { ...prev, history: recalculatePRs(newHistory) };
    });
  }, []);

  const deleteHistorySession = useCallback((sessionId: string) => {
    setState(prev => {
      const newHistory = prev.history.filter(s => s.id !== sessionId);
      return { ...prev, history: recalculatePRs(newHistory) };
    });
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

  // Add custom plate weight with validation and sorting
  const addCustomPlate = useCallback((weight: number) => {
    setState(prev => {
      if (weight <= 0) return prev; // Invalid weight
      
      const existing = [...prev.settings.customPlates];
      if (existing.includes(weight)) return prev; // Already exists
      
      const newCustom = [...existing, weight].sort((a, b) => b - a); // Sort descending
      
      return {
        ...prev,
        settings: {
          ...prev.settings,
          customPlates: newCustom
        }
      };
    });
  }, []);

  // Remove custom plate weight
  const removeCustomPlate = useCallback((weight: number) => {
    setState(prev => {
      const newCustom = prev.settings.customPlates.filter(p => p !== weight);
      return {
        ...prev,
        settings: {
          ...prev.settings,
          customPlates: newCustom
        }
      };
    });
  }, []);

  // Cria exercício customizado — ignora vazio e duplicado (case-insensitive pelo nome)
  const addCustomExercise = useCallback((name: string): string => {
    const trimmed = name.trim();
    if (!trimmed) return '';
    setState(prev => {
      const exists = prev.customExercises.some(e => e.name.toLowerCase() === trimmed.toLowerCase());
      if (exists) return prev;
      const entry: CustomExercise = {
        id: `cex-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: trimmed,
        createdAt: new Date().toISOString(),
      };
      return { ...prev, customExercises: [...prev.customExercises, entry] };
    });
    return trimmed;
  }, []);

  const removeCustomExercise = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      customExercises: prev.customExercises.filter(e => e.id !== id),
    }));
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
        customExercises: (parsed as { customExercises?: CustomExercise[] }).customExercises ?? [],
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
    const isSameDay = (isoA: string, isoB: string) => new Date(isoA).toDateString() === new Date(isoB).toDateString();
    const todayIso = new Date().toISOString();
    const sorted = [...state.history].sort((a, b) => b.date.localeCompare(a.date));
    const pickNextId = (ids: string[], completedToday: Set<string>, lastId?: string): string | undefined => {
      if (ids.length === 0) return undefined;
      const startIdx = lastId ? ids.indexOf(lastId) : -1;

      // Prefer the next item in sequence that has not been completed today.
      for (let step = 1; step <= ids.length; step += 1) {
        const candidate = ids[(startIdx + step + ids.length) % ids.length];
        if (!completedToday.has(candidate)) return candidate;
      }

      // If all were completed today, continue regular rotation.
      return ids[(startIdx + 1 + ids.length) % ids.length];
    };

    const activeProgram = state.programs.find(p => p.isActive);
    if (activeProgram && activeProgram.templateIds.length > 0) {
      const validTemplateIds = activeProgram.templateIds.filter(id => state.templates.some(t => t.id === id && !t.archived));
      if (validTemplateIds.length === 0) return undefined;

      // Encontra o último template executado que pertence ao programa
      const lastMatch = sorted.find(s => s.templateId && validTemplateIds.includes(s.templateId));
      const completedToday = new Set(
        sorted
          .filter(s => s.templateId && validTemplateIds.includes(s.templateId) && isSameDay(s.date, todayIso))
          .map(s => s.templateId as string)
      );
      const nextId = pickNextId(validTemplateIds, completedToday, lastMatch?.templateId);
      if (nextId) {
        const next = state.templates.find(t => t.id === nextId);
        if (next) return next;
      }
    }
    // Fallback sem programa: rotaciona entre templates customizados por histórico
    const myTemplates = state.templates.filter(t => !t.isBuiltIn && !t.archived);
    if (myTemplates.length === 0) return state.templates.find(t => !t.archived);
    if (myTemplates.length === 1) return myTemplates[0];

    // Encontra o último treino que usou um desses templates
    const lastMatch = sorted.find(s => s.templateId && myTemplates.some(t => t.id === s.templateId));
    const completedToday = new Set(
      sorted
        .filter(s => s.templateId && myTemplates.some(t => t.id === s.templateId) && isSameDay(s.date, todayIso))
        .map(s => s.templateId as string)
    );
    const myTemplateIds = myTemplates.map(t => t.id);
    const nextId = pickNextId(myTemplateIds, completedToday, lastMatch?.templateId);
    if (nextId) {
      const next = myTemplates.find(t => t.id === nextId);
      if (next) return next;
    }
    return myTemplates[0];
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
      updateExerciseNotes,
      saveTemplate,
      deleteTemplate,
      archiveTemplate,
      unarchiveTemplate,
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
      updateHistorySession,
      deleteHistorySession,
      addCustomPlate,
      removeCustomPlate,
      addCustomExercise,
      removeCustomExercise,
    }), [
      state, activeWorkout, startWorkout, repeatWorkout, cancelWorkout, completeActiveWorkout,
      addExerciseToActiveWorkout, removeExerciseFromActiveWorkout, addSetToExercise,
      removeSetFromExercise, updateSet, updateWorkoutNotes, updateExerciseNotes, saveTemplate, deleteTemplate,
      updateSettings, getMaxE1RM, exportData, importData, restTimerDuration,
      restTimerEnd, startRestTimer, stopRestTimer, logBodyweight, deleteBodyweightEntry,
      getBodyweightAt, saveError, dismissSaveError, syncStatus, pullFromServer,
      saveProgram, deleteProgram, getNextTemplate, archiveTemplate, unarchiveTemplate,
      updateHistorySession, deleteHistorySession, addCustomPlate, removeCustomPlate,
      addCustomExercise, removeCustomExercise,
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
