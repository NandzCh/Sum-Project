// App root — orchestrates layout, state, keyboard, help overlay, and FAB.

import { useState, useCallback, useRef, useEffect } from 'react';
import { useStore, setCashflowView, toggleCashflowView, subscribeToErrors, exportStateAsJSON } from '../store.js';
import { onStorageError } from '../storage.js';
import { TitleBar, Footer } from './TitleBar.jsx';
import { TodayPane } from './TodayPane.jsx';
import { TomorrowPane } from './TomorrowPane.jsx';
import { HabitsPane } from './HabitsPane.jsx';
import { Calendar } from './Calendar.jsx';
import { Inspector } from './Inspector.jsx';
import { CashflowPane } from './CashflowPane.jsx';
import { HelpOverlay } from './HelpOverlay.jsx';
import { Fab } from './Fab.jsx';
import { useToast } from './Toast.jsx';
import { useKeyboard } from '../hooks/useKeyboard.js';

const HELP_AUTO_CLOSE_MS = 10_000;

export default function App() {
  const state = useStore();
  const [helpVisible, setHelpVisible] = useState(false);
  const { showToast, ToastPortal } = useToast();
  const helpTimerRef = useRef(null);
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  // ── Help auto-close logic ──────────────────────────────────────────────────
  const clearHelpTimer = useCallback(() => {
    if (helpTimerRef.current != null) {
      clearTimeout(helpTimerRef.current);
      helpTimerRef.current = null;
    }
  }, []);

  const scheduleHelpHide = useCallback(() => {
    clearHelpTimer();
    helpTimerRef.current = setTimeout(() => {
      setHelpVisible(false);
      helpTimerRef.current = null;
    }, HELP_AUTO_CLOSE_MS);
  }, [clearHelpTimer]);

  // Reset help auto-close on user activity while overlay is open.
  useEffect(() => {
    if (!helpVisible) return;
    scheduleHelpHide();

    function resetTimer() {
      if (helpVisible) scheduleHelpHide();
    }
    const events = ['keydown', 'mousemove', 'mousedown', 'wheel', 'touchstart'];
    for (const ev of events) window.addEventListener(ev, resetTimer, true);
    return () => {
      clearHelpTimer();
      for (const ev of events) window.removeEventListener(ev, resetTimer, true);
    };
  }, [helpVisible, scheduleHelpHide, clearHelpTimer]);

  // ── Error handling (storage + state errors) ────────────────────────────────
  useEffect(() => {
    function downloadBackup() {
      try {
        const data = exportStateAsJSON();
        if (!data) {
          showToastRef.current('Failed to export data', { duration: 3000 });
          return;
        }
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `habit-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToastRef.current('Backup downloaded successfully', { duration: 3000 });
      } catch (err) {
        showToastRef.current(`Export failed: ${err.message}`, { duration: 5000 });
      }
    }

    const errorMessages = {
      unavailable: 'Storage unavailable. Data will not persist.',
      quota: 'Storage full. Delete old data or export a backup.',
      corrupt: 'Saved data corrupted. Starting fresh.',
      security: 'Cannot save due to browser restrictions.',
      version: 'Data version mismatch.',
    };

    onStorageError((error) => {
      const message = errorMessages[error.type] || error.message;
      if (error.type === 'quota' || error.type === 'unavailable') {
        showToastRef.current(message, {
          action: 'export',
          onAction: downloadBackup,
          duration: 10000,
        });
      } else if (error.type === 'corrupt' && error.canRetry) {
        showToastRef.current(message, { duration: 7000 });
      } else {
        showToastRef.current(message, { duration: 6000 });
      }
    });

    const unsub = subscribeToErrors((error) => {
      if (error.type === 'critical' && error.action === 'export') {
        showToastRef.current(error.message, {
          action: 'export now',
          onAction: downloadBackup,
          duration: 0,
        });
      } else if (error.type === 'validation') {
        showToastRef.current(error.message, { duration: 4000 });
      } else {
        showToastRef.current(error.message, { duration: 5000 });
      }
    });

    return unsub;
  }, []);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  const toggleHelp = useCallback(() => {
    setHelpVisible((v) => {
      if (v) clearHelpTimer();
      return !v;
    });
  }, [clearHelpTimer]);

  const closeHelp = useCallback(() => {
    if (helpVisible) {
      setHelpVisible(false);
      clearHelpTimer();
      return true;
    }
    return false;
  }, [helpVisible, clearHelpTimer]);

  const handleToggleCashflow = useCallback(() => {
    toggleCashflowView();
  }, []);

  const getSelectedDate = useCallback(() => state.selectedDate, [state.selectedDate]);

  useKeyboard({
    onHelp: toggleHelp,
    onClose: closeHelp,
    onToggleCashflow: handleToggleCashflow,
    getSelectedDate,
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <TitleBar
        cashflowView={state.cashflowView}
        onToggleView={() => setCashflowView(!state.cashflowView)}
      />

      <div className={'body' + (state.cashflowView ? ' body-cashflow' : '')}>
        {state.cashflowView ? (
          <CashflowPane transactions={state.transactions} showToast={showToast} />
        ) : (
          <>
            <div className="left-stack">
              <TodayPane habits={state.habits} completions={state.completions} />
              <TomorrowPane />
              <HabitsPane habits={state.habits} showToast={showToast} />
            </div>
            <div className="right-stack">
              <Calendar
                viewMonth={state.viewMonth}
                selectedDate={state.selectedDate}
                completions={state.completions}
              />
              <Inspector
                habits={state.habits}
                completions={state.completions}
                selectedDate={state.selectedDate}
              />
            </div>
          </>
        )}
      </div>

      <Footer />

      <HelpOverlay
        visible={helpVisible}
        onClose={() => { setHelpVisible(false); clearHelpTimer(); }}
        showToast={showToast}
      />

      <Fab
        cashflowView={state.cashflowView}
        onToggle={() => setCashflowView(!state.cashflowView)}
      />

      <ToastPortal />
    </>
  );
}
