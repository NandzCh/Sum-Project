// React entry point.

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App.jsx';
import './styles.css';

createRoot(document.getElementById('app')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Dev-time escape hatch for poking at state from the console.
if (import.meta.env?.DEV) {
  import('./store.js').then((m) => {
    window.__habits = m;
  });
}
