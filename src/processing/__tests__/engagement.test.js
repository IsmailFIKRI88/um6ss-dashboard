import { describe, it, expect } from 'vitest';
import { computeEngagement, engagementByChannel } from '../engagement';

describe('computeEngagement', () => {
  const makeLead = (overrides = {}) => ({
    id: '1',
    score: '50',
    time_on_page: '120',
    active_time: '80',
    scroll_depth: '75',
    brochure_clicked: '1',
    faq_opened: '0',
    video_played: '0',
    programmes_viewed: 'prog1,prog2',
    channel_group: 'Paid Social',
    source: 'candidature',
    days_to_convert: '3',
    ...overrides,
  });

  it('computes engagement score 0-100', () => {
    const result = computeEngagement([makeLead()]);
    expect(result[0].engagement).toBeGreaterThanOrEqual(0);
    expect(result[0].engagement).toBeLessThanOrEqual(100);
  });

  it('caps engagement at 100', () => {
    const lead = makeLead({
      time_on_page: '100',
      active_time: '100',  // attention = 1.0 → 30pts
      scroll_depth: '100',  // → 25pts
      brochure_clicked: '1', // → 15pts
      faq_opened: '1',       // → 10pts
      video_played: '1',     // → 10pts
      programmes_viewed: 'a,b,c,d', // → 3*3.33 = ~10pts (capped at 3)
    });
    const result = computeEngagement([lead]);
    expect(result[0].engagement).toBe(100);
  });

  it('assigns correct quadrants', () => {
    const leads = [
      makeLead({ score: '70', scroll_depth: '100', active_time: '100', time_on_page: '100', brochure_clicked: '1', faq_opened: '1' }),
      makeLead({ score: '70', scroll_depth: '0', active_time: '0', time_on_page: '100' }),
      makeLead({ score: '30', scroll_depth: '100', active_time: '100', time_on_page: '100', brochure_clicked: '1', faq_opened: '1' }),
      makeLead({ score: '30', scroll_depth: '0', active_time: '0', time_on_page: '100' }),
    ];
    const result = computeEngagement(leads);

    expect(result[0].quadrant).toBe('high-high');
    expect(result[1].quadrant).toBe('high-low');
    expect(result[2].quadrant).toBe('low-high');
    expect(result[3].quadrant).toBe('low-low');
  });

  it('handles missing fields gracefully', () => {
    const lead = { id: '1', score: '0' };
    const result = computeEngagement([lead]);
    expect(result[0].engagement).toBe(0);
    expect(result[0].quadrant).toBe('low-low');
  });
});

describe('engagementByChannel', () => {
  it('groups and averages by channel', () => {
    const data = [
      { channel: 'Paid Social', score: 60, engagement: 80 },
      { channel: 'Paid Social', score: 40, engagement: 60 },
      { channel: 'Organic', score: 70, engagement: 50 },
    ];
    const result = engagementByChannel(data);

    const social = result.find(r => r.channel === 'Paid Social');
    expect(social.count).toBe(2);
    expect(social.avgScore).toBe(50);
    expect(social.avgEngagement).toBe(70);
  });

  it('sorts by count descending', () => {
    const data = [
      { channel: 'A', score: 50, engagement: 50 },
      { channel: 'B', score: 50, engagement: 50 },
      { channel: 'B', score: 50, engagement: 50 },
    ];
    const result = engagementByChannel(data);
    expect(result[0].channel).toBe('B');
  });
});
