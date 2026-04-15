/**
 * parcourStore.tsx
 * Global store for the Parcours Vivant feature — built with React Context
 * (no external deps). Tracks the live parcours being built during a Maya
 * conversation : phase, steps, budgets, sheet visibility, search status.
 *
 * Wrap the app in <ParcourProvider>; consume via useParcourStore().
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from "react";

// ─── Types ─────────────────────────────────────────────────────────────
export interface ParcourStep {
  id: string;
  establishmentSlug: string;
  name: string;
  photo: string;
  category: string;
  timeSlot: string;
  priceEstimate: number;
  travelFromPrevious: string;
  checked: boolean;
  lat?: number;
  lng?: number;
}

export type ParcourPhase = "idle" | "questions" | "searching" | "results" | "ready";

export interface ParcourState {
  phase: ParcourPhase;
  steps: ParcourStep[];
  totalBudget: number;
  perPersonBudget: number;
  personCount: number;
  isSheetOpen: boolean;
  isMayaSearching: boolean;
}

const initialState: ParcourState = {
  phase: "idle",
  steps: [],
  totalBudget: 0,
  perPersonBudget: 0,
  personCount: 1,
  isSheetOpen: false,
  isMayaSearching: false,
};

// ─── Actions ───────────────────────────────────────────────────────────
type Action =
  | { type: "ADD_STEP"; step: ParcourStep }
  | { type: "REMOVE_STEP"; id: string }
  | { type: "TOGGLE_STEP"; id: string }
  | { type: "REPLACE_STEP"; id: string; step: ParcourStep }
  | { type: "SET_PHASE"; phase: ParcourPhase }
  | { type: "SET_PERSON_COUNT"; count: number }
  | { type: "OPEN_SHEET" }
  | { type: "CLOSE_SHEET" }
  | { type: "SET_MAYA_SEARCHING"; searching: boolean }
  | { type: "CLEAR_PARCOUR" };

// ─── Helpers ──────────────────────────────────────────────────────────
function recomputeBudgets(steps: ParcourStep[], personCount: number) {
  const total = steps
    .filter((s) => s.checked)
    .reduce((sum, s) => sum + (s.priceEstimate || 0), 0);
  const perPerson = personCount > 0 ? Math.round(total / personCount) : total;
  return { totalBudget: total, perPersonBudget: perPerson };
}

// ─── Reducer ──────────────────────────────────────────────────────────
function reducer(state: ParcourState, action: Action): ParcourState {
  switch (action.type) {
    case "ADD_STEP": {
      // Skip if a step with the same establishmentSlug already exists
      if (state.steps.some((s) => s.establishmentSlug === action.step.establishmentSlug)) {
        return state;
      }
      const steps = [...state.steps, action.step];
      const budgets = recomputeBudgets(steps, state.personCount);
      return { ...state, steps, ...budgets };
    }
    case "REMOVE_STEP": {
      const steps = state.steps.filter((s) => s.id !== action.id);
      const budgets = recomputeBudgets(steps, state.personCount);
      return { ...state, steps, ...budgets };
    }
    case "TOGGLE_STEP": {
      const steps = state.steps.map((s) =>
        s.id === action.id ? { ...s, checked: !s.checked } : s
      );
      const budgets = recomputeBudgets(steps, state.personCount);
      return { ...state, steps, ...budgets };
    }
    case "REPLACE_STEP": {
      const steps = state.steps.map((s) => (s.id === action.id ? action.step : s));
      const budgets = recomputeBudgets(steps, state.personCount);
      return { ...state, steps, ...budgets };
    }
    case "SET_PHASE":
      return { ...state, phase: action.phase };
    case "SET_PERSON_COUNT": {
      const personCount = Math.max(1, Math.floor(action.count));
      const budgets = recomputeBudgets(state.steps, personCount);
      return { ...state, personCount, ...budgets };
    }
    case "OPEN_SHEET":
      return { ...state, isSheetOpen: true };
    case "CLOSE_SHEET":
      return { ...state, isSheetOpen: false };
    case "SET_MAYA_SEARCHING":
      return { ...state, isMayaSearching: action.searching };
    case "CLEAR_PARCOUR":
      return { ...initialState };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────
interface ParcourStoreApi extends ParcourState {
  addStep: (step: ParcourStep) => void;
  removeStep: (id: string) => void;
  toggleStep: (id: string) => void;
  replaceStep: (id: string, step: ParcourStep) => void;
  setPhase: (phase: ParcourPhase) => void;
  setPersonCount: (count: number) => void;
  openSheet: () => void;
  closeSheet: () => void;
  setMayaSearching: (searching: boolean) => void;
  clearParcour: () => void;
}

const ParcourContext = createContext<ParcourStoreApi | null>(null);

export function ParcourProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const addStep = useCallback((step: ParcourStep) => dispatch({ type: "ADD_STEP", step }), []);
  const removeStep = useCallback((id: string) => dispatch({ type: "REMOVE_STEP", id }), []);
  const toggleStep = useCallback((id: string) => dispatch({ type: "TOGGLE_STEP", id }), []);
  const replaceStep = useCallback(
    (id: string, step: ParcourStep) => dispatch({ type: "REPLACE_STEP", id, step }),
    []
  );
  const setPhase = useCallback(
    (phase: ParcourPhase) => dispatch({ type: "SET_PHASE", phase }),
    []
  );
  const setPersonCount = useCallback(
    (count: number) => dispatch({ type: "SET_PERSON_COUNT", count }),
    []
  );
  const openSheet = useCallback(() => dispatch({ type: "OPEN_SHEET" }), []);
  const closeSheet = useCallback(() => dispatch({ type: "CLOSE_SHEET" }), []);
  const setMayaSearching = useCallback(
    (searching: boolean) => dispatch({ type: "SET_MAYA_SEARCHING", searching }),
    []
  );
  const clearParcour = useCallback(() => dispatch({ type: "CLEAR_PARCOUR" }), []);

  const value = useMemo<ParcourStoreApi>(
    () => ({
      ...state,
      addStep,
      removeStep,
      toggleStep,
      replaceStep,
      setPhase,
      setPersonCount,
      openSheet,
      closeSheet,
      setMayaSearching,
      clearParcour,
    }),
    [
      state,
      addStep,
      removeStep,
      toggleStep,
      replaceStep,
      setPhase,
      setPersonCount,
      openSheet,
      closeSheet,
      setMayaSearching,
      clearParcour,
    ]
  );

  return <ParcourContext.Provider value={value}>{children}</ParcourContext.Provider>;
}

export function useParcourStore(): ParcourStoreApi {
  const ctx = useContext(ParcourContext);
  if (!ctx) {
    throw new Error("useParcourStore must be used within a ParcourProvider");
  }
  return ctx;
}
