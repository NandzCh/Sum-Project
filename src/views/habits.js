// Full habit list — add via tomorrow.js; here we render with rename/delete.

import { h } from '../dom.js';
import { renameHabit, updateHabitDescription, deleteHabit } from '../state.js';

export function renderHabits(state) {
  const list = h('div', { class: 'habits-list' });

  if (state.habits.length === 0) {
    list.appendChild(h('div', { class: 'empty' }, '// nothing tracked yet'));
  } else {
    for (const habit of state.habits) {
      list.appendChild(renderHabitRow(habit));
    }
  }

  const head = h(
    'div',
    { class: 'pane-head' },
    h('div', { class: 'label' }, 'habits'),
    h('div', { class: 'hint' }, `${state.habits.length} tracked`),
  );
  const body = h('div', { class: 'pane-body' }, list);
  return h('section', { class: 'pane pane-habits' }, head, body);
}

function renderHabitRow(habit) {
  const nameSpan = h('div', { class: 'name' }, habit.name);
  const descSpan = habit.description
    ? h('div', { class: 'desc' }, habit.description)
    : null;

  const labelBlock = h('div', { class: 'label-block' }, nameSpan, descSpan);

  const actions = h(
    'div',
    { class: 'row-actions' },
    h(
      'button',
      {
        class: 'icon-btn',
        title: 'rename',
        onClick: () => beginEdit(habit, nameSpan, descSpan, actions, labelBlock),
      },
      'edit',
    ),
    h(
      'button',
      {
        class: 'icon-btn danger',
        title: 'delete (history is preserved)',
        onClick: () => {
          if (confirm(`Delete habit "${habit.name}"? History is preserved.`)) {
            deleteHabit(habit.id);
          }
        },
      },
      'del',
    ),
  );

  return h('div', { class: 'row' }, labelBlock, actions);
}

function beginEdit(habit, nameSpan, descSpan, actions, labelBlock) {
  const nameInput = h('input', {
    type: 'text',
    value: habit.name,
    maxlength: 80,
    spellcheck: false,
  });
  const descInput = h('input', {
    type: 'text',
    value: habit.description || '',
    placeholder: 'description (optional)',
    maxlength: 200,
    spellcheck: false,
  });

  function commit() {
    const newName = nameInput.value.trim();
    if (newName && newName !== habit.name) renameHabit(habit.id, newName);
    const newDesc = descInput.value.trim();
    if (newDesc !== (habit.description || '')) updateHabitDescription(habit.id, newDesc);
  }

  function cancel() {
    // Rely on next state notify to re-render with the original values.
    // Force a notify by triggering an idempotent rename? Simpler: dispatch a
    // synthetic input event so the row re-renders. Easiest: do nothing here —
    // the state's render cycle uses the current habit values, so unless we
    // mutated, the original spans are still valid. We rebuild by toggling.
    // We replace labelBlock with the original nodes, which still exist in DOM
    // since we never removed them.
    labelBlock.replaceChildren(nameSpan, descSpan || document.createTextNode(''));
  }

  // Save on Enter; cancel on Escape.
  for (const inp of [nameInput, descInput]) {
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      }
    });
  }

  const saveBtn = h(
    'button',
    {
      class: 'icon-btn',
      onClick: () => commit(),
    },
    'save',
  );
  const cancelBtn = h(
    'button',
    {
      class: 'icon-btn',
      onClick: () => cancel(),
    },
    'cancel',
  );

  actions.replaceChildren(saveBtn, cancelBtn);
  labelBlock.replaceChildren(nameInput, descInput);
  nameInput.focus();
  nameInput.select();
}