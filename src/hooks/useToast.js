import { useCallback, useRef, useState } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (message, tone = 'success') => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setToasts((current) => [...current.slice(-3), { id, message, tone }]);
      const timer = window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== id));
        timers.current.delete(id);
      }, 2600);
      timers.current.set(id, timer);
      return id;
    },
    [],
  );

  return { toasts, toast, dismissToast };
}
