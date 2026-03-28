import { useState, useEffect, useCallback } from 'react';

// ═══════════════════════════════════════════════
// DATA LAYER — Outcomes extended (live API + static fallback)
// ═══════════════════════════════════════════════

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const STATIC_FALLBACK = 'outcomes-sample.json';
const FALLBACK_TIMEOUT_MS = 8000;

async function outcomesFetch(baseUrl, apiKey, retries = 2) {
  const url = `${baseUrl}/outcomes-extended`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, {
      headers: { 'X-UM6SS-API-Key': apiKey, Accept: 'application/json' },
    });

    if (res.status === 429) {
      await sleep(Math.min(2000 * Math.pow(2, attempt), 10000));
      continue;
    }

    if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
    return await res.json();
  }
  throw new Error('429: Rate limit.');
}

async function loadStaticFallback() {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const res = await fetch(`${base}/data/${STATIC_FALLBACK}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return null;
  return await res.json();
}

/**
 * Fetches extended outcomes data.
 * Strategy: try live API → fall back to static JSON.
 * Exposes `source` ('live' | 'static' | null) so views can show a badge.
 */
export function useOutcomesData(apiKey, baseUrl) {
  const [state, setState] = useState({
    loading: false, error: null, available: false,
    data: null, source: null,
    lastRefresh: null,
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    // 1. Try live API (with timeout)
    if (apiKey && baseUrl) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT')), FALLBACK_TIMEOUT_MS)
        );
        const liveData = await Promise.race([
          outcomesFetch(baseUrl, apiKey),
          timeoutPromise,
        ]);
        setState({
          loading: false, error: null, available: true,
          data: liveData, source: 'live', lastRefresh: new Date(),
        });
        return;
      } catch {
        // API not available yet — fall through to static
      }
    }

    // 2. Fallback to static JSON
    try {
      const staticData = await loadStaticFallback();
      if (staticData) {
        setState({
          loading: false, error: null, available: true,
          data: staticData, source: 'static', lastRefresh: new Date(),
        });
        return;
      }
    } catch {
      // Static file not available either
    }

    // 3. Nothing available
    setState({
      loading: false, error: null, available: false,
      data: null, source: null, lastRefresh: null,
    });
  }, [apiKey, baseUrl]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { ...state, refresh: fetchData };
}
