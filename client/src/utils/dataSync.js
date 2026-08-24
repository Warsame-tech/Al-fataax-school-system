// Lightweight, dependency-free data-sync bus. When any POST/PUT/PATCH/DELETE
// succeeds anywhere in the app (wired centrally in axiosClient.js, not
// per-page), it broadcasts which resource changed. Any mounted component
// that cares subscribes via `useDataSync` (see hooks/useDataSync.js) and
// refetches its own data — no window.location.reload(), no full-page
// refresh, and pages that aren't affected never re-render.
//
// A same-origin BroadcastChannel (standard Web API, no dependency, no
// server component) relays the same event across browser tabs/windows, so
// two open tabs stay in sync too — e.g. saving a result in one tab updates
// a report open in another, without either tab reloading.
export const DATA_CHANGED_EVENT = 'al-fataax:data-changed';

const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('al-fataax-data-sync') : null;

if (channel) {
  channel.onmessage = (event) => {
    const resource = event.data?.resource;
    if (!resource) return;
    // Re-dispatch locally only — never post back to the channel here, or
    // every tab would echo the message back and forth forever.
    window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT, { detail: { resource } }));
  };
}

export function emitDataChanged(resource) {
  if (!resource) return;
  window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT, { detail: { resource } }));
  channel?.postMessage({ resource });
}

// Maps an API URL path to the resource key it affects. Order matters only in
// that each prefix is distinct, so a simple find is fine.
const RESOURCE_PATTERNS = [
  [/^\/buildings/, 'masjids'],
  [/^\/fans/, 'fans'],
  [/^\/subjects/, 'books'],
  [/^\/classes/, 'stages'],
  [/^\/students/, 'students'],
  [/^\/teachers/, 'teachers'],
  [/^\/coordinators/, 'coordinators'],
  [/^\/users/, 'users'],
  [/^\/results/, 'results'],
];

export function resourceFromUrl(url) {
  if (!url) return null;
  const path = url.split('?')[0];
  const match = RESOURCE_PATTERNS.find(([pattern]) => pattern.test(path));
  return match ? match[1] : null;
}

const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete']);

export function isMutatingMethod(method) {
  return MUTATING_METHODS.has(String(method || '').toLowerCase());
}
