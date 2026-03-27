import { describe, it, expect } from 'vitest';
import { computeAttribution, reattribute } from '../attribution';

describe('computeAttribution', () => {
  const makeLead = (overrides = {}) => ({
    id: '1',
    score: '50',
    channel_group: 'Paid Social',
    first_touch_source: 'google',
    first_touch_medium: 'cpc',
    source_normalized: 'Paid Social',
    days_to_convert: '5',
    ...overrides,
  });

  it('builds discovery → conversion matrix', () => {
    const leads = [
      makeLead({ first_touch_source: 'google', channel_group: 'Paid Social' }),
      makeLead({ first_touch_source: 'google', channel_group: 'Paid Social' }),
      makeLead({ first_touch_source: 'facebook', channel_group: 'Organic' }),
    ];
    const result = computeAttribution(leads);

    expect(result.flows.length).toBeGreaterThan(0);
    const googleToSocial = result.flows.find(f => f.discovery === 'google' && f.conversion === 'Paid Social');
    expect(googleToSocial.count).toBe(2);
  });

  it('identifies channel roles (awareness vs closing)', () => {
    const leads = [
      // Google discovers, Social closes
      ...Array(10).fill(null).map(() => makeLead({ first_touch_source: 'google', channel_group: 'Paid Social' })),
    ];
    const result = computeAttribution(leads);

    const google = result.channelRoles.find(c => c.channel === 'google');
    const social = result.channelRoles.find(c => c.channel === 'Paid Social');

    expect(google.role).toBe('awareness');
    expect(social.role).toBe('closing');
  });

  it('computes avg score and median days per flow', () => {
    const leads = [
      makeLead({ score: '60', days_to_convert: '3' }),
      makeLead({ score: '80', days_to_convert: '7' }),
    ];
    const result = computeAttribution(leads);
    const flow = result.flows[0];

    expect(flow.avgScore).toBe(70);
    expect(flow.medianDaysToConvert).toBeDefined();
  });
});

describe('reattribute', () => {
  it('uses channel_group for last-touch (default)', () => {
    const leads = [{ channel_group: 'Paid Social', first_touch_source: 'google' }];
    const result = reattribute(leads);
    expect(result[0]._attributed_channel).toBe('Paid Social');
  });

  it('uses first_touch_source for first-touch model', () => {
    const leads = [{ channel_group: 'Paid Social', first_touch_source: 'google' }];
    const result = reattribute(leads, 'first-touch');
    expect(result[0]._attributed_channel).toBe('google');
  });

  it('falls back to direct when no attribution data', () => {
    const leads = [{}];
    const result = reattribute(leads, 'first-touch');
    expect(result[0]._attributed_channel).toBe('direct');
  });
});
