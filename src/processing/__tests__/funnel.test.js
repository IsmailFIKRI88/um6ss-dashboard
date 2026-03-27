import { describe, it, expect } from 'vitest';
import { buildFunnel, funnelConversionRates } from '../funnel';

describe('buildFunnel', () => {
  const makeLeads = (n, overrides = {}) =>
    Array.from({ length: n }, (_, i) => ({
      id: `lead_${i}`,
      score: '45',
      outcome: 'pending',
      form_started: '1',
      ...overrides,
    }));

  it('builds 8-step funnel', () => {
    const leads = makeLeads(100);
    const visits = Array(120).fill({});
    const adSpend = [
      { impressions: 50000, clicks: 1000 },
    ];
    const funnel = buildFunnel(leads, visits, adSpend, []);

    expect(funnel).toHaveLength(8);
    expect(funnel[0].name).toBe('Impressions');
    expect(funnel[0].value).toBe(50000);
    expect(funnel[1].name).toBe('Clicks');
    expect(funnel[1].value).toBe(1000);
    expect(funnel[2].name).toBe('Visites LP');
    expect(funnel[2].value).toBe(120);
    expect(funnel[4].name).toBe('Leads Bruts');
    expect(funnel[4].value).toBe(100);
  });

  it('counts qualified leads by score threshold', () => {
    const leads = [
      ...makeLeads(3, { score: '70' }),  // qualified (>=60)
      ...makeLeads(7, { score: '30' }),  // not qualified
    ];
    const funnel = buildFunnel(leads, [], [{ impressions: 0, clicks: 0 }], []);

    expect(funnel[5].name).toBe('Leads Qualifiés');
    expect(funnel[5].value).toBe(3);
  });

  it('counts enrolled from leads', () => {
    const leads = [
      ...makeLeads(8),
      ...makeLeads(2, { outcome: 'enrolled' }),
    ];
    const funnel = buildFunnel(leads, [], [{ impressions: 0, clicks: 0 }], []);

    expect(funnel[7].name).toBe('Inscrits');
    expect(funnel[7].value).toBe(2);
  });
});

describe('funnelConversionRates', () => {
  it('computes step-by-step conversion rates', () => {
    const funnel = [
      { name: 'A', value: 1000 },
      { name: 'B', value: 500 },
      { name: 'C', value: 100 },
    ];
    const result = funnelConversionRates(funnel);

    expect(result[0].convRate).toBe(100); // first step = 100%
    expect(result[1].convRate).toBe(50);  // 500/1000
    expect(result[2].convRate).toBe(20);  // 100/500
  });

  it('handles zero values', () => {
    const funnel = [
      { name: 'A', value: 0 },
      { name: 'B', value: 0 },
    ];
    const result = funnelConversionRates(funnel);
    expect(result[1].convRate).toBe(100); // 0/0 → guarded
  });
});
