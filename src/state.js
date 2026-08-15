// In-memory state with pub/sub. Every mutator persists and notifies.

import * as storage from './storage.js';
import { todayKey, yearMonthOf } from './date.js';

const listeners = new Set();
let undoStack = [];
const MAX_UNDO = 10;

function defaultState() {
  const today = todayKey();
  const { year, month } = yearMonthOf(today);
  return {
    habits: [],
    completions: {},
    selectedDate: today,
    viewMonth: { year, month },
    transactions: [],
    cashflowView: false,
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
      transactions: Array.isArray(loaded.transactions) ? loaded.transactions : [],
      cashflowView: Boolean(loaded.cashflowView),
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
    archived: false,
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
  const deletedHabit = state.habits.find((h) => h.id === id);
  if (!deletedHabit) return;

  // Push to undo stack before deletion
  pushUndo({
    type: 'deleteHabit',
    habit: { ...deletedHabit },
  });

  commit({ habits: state.habits.filter((h) => h.id !== id) });
}

export function moveHabit(id, direction) {
  const idx = state.habits.findIndex((h) => h.id === id);
  if (idx === -1) return;
  const newIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (newIdx < 0 || newIdx >= state.habits.length) return;
  const newHabits = [...state.habits];
  [newHabits[idx], newHabits[newIdx]] = [newHabits[newIdx], newHabits[newIdx], newHabits[idx]];
  commit({ habits: newHabits });
}

export function archiveHabit(id) {
  commit({
    habits: state.habits.map((h) => (h.id === id ? { ...h, archived: true } : h)),
  });
}

export function unarchiveHabit(id) {
  commit({
    habits: state.habits.map((h) => (h.id === id ? { ...h, archived: false } : h)),
  });
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

// ─── Cashflow ────────────────────────────────────────────────────────
// A transaction is { id, kind: 'income' | 'outcome', amount: number, label: string, dateKey: YYYY-MM-DD, createdAt: ISO string }.
// Amounts are always stored as positive numbers — `kind` carries the sign.

function txId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 't_' + Math.random().toString(36).slice(2, 11);
}

export function addTransaction({ kind, amount, label, dateKey }) {
  const k = kind === 'income' ? 'income' : 'outcome';
  const a = Number(amount);
  if (!Number.isFinite(a) || a <= 0) return null;
  const tx = {
    id: txId(),
    kind: k,
    amount: a,
    label: (label || '').trim(),
    dateKey: dateKey || todayKey(),
    createdAt: new Date().toISOString(),
  };
  commit({ transactions: [...state.transactions, tx] });
  return tx.id;
}

export function updateTransaction(id, patch) {
  commit({
    transactions: state.transactions.map((t) => {
      if (t.id !== id) return t;
      const next = { ...t };
      if (patch.kind) next.kind = patch.kind === 'income' ? 'income' : 'outcome';
      if (patch.amount != null) {
        const a = Number(patch.amount);
        if (Number.isFinite(a) && a > 0) next.amount = a;
      }
      if (patch.label != null) next.label = String(patch.label).trim();
      if (patch.dateKey) next.dateKey = patch.dateKey;
      return next;
    }),
  });
}

export function deleteTransaction(id) {
  const deletedTx = state.transactions.find((t) => t.id === id);
  if (!deletedTx) return;

  // Push to undo stack before deletion
  pushUndo({
    type: 'deleteTransaction',
    transaction: { ...deletedTx },
  });

  commit({ transactions: state.transactions.filter((t) => t.id !== id) });
}

function pushUndo(action) {
  undoStack.push(action);
  if (undoStack.length > MAX_UNDO) {
    undoStack.shift();
  }
  notify(); // Notify to update any undo UI
}

export function canUndo() {
  return undoStack.length > 0;
}

export function getLastUndoAction() {
  return undoStack[undoStack.length - 1] || null;
}

export function undo() {
  if (undoStack.length === 0) return false;

  const action = undoStack.pop();

  if (action.type === 'deleteHabit') {
    // Restore the habit
    commit({ habits: [...state.habits, action.habit] });
    return { type: 'habit', name: action.habit.name };
  } else if (action.type === 'deleteTransaction') {
    // Restore the transaction
    commit({ transactions: [...state.transactions, action.transaction] });
    return { type: 'transaction', label: action.transaction.label };
  }

  return false;
}

export function setCashflowView(on) {
  commit({ cashflowView: Boolean(on) });
}

export function toggleCashflowView() {
  commit({ cashflowView: !state.cashflowView });
}

// Aggregates: returns signed totals so callers can show +income / -outcome in one number.
export function cashflowTotals(transactions) {
  let income = 0;
  let outcome = 0;
  for (const t of transactions) {
    if (t.kind === 'income') income += t.amount;
    else outcome += t.amount;
  }
  return { income, outcome, balance: income - outcome };
}
