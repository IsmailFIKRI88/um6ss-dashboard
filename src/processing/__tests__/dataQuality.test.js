import { describe, it, expect } from 'vitest';
import { computeDataQuality } from '../dataQuality';

describe('computeDataQuality', () => {
  const makeLead = (overrides = {}) => ({
    id: Math.random().toString(36),
    email: `test${Math.random()}@test.com`,
    programme_label: 'Médecine',
    channel_group: 'Paid Social',
    score: '50',
    first_touch_source: 'google',
    bot_score: '10',
    created_at: new Date().toISOString(),
    schema_version: '3.1',
    ...overrides,
  });

  it('returns OK for clean data', () => {
    const leads = Array.from({ length: 50 }, () => makeLead());
    const result = computeDataQuality(leads);

    expect(result.level).toBe('ok');
    expect(result.label).toBe('Données OK');
    expect(result.issues).toHaveLength(0);
  });

  it('flags missing critical fields', () => {
    const leads = Array.from({ length: 10 }, () => makeLead({ programme_label: '' }));
    const result = computeDataQuality(leads);

    expect(result.level).not.toBe('ok');
    expect(result.issues.some(i => i.text.includes('programme_label'))).toBe(true);
  });

  it('flags high bot rate', () => {
    const leads = [
      ...Array(5).fill(null).map(() => makeLead()),
      ...Array(5).fill(null).map(() => makeLead({ bot_score: '80' })),
    ];
    const result = computeDataQuality(leads);

    expect(result.details.botRate).toBe(50);
    expect(result.issues.some(i => i.severity === 'error')).toBe(true);
  });

  it('detects duplicates (same email same day)', () => {
    const today = new Date().toISOString();
    const leads = [
      makeLead({ email: 'dup@test.com', created_at: today }),
      makeLead({ email: 'dup@test.com', created_at: today }),
      ...Array(30).fill(null).map(() => makeLead()),
    ];
    const result = computeDataQuality(leads);

    expect(result.details.dupRate).toBeGreaterThan(0);
  });

  it('flags stale data', () => {
    const oldDate = '2025-01-01 10:00:00';
    const leads = Array.from({ length: 5 }, () => makeLead({ created_at: oldDate }));
    const result = computeDataQuality(leads);

    expect(result.details.hoursSince).toBeGreaterThan(48);
    expect(result.issues.some(i => i.text.includes('Dernier lead'))).toBe(true);
  });

  it('detects multiple schema versions', () => {
    const leads = [
      ...Array(3).fill(null).map(() => makeLead({ schema_version: '2.0' })),
      ...Array(3).fill(null).map(() => makeLead({ schema_version: '3.0' })),
      ...Array(3).fill(null).map(() => makeLead({ schema_version: '3.1' })),
    ];
    const result = computeDataQuality(leads);

    expect(result.details.schemas).toHaveProperty('2.0');
    expect(result.details.schemas).toHaveProperty('3.0');
    expect(result.details.schemas).toHaveProperty('3.1');
  });

  it('returns empty for no leads', () => {
    const result = computeDataQuality([]);
    expect(result.score).toBe(0);
  });

  it('uses 3-level system (ok/warning/error), never numeric score', () => {
    const leads = Array.from({ length: 10 }, () => makeLead());
    const result = computeDataQuality(leads);

    expect(['ok', 'warning', 'error']).toContain(result.level);
    // The 'score' field should not be used for display (kept for backward compat)
  });
});
