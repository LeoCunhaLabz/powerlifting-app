import React, { createContext, useContext, useState, useEffect } from 'react';
import type { 
  AppState, 
  WorkoutSession, 
  WorkoutTemplate, 
  Settings, 
  ExerciseState, 
  SetState 
} from '../types/workout';
import { calculateE1RM, DEFAULT_PLATES_KG } from '../utils/powerlifting';

interface WorkoutContextType {
  state: AppState;
  activeWorkout: WorkoutSession | null;
  startWorkout: (templateId?: string) => void;
  cancelWorkout: () => void;
  completeActiveWorkout: () => void;
  addExerciseToActiveWorkout: (name: string) => void;
  removeExerciseFromActiveWorkout: (index: number) => void;
  addSetToExercise: (exerciseIndex: number) => void;
  removeSetFromExercise: (exerciseIndex: number, setIndex: number) => void;
  updateSet: (exerciseIndex: number, setIndex: number, fields: Partial<SetState>) => void;
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
  isEquipped: false
};

const DEFAULT_STATE: AppState = {
  history: [],
  templates: BUILT_IN_TEMPLATES,
  settings: DEFAULT_SETTINGS
};

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load State from LocalStorage
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('powerlifting_app_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AppState;
        // Merge with built-in templates to make sure they are always present or updated
        const customTemplates = parsed.templates?.filter(t => !t.isBuiltIn) || [];
        parsed.templates = [...BUILT_IN_TEMPLATES, ...customTemplates];
        return parsed;
      } catch (e) {
        console.error('Failed to parse app state:', e);
      }
    }
    return DEFAULT_STATE;
  });

  // Active Workout session state
  const [activeWorkout, setActiveWorkout] = useState<WorkoutSession | null>(() => {
    const saved = localStorage.getItem('powerlifting_active_workout');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse active workout:', e);
      }
    }
    return null;
  });

  // Rest Timer State
  const [restTimerDuration, setRestTimerDuration] = useState(120); // 2 minutes default
  const [restTimerEnd, setRestTimerEnd] = useState<number | null>(() => {
    const saved = localStorage.getItem('powerlifting_rest_timer_end');
    return saved ? parseInt(saved, 10) : null;
  });

  // Sync state to local storage on change
  useEffect(() => {
    localStorage.setItem('powerlifting_app_state', JSON.stringify(state));
  }, [state]);

  // Sync active workout to local storage on change
  useEffect(() => {
    if (activeWorkout) {
      localStorage.setItem('powerlifting_active_workout', JSON.stringify(activeWorkout));
    } else {
      localStorage.removeItem('powerlifting_active_workout');
    }
  }, [activeWorkout]);

  // Sync rest timer target time to local storage
  useEffect(() => {
    if (restTimerEnd !== null) {
      localStorage.setItem('powerlifting_rest_timer_end', restTimerEnd.toString());
    } else {
      localStorage.removeItem('powerlifting_rest_timer_end');
    }
  }, [restTimerEnd]);

  // Helper: Find absolute max e1RM for an exercise from history
  const getMaxE1RM = (exerciseName: string): number => {
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
  };

  // Start a new workout session
  const startWorkout = (templateId?: string) => {
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
      }
    }

    const newSession: WorkoutSession = {
      id: `session-${Date.now()}`,
      name: sessionName,
      date: new Date().toISOString(),
      duration: 0,
      exercises,
      notes: ''
    };

    setActiveWorkout(newSession);
  };

  // Cancel active workout
  const cancelWorkout = () => {
    setActiveWorkout(null);
    stopRestTimer();
  };

  // Complete and save active workout
  const completeActiveWorkout = () => {
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
  };

  // Add exercise to active workout
  const addExerciseToActiveWorkout = (name: string) => {
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
  };

  // Remove exercise from active workout
  const removeExerciseFromActiveWorkout = (index: number) => {
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
  };

  // Add set to exercise in active workout
  const addSetToExercise = (exerciseIndex: number) => {
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
  };

  // Remove set from exercise in active workout
  const removeSetFromExercise = (exerciseIndex: number, setIndex: number) => {
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
  };

  // Update specific set in active workout
  const updateSet = (exerciseIndex: number, setIndex: number, fields: Partial<SetState>) => {
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
  };

  // Save/Create a workout template
  const saveTemplate = (templateData: Omit<WorkoutTemplate, 'id'> & { id?: string }) => {
    setState(prev => {
      const existingIndex = templateData.id ? prev.templates.findIndex(t => t.id === templateData.id) : -1;
      const updatedTemplates = [...prev.templates];

      const template: WorkoutTemplate = {
        id: templateData.id || `template-${Date.now()}`,
        name: templateData.name,
        description: templateData.description,
        exercises: templateData.exercises,
        isBuiltIn: false
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
  };

  // Delete a template
  const deleteTemplate = (templateId: string) => {
    setState(prev => ({
      ...prev,
      templates: prev.templates.filter(t => t.id !== templateId || t.isBuiltIn) // Cannot delete built-ins
    }));
  };

  // Update user configurations
  const updateSettings = (newSettings: Partial<Settings>) => {
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

      return {
        ...prev,
        settings: mergedSettings
      };
    });
  };

  // Export entire state to stringified JSON
  const exportData = (): string => {
    return JSON.stringify(state, null, 2);
  };

  // Import JSON string back into state
  const importData = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed && typeof parsed === 'object' && parsed.history && parsed.templates && parsed.settings) {
        setState(parsed as AppState);
        return true;
      }
    } catch (e) {
      console.error('Import failed:', e);
    }
    return false;
  };

  // Rest Timer Functions
  const startRestTimer = (seconds: number) => {
    const endTime = Date.now() + seconds * 1000;
    setRestTimerEnd(endTime);
  };

  const stopRestTimer = () => {
    setRestTimerEnd(null);
  };

  return (
    <WorkoutContext.Provider value={{
      state,
      activeWorkout,
      startWorkout,
      cancelWorkout,
      completeActiveWorkout,
      addExerciseToActiveWorkout,
      removeExerciseFromActiveWorkout,
      addSetToExercise,
      removeSetFromExercise,
      updateSet,
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
      stopRestTimer
    }}>
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
};
