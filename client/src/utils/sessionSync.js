// Cross-tab session synchronization via a same-origin BroadcastChannel
// (standard Web API, no dependency, mirrors the pattern already used by
// utils/dataSync.js for cross-tab data refresh). Two things get relayed:
//   - "activity": a tab detected real user activity, so every open tab
//     should treat the session as active (one shared idle clock, not one
//     independent 60s timer per tab).
//   - "logout": a tab logged out (idle timeout or an expired-session 401),
//     so every other tab should immediately clear its own auth state and
//     redirect too, instead of waiting for its own timer or next request.
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('al-fataax-session-sync') : null;

let onRemoteActivity = null;
let onRemoteLogout = null;

if (channel) {
  channel.onmessage = (event) => {
    const type = event.data?.type;
    if (type === 'activity') onRemoteActivity?.();
    else if (type === 'logout') onRemoteLogout?.();
  };
}

export function notifyActivity() {
  channel?.postMessage({ type: 'activity' });
}

export function notifyLogout() {
  channel?.postMessage({ type: 'logout' });
}

// Only one subscriber is ever needed (AuthContext, mounted once at the
// app root), so this is a simple set-the-callback registry rather than a
// full pub/sub list.
export function subscribeSessionSync({ onActivity, onLogout }) {
  onRemoteActivity = onActivity;
  onRemoteLogout = onLogout;
  return () => {
    onRemoteActivity = null;
    onRemoteLogout = null;
  };
}

// Fired locally (same tab only) whenever any API response comes back 401,
// so a session that expired server-side (the backend enforcement, not just
// the frontend timer) is reflected immediately even if this tab's own idle
// timer never fires — e.g. a background auto-refresh request happens to be
// the first thing to notice the token is gone.
export const SESSION_EXPIRED_EVENT = 'al-fataax:session-expired';

export function emitSessionExpired() {
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}
