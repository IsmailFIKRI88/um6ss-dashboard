import { describe, it, expect } from 'vitest';
import { computeCohorts } from '../cohortAnalysis';

describe('computeCohorts', () => {
  const makeLead = (dateStr, outcome = 'pending', outcomeDate = null) => ({
    id: Math.random().toString(36),
    created_at: `${dateStr} 10:00:00`,
    outcome,
    outcome_updated_at: outcomeDate,
    score: '50',
  });

  it('groups leads by week', () => {
    const leads = [
      makeLead('2026-03-02'), // week 10
      makeLead('2026-03-03'), // week 10
      makeLead('2026-03-09'), // week 11
    ];
    const cohorts = computeCohorts(leads);

    expect(cohorts.length).toBeGreaterThanOrEqual(2);
    expect(cohorts[0].total).toBeGreaterThanOrEqual(1);
  });

  it('counts contacted and enrolled per cohort', () => {
    const leads = [
      makeLead('2026-03-02', 'pending'),
      makeLead('2026-03-02', 'contacted'),
      makeLead('2026-03-02', 'enrolled'),
    ];
    const cohorts = computeCohorts(leads);
    const week = cohorts[0];

    expect(week.total).toBe(3);
    expect(week.contacted).toBe(2); // contacted + enrolled
    expect(week.enrolled).toBe(1);
  });

  it('computes contact and enrollment rates', () => {
    const leads = [
      makeLead('2026-03-02', 'pending'),
      makeLead('2026-03-02', 'contacted'),
      makeLead('2026-03-02', 'enrolled'),
      makeLead('2026-03-02', 'pending'),
    ];
    const cohorts = computeCohorts(leads);

    expect(cohorts[0].contactRate).toBe(50); // 2/4
    expect(cohorts[0].enrollRate).toBe(25);  // 1/4
  });

  it('computes median days to outcome', () => {
    const leads = [
      makeLead('2026-03-02', 'contacted', '2026-03-05 10:00:00'), // 3 days
      makeLead('2026-03-02', 'contacted', '2026-03-09 10:00:00'), // 7 days
    ];
    const cohorts = computeCohorts(leads);

    expect(cohorts[0].medianDaysToOutcome).toBeDefined();
    expect(cohorts[0].medianDaysToOutcome).toBeGreaterThanOrEqual(3);
  });

  it('sorts cohorts chronologically', () => {
    const leads = [
      makeLead('2026-03-16'),
      makeLead('2026-01-05'),
      makeLead('2026-02-10'),
    ];
    const cohorts = computeCohorts(leads);

    for (let i = 1; i < cohorts.length; i++) {
      expect(cohorts[i].week >= cohorts[i - 1].week).toBe(true);
    }
  });

  it('handles leads without created_at', () => {
    const leads = [{ id: '1', outcome: 'pending' }];
    const cohorts = computeCohorts(leads);
    expect(cohorts).toHaveLength(0);
  });
});
