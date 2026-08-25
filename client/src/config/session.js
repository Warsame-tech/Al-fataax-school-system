// Single source of truth for session-timeout tuning. This value drives the
// frontend's idle-logout redirect timing. The actual enforcement is on the
// server (server/.env's JWT_EXPIRES_IN + POST /api/auth/heartbeat) — that
// value must be kept equal to this one for the two to line up.
export const IDLE_TIMEOUT_MS = 60 * 1000; // 60 seconds

// How often a heartbeat (session-extending) ping may be sent while the user
// is continuously active. Must stay comfortably below IDLE_TIMEOUT_MS so an
// active user's session is always refreshed well before it would expire.
export const HEARTBEAT_INTERVAL_MS = 15 * 1000; // 15 seconds
