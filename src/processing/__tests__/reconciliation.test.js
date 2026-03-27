import { describe, it, expect } from 'vitest';
import { reconciliate } from '../reconciliation';

// Mock CHANNEL_LABELS and QUALIFIED_SCORE_MIN
// These are imported from theme/defaults — we test the logic, not the config

describe('reconciliate', () => {
  const makeLead = (overrides = {}) => ({
    id: Math.random().toString(36),
    score: '45',
    email: 'test@test.com',
    ...overrides,
  });

  const makeAdSpend = (overrides = {}) => ({
    platform: 'meta',
    campaign_id: 'camp_1',
    campaign_name: 'Campaign Alpha',
    spend: 1000,
    impressions: 50000,
    clicks: 500,
    platform_conversions: 10,
    date: '2026-03-01',
    ...overrides,
  });

  it('returns empty campaigns when no ad spend', () => {
    const result = reconciliate([makeLead()], []);
    expect(result.campaigns).toEqual([]);
    expect(result.totals.spend).toBe(0);
  });

  it('matches leads by utm_campaign exact match', () => {
    const leads = [
      makeLead({ utm_campaign: 'Campaign Alpha' }),
      makeLead({ utm_campaign: 'Campaign Beta' }),
    ];
    const adSpend = [makeAdSpend()];
    const result = reconciliate(leads, adSpend);

    expect(result.campaigns[0].wordpress_leads).toBe(1);
  });

  it('matches leads by utm_campaign === campaign_id', () => {
    const leads = [makeLead({ utm_campaign: 'camp_1' })];
    const adSpend = [makeAdSpend()];
    const result = reconciliate(leads, adSpend);

    expect(result.campaigns[0].wordpress_leads).toBe(1);
  });

  it('does NOT match a lead with fbclid to ALL meta campaigns (bug fix)', () => {
    const leads = [
      makeLead({ fbclid: 'fb_click_123', utm_campaign: 'Campaign Alpha' }),
    ];
    const adSpend = [
      makeAdSpend({ campaign_id: 'camp_1', campaign_name: 'Campaign Alpha' }),
      makeAdSpend({ campaign_id: 'camp_2', campaign_name: 'Campaign Beta', spend: 2000 }),
    ];
    const result = reconciliate(leads, adSpend);

    // Lead should only match Campaign Alpha (via utm_campaign), not Campaign Beta
    const alpha = result.campaigns.find(c => c.campaign_id === 'camp_1');
    const beta = result.campaigns.find(c => c.campaign_id === 'camp_2');

    expect(alpha.wordpress_leads).toBe(1);
    expect(beta.wordpress_leads).toBe(0);
  });

  it('falls back to click ID matching when no utm_campaign', () => {
    const leads = [makeLead({ fbclid: 'fb_click_123' })];
    const adSpend = [
      makeAdSpend({ campaign_id: 'camp_1', campaign_name: 'Campaign Alpha' }),
    ];
    const result = reconciliate(leads, adSpend);

    // Without utm_campaign, fbclid + meta platform = match (but to all meta campaigns)
    expect(result.campaigns[0].wordpress_leads).toBe(1);
  });

  it('computes phantom gap correctly', () => {
    const leads = [
      makeLead({ utm_campaign: 'Campaign Alpha' }),
    ];
    const adSpend = [makeAdSpend({ platform_conversions: 5 })];
    const result = reconciliate(leads, adSpend);

    expect(result.campaigns[0].phantom_gap).toBe(4); // 5 platform - 1 WP
    expect(result.campaigns[0].phantom_gap_pct).toBe(80); // 4/5 * 100
  });

  it('computes CPL tri-couche correctly', () => {
    const leads = [
      makeLead({ utm_campaign: 'Campaign Alpha', score: '70' }), // qualified
      makeLead({ utm_campaign: 'Campaign Alpha', score: '30' }), // not qualified
    ];
    const adSpend = [makeAdSpend({ spend: 1000, platform_conversions: 5 })];
    const result = reconciliate(leads, adSpend);
    const camp = result.campaigns[0];

    expect(camp.cpl_platform).toBe(200);   // 1000 / 5
    expect(camp.cpl_wordpress).toBe(500);   // 1000 / 2
    expect(camp.cpl_qualified).toBe(1000);  // 1000 / 1
  });

  it('aggregates spend across multiple rows of same campaign', () => {
    const adSpend = [
      makeAdSpend({ spend: 500, date: '2026-03-01' }),
      makeAdSpend({ spend: 300, date: '2026-03-02' }),
    ];
    const result = reconciliate([], adSpend);

    expect(result.campaigns[0].spend).toBe(800);
  });

  it('identifies non-attributable leads correctly', () => {
    const leads = [
      makeLead({ id: '1', utm_campaign: 'Campaign Alpha' }),
      makeLead({ id: '2' }), // no tracking params = non-attributable
      makeLead({ id: '3', fbclid: 'fb123' }), // has click ID = attributable
    ];
    const adSpend = [makeAdSpend()];
    const result = reconciliate(leads, adSpend);

    expect(result.nonAttributable.count).toBe(1);
  });

  it('sorts campaigns by spend descending', () => {
    const adSpend = [
      makeAdSpend({ campaign_id: 'low', campaign_name: 'Low', spend: 100 }),
      makeAdSpend({ campaign_id: 'high', campaign_name: 'High', spend: 5000 }),
    ];
    const result = reconciliate([], adSpend);

    expect(result.campaigns[0].campaign_id).toBe('high');
    expect(result.campaigns[1].campaign_id).toBe('low');
  });
});
