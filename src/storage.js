// localStorage I/O. Versioned schema so future migrations are possible.

const KEY = 'habit-tracker:v1';
const SCHEMA = 1;

let warned = false;

export function load() {
  let raw = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch (err) {
    warnOnce('localStorage unavailable; session will not persist.');
  }
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.schema === SCHEMA) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ schema: SCHEMA, ...state }));
  } catch (err) {
    warnOnce('Could not save to localStorage — running in-memory only.');
  }
}

export function clearStorage() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

function warnOnce(msg) {
  if (warned) return;
  warned = true;
  // eslint-disable-next-line no-console
  console.warn(`[habit-tracker] ${msg}`);
}
