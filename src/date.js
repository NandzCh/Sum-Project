// Pure date helpers. All keys are local-time YYYY-MM-DD — never toISOString().
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(now = new Date()) {
  return formatKey(now);
}

export function tomorrowKey(now = new Date()) {
  const t = new Date(now);
  t.setDate(t.getDate() + 1);
  return formatKey(t);
}

export function shiftDay(key, n) {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return formatKey(d);
}

export function monthLabel(year, month) {
  return `${MONTHS[month]} ${year}`;
}

export function weekdayLabel(index) {
  return WEEKDAYS[index];
}

export const WEEKDAY_LABELS = WEEKDAYS;

// Build a 6-row x 7-col grid for the given month. Each cell is either
// { day, key, inMonth: true } or { inMonth: false } for padding.
export function monthGrid(year, month) {
  const first = new Date(year, month, 1);
  const lead = first.getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const weeks = [];
  let row = [];
  for (let i = 0; i < lead; i++) {
    const day = daysInPrev - lead + i + 1;
    row.push({ day, key: formatKey(new Date(year, month - 1, day)), inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    row.push({ day: d, key: formatKey(new Date(year, month, d)), inMonth: true });
    if (row.length === 7) {
      weeks.push(row);
      row = [];
    }
  }
  if (row.length) {
    // Fill remaining cells of the last week with next-month days starting at 1.
    let nextDay = 1;
    while (row.length < 7) {
      const dd = new Date(year, month + 1, nextDay);
      row.push({ day: dd.getDate(), key: formatKey(dd), inMonth: false });
      nextDay++;
    }
    weeks.push(row);
  }
  // Pad to 6 rows total so the grid is always a fixed height — each row is a
  // consecutive next-month week.
  while (weeks.length < 6) {
    const last = weeks[weeks.length - 1][6].key;
    const lastDate = parseKey(last);
    const row2 = [];
    for (let i = 1; i <= 7; i++) {
      const dd = new Date(lastDate);
      dd.setDate(lastDate.getDate() + i);
      row2.push({ day: dd.getDate(), key: formatKey(dd), inMonth: false });
    }
    weeks.push(row2);
  }
  return { weeks, monthLabel: `${MONTHS[month]} ${year}` };
}

// Returns { year, month } for the given key.
export function yearMonthOf(key) {
  const d = parseKey(key);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function prettyDay(key) {
  const d = parseKey(key);
  const weekday = WEEKDAYS[d.getDay()];
  return `${weekday}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function shortDay(key) {
  const d = parseKey(key);
  return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
}
