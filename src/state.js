// In-memory state with pub/sub. Every mutator persists and notifies.

import * as storage from './storage.js';
import { todayKey, yearMonthOf } from './date.js';

const listeners = new Set();

function defaultState() {
  const today = todayKey();
  const { year, month } = yearMonthOf(today);
  return {
    habits: [],
    completions: {},
    selectedDate: today,
    viewMonth: { year, month },
  };
}

let state = (() => {
  const loaded = storage.load();
  if (loaded && Array.isArray(loaded.habits) && typeof loaded.completions === 'object') {
    const today = todayKey();
    const { year, month } = yearMonthOf(today);
    return {
      ...loaded,
      selectedDate: today,
      viewMonth: { year, month },
    };
  }
  const init = defaultState();
  storage.save(init);
  return init;
})();

export function getState() {
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  for (const fn of listeners) fn(state);
}

function commit(patch) {
  state = { ...state, ...patch };
  storage.save(state);
  notify();
}

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'h_' + Math.random().toString(36).slice(2, 11);
}

export function addHabit({ name, description = '' }) {
  const trimmed = (name || '').trim();
  if (!trimmed) return null;
  const habit = {
    id: newId(),
    name: trimmed,
    description: description.trim(),
    createdAt: new Date().toISOString(),
  };
  commit({ habits: [...state.habits, habit] });
  return habit.id;
}

export function renameHabit(id, name) {
  const trimmed = (name || '').trim();
  if (!trimmed) return;
  commit({
    habits: state.habits.map((h) => (h.id === id ? { ...h, name: trimmed } : h)),
  });
}

export function updateHabitDescription(id, description) {
  commit({
    habits: state.habits.map((h) => (h.id === id ? { ...h, description: (description || '').trim() } : h)),
  });
}

export function deleteHabit(id) {
  // Removes the habit but leaves completions untouched — history is immutable.
  commit({ habits: state.habits.filter((h) => h.id !== id) });
}

export function setCompletion(dateKey, habitId, done) {
  // No-op if the habit doesn't exist (history-only entries are preserved).
  if (!state.habits.some((h) => h.id === habitId)) return;
  const day = { ...(state.completions[dateKey] || {}) };
  if (done) day[habitId] = true;
  else delete day[habitId];
  commit({ completions: { ...state.completions, [dateKey]: day } });
}

export function selectDate(dateKey) {
  const { year, month } = yearMonthOf(dateKey);
  commit({ selectedDate: dateKey, viewMonth: { year, month } });
}

export function setViewMonth(year, month) {
  commit({ viewMonth: { year, month } });
}

export function shiftViewMonth(delta) {
  let { year, month } = state.viewMonth;
  month += delta;
  while (month < 0) { month += 12; year -= 1; }
  while (month > 11) { month -= 12; year += 1; }
  commit({ viewMonth: { year, month } });
}

export function isHabitDone(dateKey, habitId) {
  return Boolean(state.completions[dateKey]?.[habitId]);
}

export function habitById(id) {
  return state.habits.find((h) => h.id === id) || null;
}
