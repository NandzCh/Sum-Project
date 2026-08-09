// "Things I want to do tomorrow" — form for adding new habits.

import { h } from '../dom.js';
import { addHabit } from '../state.js';

export function renderTomorrow() {
  const nameInput = h('input', {
    type: 'text',
    name: 'name',
    placeholder: 'habit to start tracking…',
    maxlength: 80,
    autocomplete: 'off',
    spellcheck: false,
    'aria-label': 'habit name',
    id: 'planner-name',
    'data-persist-focus': 'true',
  });
  const descInput = h('textarea', {
    name: 'description',
    placeholder: 'optional description',
    rows: 1,
    maxlength: 200,
    spellcheck: false,
    'aria-label': 'habit description',
    id: 'planner-desc',
    'data-persist-focus': 'true',
  });
  const submit = h(
    'button',
    { class: 'primary', type: 'submit', disabled: true },
    'add ›',
  );

  const form = h(
    'form',
    {
      class: 'planner',
      onSubmit: (e) => {
        e.preventDefault();
        const name = nameInput.value;
        const description = descInput.value;
        const id = addHabit({ name, description });
        if (id) {
          nameInput.value = '';
          descInput.value = '';
          nameInput.focus();
          syncDisabled();
        }
      },
      onInput: syncDisabled,
    },
    nameInput,
    descInput,
    h('div', { class: 'full' }, submit),
  );

  function syncDisabled() {
    submit.disabled = nameInput.value.trim().length === 0;
  }
  syncDisabled();

  const head = h(
    'div',
    { class: 'pane-head' },
    h('div', { class: 'label' }, 'tomorrow’s plan'),
    h('div', { class: 'hint' }, '/ to focus'),
  );

  const body = h(
    'div',
    { class: 'pane-body' },
    h(
      'div',
      { class: 'hint', style: { color: 'var(--amber-mute)', marginBottom: '8px' } },
      '// things I want to do tomorrow',
    ),
    form,
  );

  return h('section', { class: 'pane pane-tomorrow' }, head, body);
}