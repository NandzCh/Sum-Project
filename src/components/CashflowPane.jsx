// Cashflow view — income/outcome tracker.

import { useState, useRef } from 'react';
import { todayKey, prettyDay, shortDay } from '../date.js';
import {
  addTransaction,
  updateTransaction,
  deleteTransaction,
  cashflowTotals,
  undo,
} from '../store.js';

// Plain number formatter with thousand separators.
export function fmt(n) {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  const fixed = abs.toFixed(2);
  const [int, dec] = fixed.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}${grouped}.${dec}`;
}

export function CashflowPane({ transactions, showToast }) {
  const today = todayKey();
  const txs = [...transactions].sort((a, b) => {
    if (a.dateKey !== b.dateKey) return a.dateKey < b.dateKey ? 1 : -1;
    return a.createdAt < b.createdAt ? 1 : -1;
  });

  const { income, outcome, balance } = cashflowTotals(transactions);
  const monthPrefix = today.slice(0, 7);
  const monthTx = transactions.filter((t) => t.dateKey.startsWith(monthPrefix));
  const monthTotals = cashflowTotals(monthTx);
  const todayTotals = cashflowTotals(transactions.filter((t) => t.dateKey === today));

  // Form state
  const [kind, setKind] = useState('outcome');
  const [amount, setAmount] = useState('');
  const [label, setLabel] = useState('');
  const [date, setDate] = useState(today);
  const amountRef = useRef(null);

  function handleSubmit(e) {
    e.preventDefault();
    const id = addTransaction({ kind, amount, label, dateKey: date || today });
    if (id) {
      setAmount('');
      setLabel('');
      amountRef.current?.focus();
    }
  }

  // Group transactions by date for display.
  let lastDate = null;

  return (
    <section className="pane pane-cashflow">
      <div className="pane-head">
        <div className="label">cashflow</div>
        <div className="hint" />
      </div>
      <div className="pane-body cashflow-body">
        {/* Summary tiles */}
        <div className="cashflow-totals">
          <Tile label="balance" value={fmt(balance)} mod={balance >= 0 ? 'good' : 'bad'} />
          <Tile label="today" value={fmt(todayTotals.balance)} mod={todayTotals.balance >= 0 ? 'good' : 'bad'} />
          <Tile label="this month" value={fmt(monthTotals.balance)} mod={monthTotals.balance >= 0 ? 'good' : 'bad'} />
        </div>

        {/* Add form */}
        <form className="planner cashflow-form" onSubmit={handleSubmit}>
          <div className="cashflow-kind full" role="group" aria-label="transaction kind">
            <button
              type="button"
              className={'kind-btn' + (kind === 'income' ? ' active' : '')}
              onClick={() => setKind('income')}
            >+ income</button>
            <button
              type="button"
              className={'kind-btn' + (kind === 'outcome' ? ' active' : '')}
              onClick={() => setKind('outcome')}
            >- outcome</button>
          </div>
          <div className="cashflow-row">
            <input
              ref={amountRef}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              id="cashflow-amount"
              aria-label="amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <input
              type="date"
              value={date}
              id="cashflow-date"
              aria-label="date"
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="cashflow-row full">
            <input
              type="text"
              placeholder="what for? (e.g. groceries, salary)"
              id="cashflow-label"
              maxLength={80}
              spellCheck={false}
              autoComplete="off"
              aria-label="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <div className="full">
            <button className="primary" type="submit">add ›</button>
          </div>
        </form>

        {/* Aggregate pills */}
        <div className="cashflow-aggregates">
          <span className="cashflow-pill income">
            <span className="pill-label">income</span>
            <span className="pill-value">+{fmt(income)}</span>
          </span>
          <span className="cashflow-pill outcome">
            <span className="pill-label">outcome</span>
            <span className="pill-value">-{fmt(outcome)}</span>
          </span>
        </div>

        {/* Transaction list */}
        <div className="cashflow-list">
          {txs.length === 0 ? (
            <div className="empty">{'// no transactions yet — log your first one above'}</div>
          ) : (
            txs.map((tx) => {
              const header = tx.dateKey !== lastDate;
              lastDate = tx.dateKey;
              return (
                <div key={tx.id}>
                  {header && (
                    <div className="cashflow-date-head">
                      <span className="cashflow-date-label">{shortDay(tx.dateKey)}</span>
                      <span className="cashflow-date-full">{prettyDay(tx.dateKey)}</span>
                    </div>
                  )}
                  <TxRow tx={tx} showToast={showToast} />
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}

function Tile({ label, value, mod }) {
  return (
    <div className={'cashflow-tile ' + mod}>
      <div className="tile-label">{label}</div>
      <div className="tile-value">{value}</div>
    </div>
  );
}

function TxRow({ tx, showToast }) {
  const [editing, setEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(tx.label);
  const [editAmount, setEditAmount] = useState(tx.amount);
  const [editDate, setEditDate] = useState(tx.dateKey);
  const [editKind, setEditKind] = useState(tx.kind);

  const sign = tx.kind === 'income' ? '+' : '-';
  const mod = tx.kind === 'income' ? 'income' : 'outcome';

  function beginEdit() {
    setEditLabel(tx.label);
    setEditAmount(tx.amount);
    setEditDate(tx.dateKey);
    setEditKind(tx.kind);
    setEditing(true);
  }

  function commitEdit() {
    updateTransaction(tx.id, {
      kind: editKind,
      amount: editAmount,
      label: editLabel,
      dateKey: editDate || tx.dateKey,
    });
    setEditing(false);
  }

  function cancelEdit() {
    setEditing(false);
  }

  function handleDelete() {
    if (confirm(`Delete ${tx.kind} of ${fmt(tx.amount)}${tx.label ? ' for "' + tx.label + '"' : ''}?`)) {
      deleteTransaction(tx.id);
      showToast(`Deleted ${tx.kind} transaction`, {
        action: 'undo',
        onAction: () => {
          const result = undo();
          if (result) showToast(`Restored ${result.type}`, { duration: 3000 });
        },
      });
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
    else if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
  }

  if (editing) {
    return (
      <div className="row cashflow-row">
        <div className="label-block">
          <div className="cashflow-inline-edit">
            <div className="cashflow-row full">
              <input
                type="text"
                value={editLabel}
                placeholder="what for?"
                maxLength={80}
                spellCheck={false}
                autoFocus
                onChange={(e) => setEditLabel(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="cashflow-row">
              <input
                type="number"
                min="0"
                step="0.01"
                value={editAmount}
                aria-label="amount"
                onChange={(e) => setEditAmount(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <input
                type="date"
                value={editDate}
                aria-label="date"
                onChange={(e) => setEditDate(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                type="button"
                className={'kind-btn' + (editKind === 'income' ? ' active' : '')}
                onClick={() => setEditKind(editKind === 'income' ? 'outcome' : 'income')}
              >
                {editKind === 'income' ? '+ income' : '- outcome'}
              </button>
            </div>
          </div>
        </div>
        <div className="row-actions">
          <button className="icon-btn" onClick={commitEdit}>save</button>
          <button className="icon-btn" onClick={cancelEdit}>cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="row cashflow-row">
      <div className="label-block">
        <div className="name">{tx.label || '(no label)'}</div>
        <div className="desc">{tx.kind === 'income' ? 'income' : 'outcome'}</div>
      </div>
      <div className={'cashflow-amount ' + mod}>{sign}{fmt(tx.amount)}</div>
      <div className="row-actions">
        <button className="icon-btn" title="edit" onClick={beginEdit}>edit</button>
        <button className="icon-btn danger" title="delete" onClick={handleDelete}>del</button>
      </div>
    </div>
  );
}
