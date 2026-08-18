// Orchestrator: load state, mount views, subscribe to changes, wire keyboard.

import './styles.css';

import { getState, subscribe, setCashflowView, subscribeToErrors, exportStateAsJSON, importStateFromJSON } from './state.js';
import { renderTitleBar, renderFooter, startClock } from './views/titlebar.js';
import { renderTomorrow } from './views/tomorrow.js';
import { renderToday } from './views/today.js';
import { renderHabits } from './views/habits.js';
import { renderCalendar } from './calendar.js';
import { renderInspector } from './views/inspector.js';
import { renderCashflow } from './views/cashflow.js';
import { attachKeyboard } from './keyboard.js';
import { h, qs, clear } from './dom.js';
import { showToast } from './toast.js';
import { onStorageError } from './storage.js';

const root = qs('#app');
const HELP_AUTO_CLOSE_MS = 10_000;

// Static chrome — title bar + footer (footer text doesn't change).
function mountChrome() {
  const titleBar = renderTitleBar();
  const body = h('div', { class: 'body' });
  const footer = renderFooter();
  clear(root);
  root.appendChild(titleBar);
  root.appendChild(body);
  root.appendChild(footer);
  startClock(qs('#clock', titleBar));
  // Make the title bar clickable as a tab switcher (habits ↔ cashflow).
  const titleEl = qs('.titlebar .title', titleBar);
  if (titleEl) {
    titleEl.style.cursor = 'pointer';
    titleEl.title = 'click to switch view';
    titleEl.addEventListener('click', () => {
      const { cashflowView } = getState();
      setCashflowView(!cashflowView);
    });
  }
  return { body };
}

const refs = mountChrome();

// Error handling: subscribe to storage and state errors and show toasts.
onStorageError((error) => {
  const errorMessages = {
    unavailable: 'Storage unavailable. Data will not persist.',
    quota: 'Storage full. Delete old data or export a backup.',
    corrupt: 'Saved data corrupted. Starting fresh.',
    security: 'Cannot save due to browser restrictions.',
    version: 'Data version mismatch.',
  };

  const message = errorMessages[error.type] || error.message;

  if (error.type === 'quota' || error.type === 'unavailable') {
    showToast(message, {
      action: 'export',
      onAction: () => downloadBackup(),
      duration: 10000,
    });
  } else if (error.type === 'corrupt' && error.canRetry) {
    showToast(message, { duration: 7000 });
  } else {
    showToast(message, { duration: 6000 });
  }
});

subscribeToErrors((error) => {
  if (error.type === 'critical' && error.action === 'export') {
    showToast(error.message, {
      action: 'export now',
      onAction: () => downloadBackup(),
      duration: 0, // Don't auto-hide critical errors
    });
  } else if (error.type === 'validation') {
    showToast(error.message, { duration: 4000 });
  } else {
    showToast(error.message, { duration: 5000 });
  }
});

// Helper to download data backup as JSON file.
function downloadBackup() {
  try {
    const data = exportStateAsJSON();
    if (!data) {
      showToast('Failed to export data', { duration: 3000 });
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

    showToast('Backup downloaded successfully', { duration: 3000 });
  } catch (err) {
    showToast(`Export failed: ${err.message}`, { duration: 5000 });
  }
}

// Reactive: re-render body content on state changes.
// We preserve focus + selection across re-renders by remembering the active
// input's id and selection range, then restoring it after the swap.
function render() {
  const state = getState();
  const prev = document.activeElement;
  let focusId = null;
  let selStart = null;
  let selEnd = null;
  if (prev && prev instanceof HTMLElement && prev.id && prev.dataset.persistFocus !== undefined) {
    focusId = prev.id;
    if (prev instanceof HTMLInputElement || prev instanceof HTMLTextAreaElement) {
      try { selStart = prev.selectionStart; selEnd = prev.selectionEnd; } catch {}
    }
  }
  if (state.cashflowView) {
    refs.body.classList.add('body-cashflow');
    refs.body.replaceChildren(renderCashflow(state));
  } else {
    refs.body.classList.remove('body-cashflow');
    refs.body.replaceChildren(
      h(
        'div',
        { class: 'left-stack' },
        renderToday(state),
        renderTomorrow(),
        renderHabits(state),
      ),
      h(
        'div',
        { class: 'right-stack' },
        renderCalendar(state),
        renderInspector(state),
      ),
    );
  }
  if (focusId) {
    const next = document.getElementById(focusId);
    if (next) {
      next.focus();
      try {
        if (selStart != null && 'setSelectionRange' in next) {
          next.setSelectionRange(selStart, selEnd);
        }
      } catch {}
    }
  }

  // Update the title bar to reflect the current tab.
  const titleEl = document.getElementById('app-title');
  if (titleEl) {
    titleEl.textContent = state.cashflowView
      ? 'cashflow — ~/ledger'
      : 'habit-tracker — ~/journal';
  }
}
render();
subscribe(render);

// Help overlay — toggled by `h`.
const overlay = h('div', {
  class: 'help-overlay',
  hidden: true,
  onClick: (e) => {
    if (e.target === overlay) overlay.hidden = true;
  },
});

const exportBtn = h(
  'button',
  {
    class: 'bulk-btn',
    type: 'button',
    style: 'margin-right: 8px;',
    onClick: () => downloadBackup(),
  },
  'export data',
);

const importBtn = h(
  'button',
  {
    class: 'bulk-btn',
    type: 'button',
    onClick: () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json,.json';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const success = importStateFromJSON(ev.target.result);
            if (success) {
              showToast('Data imported successfully. Reloading...', { duration: 2000 });
              setTimeout(() => window.location.reload(), 2000);
            } else {
              showToast('Import failed. Check console for details.', { duration: 5000 });
            }
          } catch (err) {
            showToast(`Import error: ${err.message}`, { duration: 5000 });
          }
        };
        reader.readAsText(file);
      };
      input.click();
    },
  },
  'import data',
);

overlay.appendChild(
  h(
    'div',
    { class: 'help-modal' },
    h('h2', {}, 'help'),
    h(
      'dl',
      {},
      h('dt', {}, h('kbd', {}, 'h'), ' / ', h('kbd', {}, '?')),
      h('dd', {}, 'toggle this help'),
      h('dt', {}, h('kbd', {}, 't')),
      h('dd', {}, 'jump the inspector to today'),
      h('dt', {}, h('kbd', {}, 'j'), ' / ', h('kbd', {}, 'k')),
      h('dd', {}, 'next / previous day in inspector'),
      h('dt', {}, h('kbd', {}, '/')),
      h('dd', {}, 'focus the tomorrow-planner input'),
      h('dt', {}, h('kbd', {}, 'm')),
      h('dd', {}, 'switch to the cashflow tab (and back)'),
      h('dt', {}, h('kbd', {}, 'Esc')),
      h('dd', {}, 'close help / blur inputs'),
    ),
    h('h2', { style: 'margin-top: 20px;' }, 'data'),
    h(
      'div',
      { style: 'margin-top: 8px;' },
      exportBtn,
      importBtn,
    ),
    h('div', { class: 'close' }, ' click outside or press Esc'),
  ),
);
document.body.appendChild(overlay);

// Auto-dismiss the help overlay after 10s of no user input (no keyboard or
// mouse activity). Any input resets the timer; the timer only runs while the
// overlay is visible.

let helpHideTimer = null;
function clearHelpHideTimer() {
  if (helpHideTimer != null) {
    clearTimeout(helpHideTimer);
    helpHideTimer = null;
  }
}
function scheduleHelpHide() {
  clearHelpHideTimer();
  helpHideTimer = setTimeout(() => {
    overlay.hidden = true;
    helpHideTimer = null;
  }, HELP_AUTO_CLOSE_MS);
}
function resetHelpHide() {
  if (overlay.hidden) return;
  scheduleHelpHide();
}
window.addEventListener('keydown', resetHelpHide, true);
window.addEventListener('mousemove', resetHelpHide, true);
window.addEventListener('mousedown', resetHelpHide, true);
window.addEventListener('wheel', resetHelpHide, true);
window.addEventListener('touchstart', resetHelpHide, true);

attachKeyboard({
  onHelp: () => {
    overlay.hidden = !overlay.hidden;
    if (overlay.hidden) clearHelpHideTimer();
    else scheduleHelpHide();
  },
  onClose: () => {
    if (!overlay.hidden) {
      overlay.hidden = true;
      clearHelpHideTimer();
      return true;
    }
    return false;
  },
  onToggleCashflow: () => {
    const { cashflowView } = getState();
    setCashflowView(!cashflowView);
  },
});

// Dev-time escape hatch for poking at state from the console.
if (import.meta.env && import.meta.env.DEV) {
  import('./state.js').then((m) => {
    window.__habits = m;
  });
}

// Floating action button — left-bottom shortcut to open the cashflow view.
// Visible on every screen; toggles cashflowView in state so the existing
// render cycle handles the swap (no separate routing layer needed).
const fab = h(
  'button',
  {
    class: 'fab-cashflow',
    type: 'button',
    title: 'open cashflow (m)',
    'aria-label': 'open cashflow',
    onClick: () => {
      const { cashflowView } = getState();
      setCashflowView(!cashflowView);
    },
  },
  h('span', { class: 'fab-icon', 'aria-hidden': 'true' }, '$'),
  h('span', { class: 'fab-label' }, 'cashflow'),
);
document.body.appendChild(fab);

// Reflect the current view in the FAB so it acts as a toggle, not just an
// open shortcut. (Kept here rather than inside render() so a single
// subscription is enough.)
function syncFab() {
  const { cashflowView } = getState();
  if (cashflowView) {
    fab.classList.add('active');
    const lbl = qs('.fab-label', fab);
    if (lbl) lbl.textContent = 'habits';
    fab.title = 'back to habits (m)';
    fab.setAttribute('aria-label', 'back to habits');
  } else {
    fab.classList.remove('active');
    const lbl = qs('.fab-label', fab);
    if (lbl) lbl.textContent = 'cashflow';
    fab.title = 'open cashflow (m)';
    fab.setAttribute('aria-label', 'open cashflow');
  }
}
syncFab();
subscribe(syncFab);