// Inspector — selected day's completions.

import { prettyDay } from '../date.js';
import { setCompletion } from '../store.js';

export function Inspector({ habits, completions, selectedDate }) {
  const dateKey = selectedDate;
  const dayMap = completions[dateKey] || {};

  // Build rows — known habits + orphan IDs from history.
  const rows = [];
  for (const habit of habits) {
    rows.push({ habit, done: Boolean(dayMap[habit.id]), archived: false });
  }
  for (const id of Object.keys(dayMap)) {
    if (!habits.some((h) => h.id === id)) {
      rows.push({
        habit: { id, name: '(archived habit)', description: '' },
        done: true,
        archived: true,
      });
    }
  }

  let doneCount = 0;
  for (const row of rows) {
    if (row.done) doneCount++;
  }

  return (
    <section className="pane pane-inspector">
      <div className="pane-head">
        <div className="label">inspector</div>
        <div className="hint">{prettyDay(dateKey)}</div>
      </div>
      <div className="pane-body">
        {rows.length > 0 && (
          <div className="inspector-summary">
            {doneCount} / {rows.length} complete
          </div>
        )}
        <div className="inspector-list">
          {rows.length === 0 ? (
            <div className="empty">{'// no habits defined — add some on the left'}</div>
          ) : (
            rows.map((row) => (
              <div key={row.habit.id} className={'row' + (row.done ? ' done' : '')}>
                {row.archived ? (
                  <button className="check done" disabled title="archived habit">x</button>
                ) : (
                  <button
                    className={'check' + (row.done ? ' done' : '')}
                    onClick={() => setCompletion(dateKey, row.habit.id, !row.done)}
                  >
                    {row.done ? 'x' : ' '}
                  </button>
                )}
                <div className="label-block">
                  <div className="name">{row.habit.name}</div>
                  {row.habit.description && <div className="desc">{row.habit.description}</div>}
                  {row.archived && <div className="desc">habit was deleted; history kept</div>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
