// Help overlay — toggled by `h` key or `?`.

import { exportStateAsJSON, importStateFromJSON } from '../store.js';

export function HelpOverlay({ visible, onClose, showToast }) {
  if (!visible) return null;

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

  function handleImport() {
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
  }

  return (
    <div className="help-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="help-modal">
        <h2>help</h2>
        <dl>
          <dt><kbd>h</kbd> / <kbd>?</kbd></dt>
          <dd>toggle this help</dd>
          <dt><kbd>t</kbd></dt>
          <dd>jump the inspector to today</dd>
          <dt><kbd>j</kbd> / <kbd>k</kbd></dt>
          <dd>next / previous day in inspector</dd>
          <dt><kbd>/</kbd></dt>
          <dd>focus the tomorrow-planner input</dd>
          <dt><kbd>m</kbd></dt>
          <dd>switch to the cashflow tab (and back)</dd>
          <dt><kbd>Esc</kbd></dt>
          <dd>close help / blur inputs</dd>
        </dl>
        <h2 style={{ marginTop: '20px' }}>data</h2>
        <div style={{ marginTop: '8px' }}>
          <button
            className="bulk-btn"
            type="button"
            style={{ marginRight: '8px' }}
            onClick={downloadBackup}
          >export data</button>
          <button
            className="bulk-btn"
            type="button"
            onClick={handleImport}
          >import data</button>
        </div>
        <div className="close"> click outside or press Esc</div>
      </div>
    </div>
  );
}
