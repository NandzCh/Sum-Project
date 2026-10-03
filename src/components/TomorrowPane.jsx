// "Things I want to do tomorrow" — form for adding new habits.

import { useState, useRef } from 'react';
import { addHabit } from '../store.js';

export function TomorrowPane() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const nameRef = useRef(null);

  function handleSubmit(e) {
    e.preventDefault();
    const id = addHabit({ name, description });
    if (id) {
      setName('');
      setDescription('');
      nameRef.current?.focus();
    }
  }

  return (
    <section className="pane pane-tomorrow">
      <div className="pane-head">
        <div className="label">tomorrow's plan</div>
        <div className="hint"> to focus</div>
      </div>
      <div className="pane-body">
        <div className="hint" style={{ color: 'var(--amber-mute)', marginBottom: '8px' }}>
          things I want to do tomorrow
        </div>
        <form className="planner" onSubmit={handleSubmit}>
          <input
            ref={nameRef}
            type="text"
            placeholder="habit to start tracking…"
            maxLength={80}
            autoComplete="off"
            spellCheck={false}
            aria-label="habit name"
            id="planner-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <textarea
            placeholder="optional description"
            rows={1}
            maxLength={200}
            spellCheck={false}
            aria-label="habit description"
            id="planner-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="full">
            <button
              className="primary"
              type="submit"
              disabled={name.trim().length === 0}
            >
              add ›
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
