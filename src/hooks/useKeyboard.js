// Global keyboard shortcuts as a React hook.

import { useEffect } from 'react';
import { selectDate } from '../store.js';
import { todayKey, shiftDay } from '../date.js';

export function useKeyboard({ onHelp, onClose, onToggleCashflow, getSelectedDate }) {
  useEffect(() => {
    function isEditable(target) {
      if (!target) return false;
      const tag = target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
      if (target.isContentEditable) return true;
      return false;
    }

    function handler(e) {
      // Escape always closes overlays / clears focus.
      if (e.key === 'Escape') {
        if (onClose?.()) return;
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
          selectDate(shiftDay(getSelectedDate(), 1));
          break;
        case 'k':
          e.preventDefault();
          selectDate(shiftDay(getSelectedDate(), -1));
          break;
        case '/':
          e.preventDefault();
          document.getElementById('planner-name')?.focus();
          break;
        case 'm':
          e.preventDefault();
          onToggleCashflow?.();
          break;
      }
    }

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onHelp, onClose, onToggleCashflow, getSelectedDate]);
}
