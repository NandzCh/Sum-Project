// Full habit list — add via tomorrow.js; here we render with rename/delete.

import { h } from '../dom.js';
import { renameHabit, updateHabitDescription, deleteHabit, moveHabit, archiveHabit, unarchiveHabit, undo } from '../state.js';
import { showToast } from '../toast.js';

export function renderHabits(state) {
  const list = h('div', { class: 'habits-list' });

  const activeHabits = state.habits.filter((h) => !h.archived);
  const archivedHabits = state.habits.filter((h) => h.archived);

  if (activeHabits.length === 0 && archivedHabits.length === 0) {
    list.appendChild(h('div', { class: 'empty' }, '// nothing tracked yet'));
  } else {
    if (activeHabits.length > 0) {
      for (let i = 0; i < activeHabits.length; i++) {
        list.appendChild(renderHabitRow(activeHabits[i], i, activeHabits.length, false));
      }
    }

    if (archivedHabits.length > 0) {
      const archiveToggle = h(
        'button',
        {
          class: 'archive-toggle',
          type: 'button',
          onClick: (e) => {
            const section = e.target.nextElementSibling;
            if (section) {
              section.hidden = !section.hidden;
              e.target.textContent = section.hidden
                ? `// show ${archivedHabits.length} archived ›`
                : `// hide ${archivedHabits.length} archived ‹`;
            }
          },
        },
        `// show ${archivedHabits.length} archived ›`,
      );
      list.appendChild(archiveToggle);

      const archiveSection = h('div', { class: 'archive-section', hidden: true });
      for (const habit of archivedHabits) {
        archiveSection.appendChild(renderHabitRow(habit, -1, -1, true));
      }
      list.appendChild(archiveSection);
    }
  }

  const head = h(
    'div',
    { class: 'pane-head' },
    h('div', { class: 'label' }, 'habits'),
    h('div', { class: 'hint' }, `${activeHabits.length} active${archivedHabits.length > 0 ? ` · ${archivedHabits.length} archived` : ''}`),
  );
  const body = h('div', { class: 'pane-body' }, list);
  return h('section', { class: 'pane pane-habits' }, head, body);
}

function renderHabitRow(habit, index, total, isArchived) {
  const nameSpan = h('div', { class: 'name' }, habit.name);
  const descSpan = habit.description
    ? h('div', { class: 'desc' }, habit.description)
    : null;

  const labelBlock = h('div', { class: 'label-block' }, nameSpan, descSpan);

  const actionButtons = [
    h(
      'button',
      {
        class: 'icon-btn',
        title: 'rename',
        onClick: () => beginEdit(habit, nameSpan, descSpan, actions, labelBlock),
      },
      'edit',
    ),
  ];

  if (isArchived) {
    actionButtons.push(
      h(
        'button',
        {
          class: 'icon-btn',
          title: 'unarchive (restore to active list)',
          onClick: () => unarchiveHabit(habit.id),
        },
        'unarchive',
      ),
    );
  } else {
    actionButtons.push(
      h(
        'button',
        {
          class: 'icon-btn',
          title: 'archive (hide from active list)',
          onClick: () => archiveHabit(habit.id),
        },
        'archive',
      ),
    );
  }

  actionButtons.push(
    h(
      'button',
      {
        class: 'icon-btn danger',
        title: 'delete (history is preserved)',
        onClick: () => {
          if (confirm(`Delete habit "${habit.name}"? History is preserved.`)) {
            deleteHabit(habit.id);
            showToast(`Deleted "${habit.name}"`, {
              action: 'undo',
              onAction: () => {
                const result = undo();
                if (result) {
                  showToast(`Restored "${result.name}"`, { duration: 3000 });
                }
              },
            });
          }
        },
      },
      'del',
    ),
  );

  const actions = h('div', { class: 'row-actions' });

  if (!isArchived && index >= 0 && total > 0) {
    const reorderActions = h(
      'div',
      { class: 'reorder-actions' },
      h(
        'button',
        {
          class: 'icon-btn reorder-btn',
          title: 'move up',
          disabled: index === 0,
          onClick: () => moveHabit(habit.id, 'up'),
        },
        '↑',
      ),
      h(
        'button',
        {
          class: 'icon-btn reorder-btn',
          title: 'move down',
          disabled: index === total - 1,
          onClick: () => moveHabit(habit.id, 'down'),
        },
        '↓',
      ),
    );
    actions.appendChild(reorderActions);
  }

  for (const btn of actionButtons) {
    actions.appendChild(btn);
  }

  const rowClass = isArchived ? 'row archived-row' : 'row';
  return h('div', { class: rowClass }, labelBlock, actions);
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