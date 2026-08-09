// Month grid renderer.

import { h } from './dom.js';
import { monthGrid, WEEKDAY_LABELS, todayKey } from './date.js';
import { selectDate, setViewMonth, getState } from './state.js';

export function renderCalendar(state) {
  const { year, month } = state.viewMonth;
  const { weeks, monthLabel } = monthGrid(year, month);
  const today = todayKey();

  const head = h(
    'div',
    { class: 'calendar-head' },
    h(
      'div',
      { class: 'month' },
      monthLabel,
      h('span', { class: 'cursor', 'aria-hidden': 'true' }),
    ),
    h(
      'div',
      { class: 'nav' },
      h(
        'button',
        {
          title: 'previous month',
          'aria-label': 'previous month',
          onClick: () => shiftMonth(-1),
        },
        '‹',
      ),
      h(
        'button',
        {
          title: 'next month',
          'aria-label': 'next month',
          onClick: () => shiftMonth(1),
        },
        '›',
      ),
    ),
  );

  const grid = h('div', { class: 'calendar' });
  for (const wd of WEEKDAY_LABELS) {
    grid.appendChild(h('div', { class: 'wd' }, wd));
  }
  for (const week of weeks) {
    for (const cell of week) {
      grid.appendChild(renderCell(cell, today, state.selectedDate, state.completions));
    }
  }

  const body = h('div', { class: 'pane-body' }, head, grid);
  return h('section', { class: 'pane pane-calendar' }, body);
}

function renderCell(cell, today, selected, completions) {
  const classes = ['cell'];
  if (!cell.inMonth) classes.push('outside');
  if (cell.key === today) classes.push('today');
  if (cell.key === selected) classes.push('selected');

  const dayMap = completions[cell.key] || {};
  const doneCount = Object.values(dayMap).filter(Boolean).length;
  const fills = h('span', { class: 'fills' });
  for (let i = 0; i < Math.min(doneCount, 6); i++) {
    fills.appendChild(h('span', { class: 'pip' }));
  }

  return h(
    'button',
    {
      class: classes.join(' '),
      'aria-label': cell.key,
      'aria-pressed': cell.key === selected ? 'true' : 'false',
      onClick: () => selectDate(cell.key),
    },
    h('span', { class: 'num' }, String(cell.day)),
    fills,
  );
}

function shiftMonth(delta) {
  const { viewMonth } = getState();
  let { year, month } = viewMonth;
  month += delta;
  while (month < 0) { month += 12; year -= 1; }
  while (month > 11) { month -= 12; year += 1; }
  setViewMonth(year, month);
}
