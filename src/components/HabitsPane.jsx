// Full habit list — rename, reorder, archive, delete with undo.

import { useState } from 'react';
import {
  renameHabit,
  updateHabitDescription,
  deleteHabit,
  moveHabit,
  archiveHabit,
  unarchiveHabit,
  undo,
} from '../store.js';

export function HabitsPane({ habits, showToast }) {
  const [showArchived, setShowArchived] = useState(false);
  const activeHabits = habits.filter((h) => !h.archived);
  const archivedHabits = habits.filter((h) => h.archived);

  return (
    <section className="pane pane-habits">
      <div className="pane-head">
        <div className="label">habits</div>
        <div className="hint">
          {activeHabits.length} active
          {archivedHabits.length > 0 && ` · ${archivedHabits.length} archived`}
        </div>
      </div>
      <div className="pane-body">
        <div className="habits-list">
          {activeHabits.length === 0 && archivedHabits.length === 0 && (
            <div className="empty">nothing tracked yet</div>
          )}

          {activeHabits.map((habit, i) => (
            <HabitRow
              key={habit.id}
              habit={habit}
              index={i}
              total={activeHabits.length}
              isArchived={false}
              showToast={showToast}
            />
          ))}

          {archivedHabits.length > 0 && (
            <>
              <button
                className="archive-toggle"
                type="button"
                onClick={() => setShowArchived(!showArchived)}
              >
                {showArchived
                  ? `// hide ${archivedHabits.length} archived ‹`
                  : `// show ${archivedHabits.length} archived ›`}
              </button>
              {showArchived && (
                <div className="archive-section">
                  {archivedHabits.map((habit) => (
                    <HabitRow
                      key={habit.id}
                      habit={habit}
                      index={-1}
                      total={-1}
                      isArchived
                      showToast={showToast}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function HabitRow({ habit, index, total, isArchived, showToast }) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(habit.name);
  const [editDesc, setEditDesc] = useState(habit.description || '');

  function beginEdit() {
    setEditName(habit.name);
    setEditDesc(habit.description || '');
    setEditing(true);
  }

  function commitEdit() {
    const newName = editName.trim();
    if (newName && newName !== habit.name) renameHabit(habit.id, newName);
    const newDesc = editDesc.trim();
    if (newDesc !== (habit.description || '')) updateHabitDescription(habit.id, newDesc);
    setEditing(false);
  }

  function cancelEdit() {
    setEditing(false);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
    else if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
  }

  function handleDelete() {
    if (confirm(`Delete habit "${habit.name}"? History is preserved.`)) {
      deleteHabit(habit.id);
      showToast(`Deleted "${habit.name}"`, {
        action: 'undo',
        onAction: () => {
          const result = undo();
          if (result) showToast(`Restored "${result.name}"`, { duration: 3000 });
        },
      });
    }
  }

  const rowClass = isArchived ? 'row archived-row' : 'row';

  return (
    <div className={rowClass}>
      <div className="label-block">
        {editing ? (
          <>
            <input
              type="text"
              value={editName}
              maxLength={80}
              spellCheck={false}
              autoFocus
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <input
              type="text"
              value={editDesc}
              placeholder="description (optional)"
              maxLength={200}
              spellCheck={false}
              onChange={(e) => setEditDesc(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </>
        ) : (
          <>
            <div className="name">{habit.name}</div>
            {habit.description && <div className="desc">{habit.description}</div>}
          </>
        )}
      </div>
      <div className="row-actions">
        {!isArchived && index >= 0 && total > 0 && (
          <div className="reorder-actions">
            <button
              className="icon-btn reorder-btn"
              title="move up"
              disabled={index === 0}
              onClick={() => moveHabit(habit.id, 'up')}
            >↑</button>
            <button
              className="icon-btn reorder-btn"
              title="move down"
              disabled={index === total - 1}
              onClick={() => moveHabit(habit.id, 'down')}
            >↓</button>
          </div>
        )}
        {editing ? (
          <>
            <button className="icon-btn" onClick={commitEdit}>save</button>
            <button className="icon-btn" onClick={cancelEdit}>cancel</button>
          </>
        ) : (
          <>
            <button className="icon-btn" title="rename" onClick={beginEdit}>edit</button>
            {isArchived ? (
              <button
                className="icon-btn"
                title="unarchive (restore to active list)"
                onClick={() => unarchiveHabit(habit.id)}
              >unarchive</button>
            ) : (
              <button
                className="icon-btn"
                title="archive (hide from active list)"
                onClick={() => archiveHabit(habit.id)}
              >archive</button>
            )}
            <button className="icon-btn danger" title="delete (history is preserved)" onClick={handleDelete}>
              del
            </button>
          </>
        )}
      </div>
    </div>
  );
}
