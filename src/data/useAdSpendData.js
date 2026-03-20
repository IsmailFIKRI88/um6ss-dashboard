import { useState, useEffect, useCallback } from 'react';
import { MAX_PER_PAGE, ADS_ENDPOINTS } from '../config/api';

// ═══════════════════════════════════════════════
// DATA LAYER — Ad Spend (from WordPress REST API)
// ═══════════════════════════════════════════════

async function adsFetch(baseUrl, endpoint, params, apiKey) {
  const url = new URL(`${baseUrl}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString(), {
    headers: { 'X-UM6SS-API-Key': apiKey, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text().catch(() => res.statusText)}`);
  const data = await res.json();
  const totalPages = parseInt(res.headers.get('X-WP-TotalPages') || '1', 10);
  return { data, totalPages };
}

async function adsFetchAll(baseUrl, endpoint, apiKey, extraParams = {}) {
  const all = [];
  let page = 1;
  let totalPages = 1;
  do {
    const result = await adsFetch(baseUrl, endpoint, { ...extraParams, page, per_page: MAX_PER_PAGE }, apiKey);
    all.push(...(Array.isArray(result.data) ? result.data : []));
    totalPages = result.totalPages;
    page++;
  } while (page <= totalPages && page <= 50);
  return all;
}

export function useAdSpendData(apiKey, baseUrl) {
  const [state, setState] = useState({
    loading: false, error: null, available: false,
    spend: [], breakdowns: [], video: [],
    adSchema: null, lastRefresh: null,
  });

  const fetchData = useCallback(async () => {
    if (!apiKey || !baseUrl) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Check if ad-spend tables exist via ad-schema
      const schemaRes = await adsFetch(baseUrl, ADS_ENDPOINTS.adSchema, {}, apiKey);
      const adSchema = schemaRes.data;

      const hasData = adSchema?.endpoints?.ad_spend?.total_rows > 0;
      if (!hasData) {
        setState(prev => ({
          ...prev, loading: false, available: false,
          adSchema, spend: [], breakdowns: [], video: [],
          lastRefresh: new Date(),
        }));
        return;
      }

      const [spend, breakdowns, video] = await Promise.all([
        adsFetchAll(baseUrl, ADS_ENDPOINTS.adSpend, apiKey, { min_spend: 0.01 }).catch(() => []),
        adsFetchAll(baseUrl, ADS_ENDPOINTS.adBreakdowns, apiKey).catch(() => []),
        adsFetchAll(baseUrl, ADS_ENDPOINTS.adVideo, apiKey).catch(() => []),
      ]);

      setState({
        loading: false, error: null, available: true,
        spend, breakdowns, video, adSchema,
        lastRefresh: new Date(),
      });
    } catch (err) {
      setState(prev => ({ ...prev, loading: false, error: err.message }));
    }
  }, [apiKey, baseUrl]);

  useEffect(() => { if (apiKey && baseUrl) fetchData(); }, [fetchData]);

  return { ...state, refresh: fetchData };
}
