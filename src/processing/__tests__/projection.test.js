import { describe, it, expect } from 'vitest';
import { computeProjection } from '../projection';

describe('computeProjection', () => {
  const makeLeads = (n, daysAgo = 7) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    const dateStr = date.toISOString().split('T')[0];
    return Array.from({ length: n }, (_, i) => ({
      id: `lead_${i}`,
      created_at: `${dateStr} 12:00:00`,
      outcome: 'pending',
      score: '50',
    }));
  };

  it('computes daily rate from recent leads', () => {
    // 140 leads created 7 days ago → within 14-day window
    const leads = makeLeads(140, 7);
    const result = computeProjection(leads, []);

    // dailyRate = 140 / 14 = 10
    expect(result.currentDailyRate).toBe(10);
  });

  it('does not project enrolled without real conversion data', () => {
    const leads = makeLeads(30, 7); // < 50 leads → no real conv rate
    const result = computeProjection(leads, []);

    expect(result.hasRealConvRate).toBe(false);
    expect(result.projectedEnrolled).toBeNull();
    expect(result.conversionRate).toBeNull();
  });

  it('projects enrolled when sufficient data', () => {
    const leads = [
      ...makeLeads(55, 7),
      ...Array.from({ length: 5 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        return {
          id: `enrolled_${i}`,
          created_at: `${date.toISOString().split('T')[0]} 12:00:00`,
          outcome: 'enrolled',
          score: '80',
        };
      }),
    ];
    const result = computeProjection(leads, []);

    expect(result.hasRealConvRate).toBe(true);
    expect(result.projectedEnrolled).toBeGreaterThan(0);
  });

  it('computes required rate for target', () => {
    const leads = makeLeads(100, 7);
    const timeline = { start: '2026-01-01', end: '2026-08-31' };
    const result = computeProjection(leads, [], timeline);

    const required = result.computeRequiredRate(500);
    expect(required).toBeGreaterThan(0);
  });

  it('computes additional budget for target', () => {
    const leads = makeLeads(100, 7);
    const adSpend = [{ spend: 10000 }]; // CPL = 10000/100 = 100
    const timeline = { start: '2026-01-01', end: '2026-08-31' };
    const result = computeProjection(leads, adSpend, timeline);

    // If projected leads < target, additional budget = gap * CPL
    const budget = result.computeAdditionalBudget(10000);
    expect(budget).toBeGreaterThanOrEqual(0);
  });
});
