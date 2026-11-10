import { useCallback, useReducer } from 'react';

const MAX_HISTORY = 50;

function paletteHistoryReducer(state, action) {
  switch (action.type) {
    case 'PUSH': {
      const nextEntries = [...state.entries.slice(0, state.index + 1), action.snapshot].slice(
        -MAX_HISTORY,
      );
      return { entries: nextEntries, index: nextEntries.length - 1 };
    }
    case 'NAVIGATE': {
      const nextIndex = Math.max(0, Math.min(state.entries.length - 1, action.index));
      return { ...state, index: nextIndex };
    }
    case 'UPDATE_COLORS': {
      const entries = state.entries.slice();
      entries[state.index] = { ...entries[state.index], colors: action.colors };
      return { ...state, entries };
    }
    case 'UPDATE_META': {
      const entries = state.entries.slice();
      entries[state.index] = { ...entries[state.index], ...action.patch };
      return { ...state, entries };
    }
    case 'RESET': {
      return { entries: [action.snapshot], index: 0 };
    }
    default:
      return state;
  }
}

export function usePaletteHistory(initialSnapshot) {
  const [state, dispatch] = useReducer(paletteHistoryReducer, initialSnapshot, (snapshot) => ({
    entries: [snapshot],
    index: 0,
  }));

  const current = state.entries[state.index];

  const push = useCallback((snapshot) => {
    dispatch({ type: 'PUSH', snapshot });
  }, []);

  const reset = useCallback((snapshot) => {
    dispatch({ type: 'RESET', snapshot });
  }, []);

  const navigate = useCallback((index) => {
    dispatch({ type: 'NAVIGATE', index });
  }, []);

  const updateColors = useCallback((colors) => {
    dispatch({ type: 'UPDATE_COLORS', colors });
  }, []);

  const updateMeta = useCallback((patch) => {
    dispatch({ type: 'UPDATE_META', patch });
  }, []);

  return {
    current,
    entries: state.entries,
    index: state.index,
    canGoPrevious: state.index > 0,
    canGoNext: state.index < state.entries.length - 1,
    push,
    reset,
    navigate,
    updateColors,
    updateMeta,
  };
}
