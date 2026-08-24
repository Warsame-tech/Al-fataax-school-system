import { useEffect, useRef } from 'react';

const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

// Calls onIdle after `timeoutMs` of no user activity (mouse/keyboard/touch/
// scroll). The timer only runs while `enabled` is true, and resets on every
// activity event — so it measures time since the LAST interaction, not time
// since mount.
export default function useIdleTimer(onIdle, timeoutMs, enabled) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(onIdle, timeoutMs);
    };

    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, resetTimer));
    resetTimer();

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, timeoutMs, onIdle]);
}
