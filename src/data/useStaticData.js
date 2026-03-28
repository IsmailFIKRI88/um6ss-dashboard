import { useState, useEffect, useCallback } from 'react';

// ═══════════════════════════════════════════════
// DATA LAYER — Static JSON files (public/data/)
// ═══════════════════════════════════════════════

/**
 * Generic hook for loading a JSON file from public/data/.
 * Never crashes: a 404 or network error sets available=false.
 * @param {string} filename - e.g. 'outcomes-sample.json'
 * @returns {{ data: any, loading: boolean, error: string|null, available: boolean, refresh: function }}
 */
export function useStaticData(filename) {
  const [state, setState] = useState({
    data: null, loading: false, error: null, available: false,
  });

  const fetchData = useCallback(async () => {
    if (!filename) {
      setState({ data: null, loading: false, error: null, available: false });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
    const url = `${base}/data/${filename}`;

    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });

      if (res.status === 404) {
        setState({ data: null, loading: false, error: null, available: false });
        return;
      }

      if (!res.ok) {
        setState({ data: null, loading: false, error: `${res.status}: ${res.statusText}`, available: false });
        return;
      }

      const data = await res.json();
      setState({ data, loading: false, error: null, available: true });
    } catch (err) {
      setState({ data: null, loading: false, error: err.message, available: false });
    }
  }, [filename]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { ...state, refresh: fetchData };
}
