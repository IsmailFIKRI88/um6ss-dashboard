import { describe, it, expect } from 'vitest';
import { computeBudgetPacing } from '../budgetPacing';

describe('computeBudgetPacing', () => {
  const makeAdSpend = (days = 30) => {
    const rows = [];
    for (let i = 0; i < days; i++) {
      const d = new Date('2026-01-15');
      d.setDate(d.getDate() + i);
      rows.push({
        platform: i % 2 === 0 ? 'meta' : 'google',
        spend: 100,
        impressions: 5000,
        clicks: 50,
        platform_conversions: 2,
        date: d.toISOString().split('T')[0],
      });
    }
    return rows;
  };

  const timeline = { start: '2025-12-01', end: '2026-08-31' };

  it('computes total spend', () => {
    const adSpend = makeAdSpend(30);
    const result = computeBudgetPacing(adSpend, timeline);
    expect(result.totalSpend).toBe(3000); // 30 * 100
  });

  it('splits spend by platform', () => {
    const adSpend = makeAdSpend(30);
    const result = computeBudgetPacing(adSpend, timeline);

    expect(result.byPlatform.meta).toBeDefined();
    expect(result.byPlatform.google).toBeDefined();
    expect(result.byPlatform.meta.spend + result.byPlatform.google.spend).toBe(3000);
  });

  it('computes average daily spend', () => {
    const adSpend = makeAdSpend(30);
    const result = computeBudgetPacing(adSpend, timeline);

    // avgDailySpend based on last 14 days
    expect(result.avgDailySpend).toBe(100);
  });

  it('builds cumulative series', () => {
    const adSpend = makeAdSpend(5);
    const result = computeBudgetPacing(adSpend, timeline);

    expect(result.cumulSeries).toHaveLength(5);
    expect(result.cumulSeries[0].cumul).toBe(100);
    expect(result.cumulSeries[4].cumul).toBe(500);
  });

  it('projects total spend to end of campaign', () => {
    const adSpend = makeAdSpend(30);
    const result = computeBudgetPacing(adSpend, timeline);

    expect(result.projectedTotalSpend).toBeGreaterThan(result.totalSpend);
  });

  it('handles empty ad spend', () => {
    const result = computeBudgetPacing([], timeline);
    expect(result.totalSpend).toBe(0);
    expect(result.avgDailySpend).toBe(0);
  });
});
