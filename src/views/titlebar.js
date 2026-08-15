// Title bar — window chrome with traffic-light dots and footer help line.

import { h } from '../dom.js';

export function renderTitleBar() {
  return h(
    'header',
    { class: 'titlebar' },
    h(
      'div',
      { class: 'dots', 'aria-hidden': 'true' },
      h('span', { class: 'dot r' }),
      h('span', { class: 'dot y' }),
      h('span', { class: 'dot g' }),
    ),
    h('div', { class: 'title', id: 'app-title' }, 'habit-tracker — ~/journal'),
    h('div', { class: 'clock', id: 'clock' }, ''),
  );
}

export function renderFooter() {
  return h(
    'footer',
    { class: 'footer' },
    h(
      'div',
      { class: 'keys' },
      h('span', {}, "type "),
      h('kbd', {}, 'h'),
      h('span', {}, ' for help'),
    ),
    h(
      'div',
      {},
      h('kbd', {}, 't'),
      ' today ',
      h('kbd', {}, 'j'),
      '/',
      h('kbd', {}, 'k'),
      ' day ',
      h('kbd', {}, '/'),
      ' tomorrow ',
      h('kbd', {}, 'm'),
      ' cashflow ',
      h('kbd', {}, 'Esc'),
      ' close',
    ),
  );
}

// Clock — independent of state. Updates every minutes.
export function startClock(node) {
  function tick() {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    node.textContent = `${hh}:${mm}`;
  }
  tick();
  const id = setInterval(tick, 60000);
  return () => clearInterval(id);
}