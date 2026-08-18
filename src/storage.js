// localStorage I/O. Versioned schema so future migrations are possible.

const KEY = 'habit-tracker:v1';
const SCHEMA = 1;

let warned = false;
let storageAvailable = true;
let errorCallback = null;

// Register a callback for storage errors so the UI can show toasts.
export function onStorageError(fn) {
  errorCallback = fn;
}

function notifyError(type, message, canRetry = false) {
  if (errorCallback) {
    errorCallback({ type, message, canRetry });
  }
  // eslint-disable-next-line no-console
  console.error(`[habit-tracker] ${message}`);
}

function warnOnce(msg) {
  if (warned) return;
  warned = true;
  // eslint-disable-next-line no-console
  console.warn(`[habit-tracker] ${msg}`);
}

export function isStorageAvailable() {
  return storageAvailable;
}

export function load() {
  let raw = null;
  try {
    if (!window.localStorage) {
      storageAvailable = false;
      notifyError('unavailable', 'localStorage is not available. Your data will not persist after closing the browser.');
      return null;
    }
    raw = localStorage.getItem(KEY);
  } catch (err) {
    storageAvailable = false;
    warnOnce('localStorage unavailable; session will not persist.');
    notifyError('unavailable', 'Cannot access localStorage. Running in private/incognito mode? Your data will be lost on close.');
    return null;
  }

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.schema === SCHEMA) return parsed;

    // Schema mismatch — could add migration logic here in the future.
    if (parsed && parsed.schema !== SCHEMA) {
      notifyError('version', `Data schema version mismatch (found ${parsed.schema}, expected ${SCHEMA}). Your data may not load correctly.`);
    }
    return null;
  } catch (err) {
    notifyError('corrupt', 'Saved data is corrupted and cannot be loaded. Starting fresh.', true);
    return null;
  }
}

export function save(state) {
  if (!storageAvailable) return false;

  try {
    const serialized = JSON.stringify({ schema: SCHEMA, ...state });
    localStorage.setItem(KEY, serialized);
    return true;
  } catch (err) {
    // Check for quota exceeded error.
    if (err.name === 'QuotaExceededError' || err.code === 22 || err.code === 1014) {
      notifyError('quota', 'Storage quota exceeded. Try deleting old transactions or habits to free up space.', true);
    } else if (err.name === 'SecurityError') {
      storageAvailable = false;
      notifyError('security', 'Cannot save due to browser security settings. Running in private mode?');
    } else {
      notifyError('save', `Failed to save data: ${err.message}`, true);
    }
    warnOnce('Could not save to localStorage — running in-memory only.');
    return false;
  }
}

export function clearStorage() {
  try {
    localStorage.removeItem(KEY);
    return true;
  } catch (err) {
    notifyError('clear', 'Failed to clear storage.');
    return false;
  }
}

// Export data as JSON for backup.
export function exportData() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return raw;
  } catch (err) {
    notifyError('export', 'Failed to export data.');
    return null;
  }
}

// Import data from JSON backup.
export function importData(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid data format');
    }
    if (parsed.schema !== SCHEMA) {
      throw new Error(`Schema version mismatch (found ${parsed.schema}, expected ${SCHEMA})`);
    }
    localStorage.setItem(KEY, jsonString);
    return true;
  } catch (err) {
    notifyError('import', `Failed to import data: ${err.message}`);
    return false;
  }
}
