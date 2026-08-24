import { useEffect } from 'react';
import { DATA_CHANGED_EVENT } from '../utils/dataSync';

// Calls `onChange` whenever a mutation affecting any of `resources` succeeds
// anywhere in the app (not just on this page) — e.g. adding a Masjid on the
// Masjid Registration page updates a Masjid dropdown/count on this page too,
// without a manual browser refresh. Pass '*' to react to any change
// (used by the Dashboard and Reports, whose numbers depend on everything).
//
// `resources` may be a string or array; `onChange` should be stable
// (wrap it in useCallback) to avoid needless resubscribes, though an
// unstable callback is still safe, just slightly less efficient.
export default function useDataSync(resources, onChange) {
  const list = Array.isArray(resources) ? resources : [resources];
  const key = list.join(',');

  useEffect(() => {
    const handler = (event) => {
      const changed = event.detail?.resource;
      if (list.includes('*') || list.includes(changed)) {
        onChange();
      }
    };
    window.addEventListener(DATA_CHANGED_EVENT, handler);
    return () => window.removeEventListener(DATA_CHANGED_EVENT, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, onChange]);
}
