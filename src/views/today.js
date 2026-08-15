// Today's checklist. Renders all habits with a [x]/[ ] toggle bound to today.

import { h } from '../dom.js';
import { todayKey, prettyDay } from '../date.js';
import { setCompletion } from '../state.js';

export function renderToday(state) {
  const dateKey = todayKey();
  const dayMap = state.completions[dateKey] || {};
  const activeHabits = state.habits.filter((h) => !h.archived);

  const completedCount = activeHabits.filter((h) => dayMap[h.id]).length;
  const allDone = activeHabits.length > 0 && completedCount === activeHabits.length;

  const bulkActions = activeHabits.length > 0 ? h(
    'div',
    { class: 'bulk-actions' },
    h(
      'button',
      {
        class: 'bulk-btn',
        type: 'button',
        title: allDone ? 'clear all' : 'complete all',
        onClick: () => {
          for (const habit of activeHabits) {
            setCompletion(dateKey, habit.id, !allDone);
          }
        },
      },
      allDone ? 'clear all' : 'complete all',
    ),
  ) : null;

  const head = h(
    'div',
    { class: 'pane-head' },
    h('div', { class: 'label' }, 'today'),
    h('div', { class: 'hint' }, prettyDay(dateKey)),
    bulkActions,
  );

  const list = h('div', { class: 'today-list' });

  if (activeHabits.length === 0) {
    list.appendChild(
      h('div', { class: 'empty' }, '// no habits yet — type one below to begin'),
    );
  } else {
    for (const habit of activeHabits) {
      const done = Boolean(dayMap[habit.id]);
      list.appendChild(renderRow(habit, done, dateKey));
    }
  }

  const body = h('div', { class: 'pane-body' }, list);
  return h('section', { class: 'pane pane-today' }, head, body);
}

function renderRow(habit, done, dateKey) {
  const toggleBtn = h(
    'button',
    {
      class: 'check' + (done ? ' done' : ''),
      'aria-pressed': done ? 'true' : 'false',
      title: done ? 'click to mark undone' : 'click to mark done',
      onClick: () => setCompletion(dateKey, habit.id, !done),
    },
    done ? 'x' : ' ',
  );

  const labelBlock = h(
    'div',
    { class: 'label-block' },
    h('div', { class: 'name' }, habit.name),
    habit.description ? h('div', { class: 'desc' }, habit.description) : null,
  );

  return h(
    'div',
    { class: 'row' + (done ? ' done' : '') },
    toggleBtn,
    labelBlock,
  );
}