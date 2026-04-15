const MAX_HISTORY_SIZE = 50;

export interface History<T> {
  readonly past: readonly T[];
  readonly present: T;
  readonly future: readonly T[];
}

export function createHistory<T>(initial: T): History<T> {
  return { past: [], present: initial, future: [] };
}

export function pushHistory<T>(history: History<T>, next: T): History<T> {
  const past = [...history.past, history.present].slice(-MAX_HISTORY_SIZE);
  return { past, present: next, future: [] };
}

export function undoHistory<T>(history: History<T>): History<T> {
  if (history.past.length === 0) {
    return history;
  }

  const past = history.past.slice(0, -1);
  const present = history.past[history.past.length - 1];
  const future = [history.present, ...history.future];
  return { past, present, future };
}

export function redoHistory<T>(history: History<T>): History<T> {
  if (history.future.length === 0) {
    return history;
  }

  const past = [...history.past, history.present];
  const present = history.future[0];
  const future = history.future.slice(1);
  return { past, present, future };
}

export function canUndo<T>(history: History<T>): boolean {
  return history.past.length > 0;
}

export function canRedo<T>(history: History<T>): boolean {
  return history.future.length > 0;
}
