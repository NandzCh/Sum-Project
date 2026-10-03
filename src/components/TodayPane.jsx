// Today's checklist — all habits with a toggle bound to today.

import { todayKey, prettyDay } from '../date.js';
import { setCompletion } from '../store.js';

export function TodayPane({ habits, completions }) {
  const dateKey = todayKey();
  const dayMap = completions[dateKey] || {};
  const activeHabits = habits.filter((h) => !h.archived);
  const completedCount = activeHabits.filter((h) => dayMap[h.id]).length;
  const allDone = activeHabits.length > 0 && completedCount === activeHabits.length;

  return (
    <section className="pane pane-today">
      <div className="pane-head">
        <div className="label">today</div>
        <div className="hint">{prettyDay(dateKey)}</div>
        {activeHabits.length > 0 && (
          <div className="bulk-actions">
            <button
              className="bulk-btn"
              type="button"
              title={allDone ? 'clear all' : 'complete all'}
              onClick={() => {
                for (const habit of activeHabits) {
                  setCompletion(dateKey, habit.id, !allDone);
                }
              }}
            >
              {allDone ? 'clear all' : 'complete all'}
            </button>
          </div>
        )}
      </div>
      <div className="pane-body">
        <div className="today-list">
          {activeHabits.length === 0 ? (
            <div className="empty">{'// no habits yet — type one below to begin'}</div>
          ) : (
            activeHabits.map((habit) => {
              const done = Boolean(dayMap[habit.id]);
              return (
                <div key={habit.id} className={'row' + (done ? ' done' : '')}>
                  <button
                    className={'check' + (done ? ' done' : '')}
                    aria-pressed={done ? 'true' : 'false'}
                    title={done ? 'click to mark undone' : 'click to mark done'}
                    onClick={() => setCompletion(dateKey, habit.id, !done)}
                  >
                    {done ? 'x' : ' '}
                  </button>
                  <div className="label-block">
                    <div className="name">{habit.name}</div>
                    {habit.description && <div className="desc">{habit.description}</div>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
