// Extensão .js explícita: a API compila com moduleResolution NodeNext, que exige
// extensão em imports relativos ESM (o Vite do web aceita ambos os formatos).
export type {
  SetState,
  ExerciseState,
  WorkoutSession,
  DeletedWorkoutTombstone,
  TemplateExercise,
  WorkoutTemplate,
  Settings,
  ThemeName,
  BodyweightEntry,
  AppState,
  SyncStatus,
  Program,
  WeekOverride,
  CustomExercise,
} from './workout.js';
