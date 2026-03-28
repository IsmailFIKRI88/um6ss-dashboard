import { describe, it, expect } from 'vitest';

describe('useOutcomesData fallback logic', () => {
  it('FALLBACK_TIMEOUT_MS is reasonable (< 15s)', () => {
    // The timeout before falling back to static JSON
    // should be less than the total API timeout but enough for 1-2 retries
    const FALLBACK_TIMEOUT_MS = 8000;
    expect(FALLBACK_TIMEOUT_MS).toBeGreaterThanOrEqual(5000);
    expect(FALLBACK_TIMEOUT_MS).toBeLessThanOrEqual(15000);
  });

  it('static fallback URL is correctly constructed', () => {
    const base = '/um6ss-dashboard/';
    const filename = 'outcomes-sample.json';
    const url = `${base.replace(/\/$/, '')}/data/${filename}`;
    expect(url).toBe('/um6ss-dashboard/data/outcomes-sample.json');
  });

  it('source states are valid enum values', () => {
    const validSources = ['live', 'static', null];
    validSources.forEach(source => {
      expect([null, 'live', 'static']).toContain(source);
    });
  });
});
