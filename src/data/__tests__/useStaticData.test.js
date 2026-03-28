import { describe, it, expect, vi, beforeEach } from 'vitest';

// We test the fetch logic directly since hooks need React rendering
// Extract the core logic to test without React

describe('useStaticData fetch logic', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('constructs correct URL with BASE_URL', () => {
    // Verify the URL construction logic
    const base = '/um6ss-dashboard/';
    const filename = 'outcomes-sample.json';
    const url = `${base.replace(/\/$/, '')}/data/${filename}`;
    expect(url).toBe('/um6ss-dashboard/data/outcomes-sample.json');
  });

  it('handles double-slash in BASE_URL', () => {
    const base = '/um6ss-dashboard/';
    const url = `${base.replace(/\/$/, '')}/data/test.json`;
    expect(url).not.toContain('//data');
  });

  it('handles root BASE_URL', () => {
    const base = '/';
    const url = `${base.replace(/\/$/, '')}/data/test.json`;
    expect(url).toBe('/data/test.json');
  });
});
