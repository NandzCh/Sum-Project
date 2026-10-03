// Month grid calendar component.

import { monthGrid, WEEKDAY_LABELS, todayKey } from '../date.js';
import { selectDate, setViewMonth } from '../store.js';

export function Calendar({ viewMonth, selectedDate, completions }) {
  const { year, month } = viewMonth;
  const { weeks, monthLabel } = monthGrid(year, month);
  const today = todayKey();

  function shiftMonth(delta) {
    let y = year;
    let m = month + delta;
    while (m < 0) { m += 12; y -= 1; }
    while (m > 11) { m -= 12; y += 1; }
    setViewMonth(y, m);
  }

  return (
    <section className="pane pane-calendar">
      <div className="pane-body">
        <div className="calendar-head">
          <div className="month">
            {monthLabel}
            <span className="cursor" aria-hidden="true" />
          </div>
          <div className="nav">
            <button
              title="previous month"
              aria-label="previous month"
              onClick={() => shiftMonth(-1)}
            >‹</button>
            <button
              title="next month"
              aria-label="next month"
              onClick={() => shiftMonth(1)}
            >›</button>
          </div>
        </div>
        <div className="calendar">
          {WEEKDAY_LABELS.map((wd) => (
            <div key={wd} className="wd">{wd}</div>
          ))}
          {weeks.flat().map((cell, i) => {
            const classes = ['cell'];
            if (!cell.inMonth) classes.push('outside');
            if (cell.key === today) classes.push('today');
            if (cell.key === selectedDate) classes.push('selected');

            const dayMap = completions[cell.key] || {};
            const doneCount = Object.values(dayMap).filter(Boolean).length;

            return (
              <button
                key={i}
                className={classes.join(' ')}
                aria-label={cell.key}
                aria-pressed={cell.key === selectedDate ? 'true' : 'false'}
                onClick={() => selectDate(cell.key)}
              >
                <span className="num">{cell.day}</span>
                <span className="fills">
                  {Array.from({ length: Math.min(doneCount, 6) }, (_, j) => (
                    <span key={j} className="pip" />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
