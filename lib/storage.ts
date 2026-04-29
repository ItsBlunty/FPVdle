'use client';

const STORAGE_KEY = 'fpvdle:state:v1';

export interface PlayRecord {
  puzzleId: number;
  guesses: string[];
  solved: boolean;
  cluesRevealed: number;
  completed: boolean;
}

export interface ClientState {
  sessionId: string;
  streak: { current: number; max: number };
  lastPlayedDate?: string;
  plays: Record<string, PlayRecord>;
}

function emptyState(): ClientState {
  return {
    sessionId: cryptoRandomUuid(),
    streak: { current: 0, max: 0 },
    plays: {},
  };
}

function cryptoRandomUuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // Fallback (very old browsers): not strictly RFC4122 but good enough.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function loadState(): ClientState {
  if (typeof window === 'undefined') return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fresh = emptyState();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }
    const parsed = JSON.parse(raw) as ClientState;
    if (!parsed.sessionId) parsed.sessionId = cryptoRandomUuid();
    if (!parsed.streak) parsed.streak = { current: 0, max: 0 };
    if (!parsed.plays) parsed.plays = {};
    return parsed;
  } catch {
    const fresh = emptyState();
    return fresh;
  }
}

export function saveState(state: ClientState): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function recordCompletion(
  state: ClientState,
  dateKey: string,
  play: PlayRecord,
): ClientState {
  const next: ClientState = {
    ...state,
    plays: { ...state.plays, [dateKey]: play },
  };

  // Streak: update only on first completion of this day.
  if (state.plays[dateKey]?.completed) {
    return next;
  }

  // Streak rule: only missing a day breaks the streak. A loss still counts.
  const last = state.lastPlayedDate;
  let current = state.streak.current;
  if (!last) {
    current = 1;
  } else {
    const lastDate = new Date(last + 'T00:00:00Z');
    const thisDate = new Date(dateKey + 'T00:00:00Z');
    const diffDays = Math.round((thisDate.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays === 1) current = state.streak.current + 1;
    else if (diffDays === 0) current = state.streak.current;
    else current = 1;
  }
  const max = Math.max(state.streak.max, current);

  next.streak = { current, max };
  next.lastPlayedDate = dateKey;
  return next;
}
