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
}

export interface WorkoutSession {
  id: string;
  name: string;
  date: string; // ISO string
  duration: number; // in seconds
  exercises: ExerciseState[];
  notes?: string;
}

export interface TemplateExercise {
  name: string;
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
}

export interface Settings {
  units: 'kg' | 'lbs';
  barWeight: number;
  availablePlates: number[];
  bodyweight: number;
  gender: 'male' | 'female';
  isEquipped: boolean;
}

export interface AppState {
  history: WorkoutSession[];
  templates: WorkoutTemplate[];
  settings: Settings;
}
