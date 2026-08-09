// Global keyboard shortcuts. Ignore keys when the user is typing in an input.

import { selectDate, getState } from './state.js';
import { todayKey, shiftDay } from './date.js';

export function attachKeyboard(opts) {
  const { onHelp, onClose } = opts;

  function isEditable(target) {
    if (!target) return false;
    const tag = target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (target.isContentEditable) return true;
    return false;
  }

  function focusPlanner() {
    const el = document.getElementById('planner-name');
    if (el) el.focus();
  }

  function handler(e) {
    // Escape always closes overlays/clears focus.
    if (e.key === 'Escape') {
      if (onClose && onClose()) return;
      if (document.activeElement && document.activeElement !== document.body) {
        document.activeElement.blur();
      }
      return;
    }

    if (isEditable(e.target)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    switch (e.key) {
      case 'h':
      case '?':
        e.preventDefault();
        onHelp?.();
        break;
      case 't':
        e.preventDefault();
        selectDate(todayKey());
        break;
      case 'j':
        e.preventDefault();
        selectDate(shiftDay(getState().selectedDate, 1));
        break;
      case 'k':
        e.preventDefault();
        selectDate(shiftDay(getState().selectedDate, -1));
        break;
      case '/':
        e.preventDefault();
        focusPlanner();
        break;
    }
  }

  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}
