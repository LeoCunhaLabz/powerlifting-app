export interface SetState {
  id: string;
  weight: number;
  reps: number;
  rpe?: number; // Rate of Perceived Exertion (6-10)
  rir?: number; // Reps in Reserve (0-4)
  completed: boolean;
  isPr?: boolean;
  percentage?: number; // if based on % of 1RM
  type: 'W' | 'N' | 'D'; // Warmup, Normal (Working), Drop set
}

export interface ExerciseState {
  id: string;
  name: string;
  sets: SetState[];
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  name: string;
  date: string; // ISO string
  duration: number; // in seconds
  exercises: ExerciseState[];
  notes?: string;
  templateId?: string; // ID do template usado para iniciar este treino
  syncedAt?: string; // ISO — quando este registro foi sincronizado com o servidor pela última vez
}

export interface TemplateExercise {
  name: string;
  notes?: string;
  sets: {
    reps: number;
    rpe?: number;
    weightPercentage?: number; // e.g. 75%
    type: 'W' | 'N' | 'D';
  }[];
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  exercises: TemplateExercise[];
  isBuiltIn?: boolean;
  updatedAt?: string; // ISO — última modificação local (para last-write-wins)
  syncedAt?: string;  // ISO — quando foi sincronizado com o servidor
}

/** Tema de acento da interface. 'brass' é o padrão (cor original do app). */
export type ThemeName = 'onyx' | 'brass' | 'volt';

export interface Settings {
  units: 'kg' | 'lbs';
  barWeight: number;
  availablePlates: number[];
  bodyweight: number;
  gender: 'male' | 'female';
  isEquipped: boolean;
  theme: ThemeName;
}

export interface BodyweightEntry {
  date: string;   // ISO (YYYY-MM-DD ou ISO completo)
  weight: number; // na unidade corrente (Settings.units)
}

/** Status da sincronização com o servidor. */
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

/**
 * Sobrescreve a prescrição de um exercício numa semana específica do programa.
 * Campos omitidos herdam os valores do template base.
 */
export interface WeekOverride {
  /** Índice da semana (0-based: semana 1 = índice 0). */
  weekIndex: number;
  /** Nome do exercício — igual ao nome no template. */
  exerciseName: string;
  reps?: number;
  weightPercentage?: number;
  rpe?: number;
  /** Número de séries de trabalho (substituem a contagem do template). */
  sets?: number;
}

/**
 * Representa um programa de treino: uma sequência ordenada de rotinas/templates
 * que define o ciclo de treinos do atleta.
 */
export interface Program {
  id: string;
  name: string;
  description?: string;
  /** IDs dos templates na ordem em que devem ser executados (ciclo). */
  templateIds: string[];
  /** Se este é o programa ativo — apenas um programa pode estar ativo por vez. */
  isActive: boolean;
  createdAt: string; // ISO
  updatedAt?: string; // ISO
  /** Data de início do ciclo (ISO YYYY-MM-DD). Padrão: createdAt. */
  startDate?: string;
  /** Dias da semana para treinar: 0=Seg, 1=Ter, 2=Qua, 3=Qui, 4=Sex, 5=Sáb, 6=Dom. */
  trainingDays?: number[];
  /** Número de semanas do mesociclo de variação. Default: 1. */
  weekCount?: number;
  /** Sobrescritas de prescrição por semana e exercício. */
  weekOverrides?: WeekOverride[];
}

export interface AppState {
  history: WorkoutSession[];
  templates: WorkoutTemplate[];
  settings: Settings;
  bodyweightLog: BodyweightEntry[];
  programs: Program[];
}
