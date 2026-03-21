import { useState, useEffect, useCallback } from 'react';
import { MAX_PER_PAGE, WP_ENDPOINTS } from '../config/api';

// ═══════════════════════════════════════════════
// DATA LAYER — WordPress REST API
// ═══════════════════════════════════════════════

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function apiFetch(baseUrl, endpoint, params, apiKey, retries = 3) {
  const url = new URL(`${baseUrl}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') url.searchParams.set(k, v);
  });

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url.toString(), {
      headers: { 'X-UM6SS-API-Key': apiKey, Accept: 'application/json' },
    });

    if (res.status === 429) {
      const wait = Math.min(2000 * Math.pow(2, attempt), 15000);
      await sleep(wait);
      continue;
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`${res.status}: ${text || res.statusText}`);
    }

    const data = await res.json();
    const total = parseInt(res.headers.get('X-WP-Total') || '0', 10);
    const totalPages = parseInt(res.headers.get('X-WP-TotalPages') || '1', 10);
    return { data, total, totalPages };
  }
  throw new Error('429: Rate limit — trop de requêtes. Réessayez dans quelques secondes.');
}

async function fetchAll(baseUrl, endpoint, apiKey, extraParams = {}) {
  const all = [];
  let page = 1;
  let totalPages = 1;

  do {
    const result = await apiFetch(baseUrl, endpoint, {
      ...extraParams, page, per_page: MAX_PER_PAGE,
    }, apiKey);
    all.push(...(Array.isArray(result.data) ? result.data : []));
    totalPages = result.totalPages;
    page++;
  } while (page <= totalPages && page <= 100);

  return all;
}

export function useWordPressData(apiKey, baseUrl) {
  const [state, setState] = useState({
    loading: false, error: null,
    leads: [], visits: [], abandons: [], outcomes: [], experiments: [],
    schema: null, lastRefresh: null,
  });

  const fetchData = useCallback(async () => {
    if (!apiKey || !baseUrl) {
      setState(prev => ({ ...prev, loading: false, error: 'Clé API ou URL non configurée.' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const schemaResult = await apiFetch(baseUrl, WP_ENDPOINTS.schema, {}, apiKey);

      // Fetch sequentially in 2 batches to stay under rate limit
      const [leads, visits] = await Promise.all([
        fetchAll(baseUrl, WP_ENDPOINTS.leads, apiKey).catch(() => []),
        fetchAll(baseUrl, WP_ENDPOINTS.visits, apiKey).catch(() => []),
      ]);

      const [abandons, outcomes, experiments] = await Promise.all([
        fetchAll(baseUrl, WP_ENDPOINTS.abandons, apiKey).catch(() => []),
        fetchAll(baseUrl, WP_ENDPOINTS.outcomes, apiKey).catch(() => []),
        fetchAll(baseUrl, WP_ENDPOINTS.experiments, apiKey).catch(() => []),
      ]);

      setState({
        loading: false, error: null,
        leads, visits, abandons, outcomes, experiments,
        schema: schemaResult.data,
        lastRefresh: new Date(),
      });
    } catch (err) {
      setState(prev => ({ ...prev, loading: false, error: err.message }));
    }
  }, [apiKey, baseUrl]);

  useEffect(() => { if (apiKey && baseUrl) fetchData(); }, [fetchData]);

  return { ...state, refresh: fetchData };
}
