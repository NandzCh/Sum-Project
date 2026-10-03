// Toast notification system.

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';

// Hook that provides showToast / hideToast + renders the portal.
export function useToast() {
  const [toast, setToast] = useState(null);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  const hideToast = useCallback(() => {
    setVisible(false);
    setTimeout(() => setToast(null), 300);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const showToast = useCallback((message, options = {}) => {
    // Clear previous
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setToast({ message, ...options });
    // Force reflow then show
    requestAnimationFrame(() => setVisible(true));

    const duration = options.duration !== undefined ? options.duration : 5000;
    if (duration > 0) {
      timerRef.current = setTimeout(() => hideToast(), duration);
    }
  }, [hideToast]);

  const ToastPortal = useCallback(() => {
    if (!toast) return null;
    return createPortal(
      <div className="toast-container">
        <div className={'toast' + (visible ? ' show' : '')}>
          <span className="toast-message">{toast.message}</span>
          {toast.action && (
            <button
              className="toast-action"
              type="button"
              onClick={() => {
                toast.onAction?.();
                hideToast();
              }}
            >
              {toast.action}
            </button>
          )}
          <button
            className="toast-close"
            type="button"
            title="close"
            onClick={hideToast}
          >×</button>
        </div>
      </div>,
      document.body,
    );
  }, [toast, visible, hideToast]);

  return { showToast, hideToast, ToastPortal };
}
