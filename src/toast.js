// Toast notification system for undo and other feedback.

import { h } from './dom.js';

let toastContainer = null;
let activeToast = null;
let toastTimeout = null;

function ensureContainer() {
  if (!toastContainer) {
    toastContainer = h('div', { class: 'toast-container' });
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

export function showToast(message, options = {}) {
  const container = ensureContainer();

  // Clear any existing toast
  if (activeToast) {
    activeToast.remove();
    if (toastTimeout) {
      clearTimeout(toastTimeout);
      toastTimeout = null;
    }
  }

  const toast = h('div', { class: 'toast' });
  const messageEl = h('span', { class: 'toast-message' }, message);
  toast.appendChild(messageEl);

  if (options.action) {
    const actionBtn = h(
      'button',
      {
        class: 'toast-action',
        type: 'button',
        onClick: () => {
          if (options.onAction) options.onAction();
          hideToast();
        },
      },
      options.action,
    );
    toast.appendChild(actionBtn);
  }

  const closeBtn = h(
    'button',
    {
      class: 'toast-close',
      type: 'button',
      title: 'close',
      onClick: () => hideToast(),
    },
    '×',
  );
  toast.appendChild(closeBtn);

  container.appendChild(toast);
  activeToast = toast;

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Auto-hide after duration (default 5s)
  const duration = options.duration !== undefined ? options.duration : 5000;
  if (duration > 0) {
    toastTimeout = setTimeout(() => hideToast(), duration);
  }
}

export function hideToast() {
  if (!activeToast) return;

  activeToast.classList.remove('show');
  setTimeout(() => {
    if (activeToast) {
      activeToast.remove();
      activeToast = null;
    }
  }, 300); // Match CSS transition duration

  if (toastTimeout) {
    clearTimeout(toastTimeout);
    toastTimeout = null;
  }
}
