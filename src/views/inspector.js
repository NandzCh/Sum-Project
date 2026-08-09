// Inspector — selected day's completions. Skips orphan habit IDs.

import { h } from '../dom.js';
import { prettyDay } from '../date.js';
import { setCompletion } from '../state.js';

export function renderInspector(state) {
  const dateKey = state.selectedDate;
  const dayMap = state.completions[dateKey] || {};

  // Build the list — only known habits, but flag unknown IDs as "archived".
  const rows = [];
  for (const habit of state.habits) {
    rows.push({ habit, done: Boolean(dayMap[habit.id]), archived: false });
  }
  for (const id of Object.keys(dayMap)) {
    if (!state.habits.some((h) => h.id === id)) {
      rows.push({
        habit: { id, name: '(archived habit)', description: '' },
        done: true,
        archived: true,
      });
    }
  }

  const head = h(
    'div',
    { class: 'pane-head' },
    h('div', { class: 'label' }, 'inspector'),
    h('div', { class: 'hint' }, prettyDay(dateKey)),
  );

  const list = h('div', { class: 'inspector-list' });

  const summary = h('div', { class: 'inspector-summary' });

  if (rows.length === 0) {
    list.appendChild(
      h('div', { class: 'empty' }, '// no habits defined — add some on the left'),
    );
  } else {
    let doneCount = 0;
    for (const row of rows) {
      if (row.done) doneCount++;
      list.appendChild(renderInspectorRow(row, dateKey));
    }
    summary.textContent = `${doneCount} / ${rows.length} complete`;
  }

  const body = h('div', { class: 'pane-body' }, summary, list);
  return h('section', { class: 'pane pane-inspector' }, head, body);
}

function renderInspectorRow(row, dateKey) {
  const { habit, done, archived } = row;

  const toggleBtn = archived
    ? h(
        'button',
        { class: 'check done', disabled: true, title: 'archived habit' },
        'x',
      )
    : h(
        'button',
        {
          class: 'check' + (done ? ' done' : ''),
          onClick: () => setCompletion(dateKey, habit.id, !done),
        },
        done ? 'x' : ' ',
      );

  const labelBlock = h(
    'div',
    { class: 'label-block' },
    h('div', { class: 'name' }, habit.name),
    habit.description ? h('div', { class: 'desc' }, habit.description) : null,
    archived ? h('div', { class: 'desc' }, 'habit was deleted; history kept') : null,
  );

  return h('div', { class: 'row' + (done ? ' done' : '') }, toggleBtn, labelBlock);
}