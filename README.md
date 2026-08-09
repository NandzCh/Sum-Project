# habit-tracker

A small personal habit tracker that looks like an amber CRT terminal.

## Features

- **Today** checklist — toggle habits for the current day.
- **Things I want to do tomorrow** — type habits ahead of time, they appear in the list immediately.
- **Calendar** — click any day to inspect/toggle its completions.
- **Habit list** — rename, edit description, or delete (history is preserved).
- **Keyboard** — `h` help, `t` jump to today, `j`/`k` next/prev day, `/` focus tomorrow input.

## Stack

- Vite + vanilla JS (no framework)
- localStorage for persistence (`habit-tracker:v1` key)
- JetBrains Mono via Google Fonts

## Develop

```
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`).

## Build

```
npm run build
npm run preview
```

## Data

State lives in `localStorage` under the key `habit-tracker:v1`. To reset, delete that key in DevTools → Application → Local Storage.

## Important rules for contributors

- **Never use `innerHTML`** for user input. All views build DOM via the `h()` helper in `src/dom.js`, which sets `textContent` for string children. This is the XSS-safe rule.
- **Always use local-time dates.** `src/date.js` exposes `formatKey`/`parseKey`/`todayKey`/`tomorrowKey` — never `toISOString().slice(0,10)`.
- **Deleting a habit preserves history.** The `completions` map is never mutated on deletion; the inspector filters orphan IDs.
