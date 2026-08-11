// Cashflow view — separate "tab" from the habit tracker. Same amber-CRT theme.
// Tracks income/outcome with a label (what the cash was used for) and a date.

import { h } from '../dom.js';
import { todayKey, prettyDay, shortDay, parseKey } from '../date.js';
import {
  addTransaction,
  updateTransaction,
  deleteTransaction,
  cashflowTotals,
} from '../state.js';

// Plain number formatter with thousand separators, no currency symbol.
export function fmt(n) {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  const fixed = abs.toFixed(2);
  const [int, dec] = fixed.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}${grouped}.${dec}`;
}

export function renderCashflow(state) {
  const today = todayKey();
  const txs = [...state.transactions].sort((a, b) => {
    if (a.dateKey !== b.dateKey) return a.dateKey < b.dateKey ? 1 : -1;
    return a.createdAt < b.createdAt ? 1 : -1;
  });

  const { income, outcome, balance } = cashflowTotals(state.transactions);
  const monthPrefix = today.slice(0, 7);
  const monthTx = state.transactions.filter((t) => t.dateKey.startsWith(monthPrefix));
  const monthTotals = cashflowTotals(monthTx);
  const todayTotals = cashflowTotals(state.transactions.filter((t) => t.dateKey === today));

  const head = h(
    'div',
    { class: 'pane-head' },
    h('div', { class: 'label' }, 'cashflow'),
    h('div', { class: 'hint' }, 'm to return to habits'),
  );

  const body = h('div', { class: 'pane-body cashflow-body' });

  // Top: summary tiles (balance / today / this month).
  body.appendChild(
    h(
      'div',
      { class: 'cashflow-totals' },
      renderTile('balance', fmt(balance), balance >= 0 ? 'good' : 'bad'),
      renderTile('today', fmt(todayTotals.balance), todayTotals.balance >= 0 ? 'good' : 'bad'),
      renderTile('this month', fmt(monthTotals.balance), monthTotals.balance >= 0 ? 'good' : 'bad'),
    ),
  );

  // The form: kind toggle, amount, label, date.
  const kindField = h('input', {
    type: 'hidden',
    value: 'outcome',
    id: 'cashflow-kind',
  });
  const kindToggle = renderKindToggle(kindField);
  const amountInput = h('input', {
    type: 'number',
    min: '0',
    step: '0.01',
    placeholder: '0.00',
    id: 'cashflow-amount',
    'aria-label': 'amount',
    'data-persist-focus': 'true',
    inputmode: 'decimal',
  });
  const labelInput = h('input', {
    type: 'text',
    placeholder: 'what for? (e.g. groceries, salary)',
    id: 'cashflow-label',
    maxlength: 80,
    spellcheck: false,
    autocomplete: 'off',
    'aria-label': 'label',
    'data-persist-focus': 'true',
  });
  const dateInput = h('input', {
    type: 'date',
    value: today,
    id: 'cashflow-date',
    'aria-label': 'date',
    'data-persist-focus': 'true',
  });
  const submit = h(
    'button',
    { class: 'primary', type: 'submit' },
    'add ›',
  );

  const form = h(
    'form',
    {
      class: 'planner cashflow-form',
      onSubmit: (e) => {
        e.preventDefault();
        const id = addTransaction({
          kind: kindField.value,
          amount: amountInput.value,
          label: labelInput.value,
          dateKey: dateInput.value || today,
        });
        if (id) {
          amountInput.value = '';
          labelInput.value = '';
          // Date stays — the user is likely logging several things in a row
          // for the same day. Kind also stays — usually you're logging a series
          // of outcomes or a series of incomes.
          amountInput.focus();
        }
      },
    },
    kindField,
    kindToggle,
    h('div', { class: 'cashflow-row' }, amountInput, dateInput),
    h('div', { class: 'cashflow-row full' }, labelInput),
    h('div', { class: 'full' }, submit),
  );

  body.appendChild(form);

  // Aggregate line under the form.
  const aggregates = h(
    'div',
    { class: 'cashflow-aggregates' },
    h(
      'span',
      { class: 'cashflow-pill income' },
      h('span', { class: 'pill-label' }, 'income'),
      h('span', { class: 'pill-value' }, '+' + fmt(income)),
    ),
    h(
      'span',
      { class: 'cashflow-pill outcome' },
      h('span', { class: 'pill-label' }, 'outcome'),
      h('span', { class: 'pill-value' }, '-' + fmt(outcome)),
    ),
  );
  body.appendChild(aggregates);

  // List, grouped by date.
  const list = h('div', { class: 'cashflow-list' });
  if (txs.length === 0) {
    list.appendChild(
      h('div', { class: 'empty' }, '// no transactions yet — log your first one above'),
    );
  } else {
    let lastDate = null;
    for (const tx of txs) {
      if (tx.dateKey !== lastDate) {
        list.appendChild(renderDateHeader(tx.dateKey));
        lastDate = tx.dateKey;
      }
      list.appendChild(renderTxRow(tx));
    }
  }
  body.appendChild(list);

  return h('section', { class: 'pane pane-cashflow' }, head, body);
}

function renderTile(label, value, mod) {
  return h(
    'div',
    { class: 'cashflow-tile ' + mod },
    h('div', { class: 'tile-label' }, label),
    h('div', { class: 'tile-value' }, value),
  );
}

function renderKindToggle(hiddenField) {
  const btnIncome = h(
    'button',
    {
      type: 'button',
      class: 'kind-btn',
      onClick: () => setKind('income'),
    },
    '+ income',
  );
  const btnOutcome = h(
    'button',
    {
      type: 'button',
      class: 'kind-btn active',
      onClick: () => setKind('outcome'),
    },
    '- outcome',
  );

  function setKind(kind) {
    hiddenField.value = kind;
    if (kind === 'income') {
      btnIncome.classList.add('active');
      btnOutcome.classList.remove('active');
    } else {
      btnOutcome.classList.add('active');
      btnIncome.classList.remove('active');
    }
  }

  return h(
    'div',
    { class: 'cashflow-kind full', role: 'group', 'aria-label': 'transaction kind' },
    btnIncome,
    btnOutcome,
  );
}

function renderDateHeader(dateKey) {
  return h(
    'div',
    { class: 'cashflow-date-head' },
    h('span', { class: 'cashflow-date-label' }, shortDay(dateKey)),
    h('span', { class: 'cashflow-date-full' }, prettyDay(dateKey)),
  );
}

function renderTxRow(tx) {
  const sign = tx.kind === 'income' ? '+' : '-';
  const mod = tx.kind === 'income' ? 'income' : 'outcome';

  const nameEl = h('div', { class: 'name' }, tx.label || '(no label)');
  const metaEl = h(
    'div',
    { class: 'desc' },
    tx.kind === 'income' ? 'income' : 'outcome',
  );
  const valueEl = h('div', { class: 'cashflow-amount ' + mod }, sign + fmt(tx.amount));

  const labelBlock = h('div', { class: 'label-block' }, nameEl, metaEl);

  const actions = h(
    'div',
    { class: 'row-actions' },
    h(
      'button',
      {
        class: 'icon-btn',
        title: 'edit',
        onClick: () => beginEdit(tx, labelBlock, valueEl, actions),
      },
      'edit',
    ),
    h(
      'button',
      {
        class: 'icon-btn danger',
        title: 'delete',
        onClick: () => {
          if (confirm(`Delete ${tx.kind} of ${fmt(tx.amount)}${tx.label ? ' for "' + tx.label + '"' : ''}?`)) {
            deleteTransaction(tx.id);
          }
        },
      },
      'del',
    ),
  );

  return h('div', { class: 'row cashflow-row' }, labelBlock, valueEl, actions);
}

function beginEdit(tx, labelBlock, valueEl, actions) {
  const labelInput = h('input', {
    type: 'text',
    value: tx.label,
    placeholder: 'what for?',
    maxlength: 80,
    spellcheck: false,
  });
  const amountInput = h('input', {
    type: 'number',
    min: '0',
    step: '0.01',
    value: tx.amount,
    'aria-label': 'amount',
  });
  const dateInput = h('input', {
    type: 'date',
    value: tx.dateKey,
    'aria-label': 'date',
  });
  const kindField = h('input', { type: 'hidden', value: tx.kind });
  const kindBtn = h('button', {
    type: 'button',
    class: 'kind-btn ' + (tx.kind === 'income' ? 'active' : ''),
    onClick: () => {
      kindField.value = kindField.value === 'income' ? 'outcome' : 'income';
      kindBtn.classList.toggle('active');
      kindBtn.textContent = kindField.value === 'income' ? '+ income' : '- outcome';
    },
  }, tx.kind === 'income' ? '+ income' : '- outcome');

  const editBox = h(
    'div',
    { class: 'cashflow-inline-edit' },
    h('div', { class: 'cashflow-row full' }, labelInput),
    h('div', { class: 'cashflow-row' }, amountInput, dateInput, kindBtn, kindField),
  );

  function commit() {
    updateTransaction(tx.id, {
      kind: kindField.value,
      amount: amountInput.value,
      label: labelInput.value,
      dateKey: dateInput.value || tx.dateKey,
    });
  }

  function cancel() {
    // Re-render via state notify by triggering a no-op state write.
    // Simpler: dispatch an input event on a hidden input to wake subscribers.
    // Easiest: replace the edit block back with the original nodes.
    labelBlock.replaceChildren(renderOriginalName(tx), renderOriginalMeta(tx));
    valueEl.textContent = (tx.kind === 'income' ? '+' : '-') + fmt(tx.amount);
    actions.replaceChildren(renderOriginalActions(tx, labelBlock, valueEl, actions));
  }

  for (const inp of [labelInput, amountInput, dateInput]) {
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

  const saveBtn = h('button', { class: 'icon-btn', onClick: commit }, 'save');
  const cancelBtn = h('button', { class: 'icon-btn', onClick: cancel }, 'cancel');
  actions.replaceChildren(saveBtn, cancelBtn);
  labelBlock.replaceChildren(editBox);
  labelInput.focus();
  labelInput.select();
}

function renderOriginalName(tx) {
  return h('div', { class: 'name' }, tx.label || '(no label)');
}
function renderOriginalMeta(tx) {
  return h('div', { class: 'desc' }, tx.kind === 'income' ? 'income' : 'outcome');
}
function renderOriginalActions(tx, labelBlock, valueEl, actions) {
  return h(
    'div',
    { class: 'row-actions' },
    h(
      'button',
      {
        class: 'icon-btn',
        title: 'edit',
        onClick: () => beginEdit(tx, labelBlock, valueEl, actions),
      },
      'edit',
    ),
    h(
      'button',
      {
        class: 'icon-btn danger',
        title: 'delete',
        onClick: () => {
          if (confirm(`Delete this ${tx.kind}?`)) deleteTransaction(tx.id);
        },
      },
      'del',
    ),
  );
}

// Used by main.js to give the cashflow input a focus shortcut similar to '/'.
export function focusCashflowAmount() {
  const el = document.getElementById('cashflow-amount');
  if (el) el.focus();
}

// keep parseKey reachable from this module so it isn't tree-shaken if useful later
export const _parseKey = parseKey;
