import { useEffect, useRef } from 'react';
import { IDLE_TIMEOUT_MS, HEARTBEAT_INTERVAL_MS } from '../config/session';
import { notifyActivity, subscribeSessionSync } from '../utils/sessionSync';

// Only real, direct user interaction resets the idle clock — deliberately
// NOT wired to axios/fetch responses, so background API calls and
// auto-refreshes (see utils/dataSync.js) never count as activity.
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
const CHECK_INTERVAL_MS = 1000;

// Client-side mirror of the server-enforced idle timeout: calls onIdleTimeout
// after IDLE_TIMEOUT_MS of no activity, in this tab OR any other open tab
// (activity is broadcast cross-tab so every tab shares one effective idle
// clock). While active, sends a throttled heartbeat so the server-side
// session (the actual enforcement — see server/authenticate.js) stays alive
// for as long as the user genuinely is. onRemoteLogout fires when another
// tab logs out, so this tab follows immediately without waiting on its own
// timer or its own next failed request.
export default function useSessionTimeout({ enabled, onIdleTimeout, onRemoteLogout, heartbeat }) {
  const lastActivityRef = useRef(Date.now());
  const lastHeartbeatRef = useRef(0);

  useEffect(() => {
    if (!enabled) return undefined;

    lastActivityRef.current = Date.now();
    lastHeartbeatRef.current = Date.now();

    const registerActivity = () => {
      lastActivityRef.current = Date.now();
      notifyActivity();

      const now = Date.now();
      if (now - lastHeartbeatRef.current >= HEARTBEAT_INTERVAL_MS) {
        lastHeartbeatRef.current = now;
        heartbeat?.();
      }
    };

    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, registerActivity));

    const unsubscribe = subscribeSessionSync({
      onActivity: () => {
        lastActivityRef.current = Date.now();
      },
      onLogout: () => onRemoteLogout?.(),
    });

    const interval = setInterval(() => {
      if (Date.now() - lastActivityRef.current >= IDLE_TIMEOUT_MS) {
        onIdleTimeout();
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, registerActivity));
      unsubscribe();
      clearInterval(interval);
    };
  }, [enabled, onIdleTimeout, onRemoteLogout, heartbeat]);
}
