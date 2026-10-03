// Title bar — window chrome with traffic-light dots.

import { useState, useEffect } from 'react';

export function TitleBar({ cashflowView, onToggleView }) {
  const [time, setTime] = useState(formatTime);

  useEffect(() => {
    const id = setInterval(() => setTime(formatTime()), 60000);
    return () => clearInterval(id);
  }, []);

  const title = cashflowView
    ? 'cashflow — ~/ledger'
    : 'habit-tracker — ~/journal';

  return (
    <header className="titlebar">
      <div className="dots" aria-hidden="true">
        <span className="dot r" />
        <span className="dot y" />
        <span className="dot g" />
      </div>
      <div
        className="title"
        id="app-title"
        style={{ cursor: 'pointer' }}
        title="click to switch view"
        onClick={onToggleView}
      >
        {title}
      </div>
      <div className="clock" id="clock">{time}</div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="keys">
        <span>type </span>
        <kbd>h</kbd>
        <span> for help</span>
      </div>
      <div>
        <kbd>t</kbd> today{' '}
        <kbd>j</kbd>/<kbd>k</kbd> day{' '}
        <kbd>/</kbd> tomorrow{' '}
        <kbd>m</kbd> cashflow{' '}
        <kbd>Esc</kbd> close
      </div>
    </footer>
  );
}

function formatTime() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}
