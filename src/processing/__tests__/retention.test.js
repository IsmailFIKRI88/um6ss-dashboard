import { describe, it, expect } from 'vitest';
import { computeRetention, computeNPS, computeAlumni } from '../retention';

describe('computeRetention', () => {
  const sampleData = {
    retention_by_cohort: [
      { cohort: 2022, enrolled_y1: 301, retained_y2: 271, retention_y1_pct: 90.0 },
      { cohort: 2023, enrolled_y1: 318, retained_y2: 289, retention_y1_pct: 90.9 },
      { cohort: 2024, enrolled_y1: 342, retained_y2: 312, retention_y1_pct: 91.2 },
    ],
    satisfaction_nps: { score: 32, promoters_pct: 45, passives_pct: 40, detractors_pct: 15, responses: 487 },
  };

  it('returns null without data', () => {
    expect(computeRetention(null)).toBeNull();
    expect(computeRetention({})).toBeNull();
  });

  it('computes average retention across cohorts', () => {
    const result = computeRetention(sampleData);
    expect(result.avgRetentionY1).toBeGreaterThan(90);
    expect(result.avgRetentionY1).toBeLessThan(92);
  });

  it('returns latest cohort data', () => {
    const result = computeRetention(sampleData);
    expect(result.latestCohortYear).toBe(2024);
    expect(result.latestRetentionY1).toBe(91.2);
  });

  it('computes trend vs previous cohort', () => {
    const result = computeRetention(sampleData);
    expect(result.trend).toBeCloseTo(0.3, 1); // 91.2 - 90.9
  });

  it('counts total cohorts', () => {
    expect(computeRetention(sampleData).totalCohorts).toBe(3);
  });
});

describe('computeNPS', () => {
  it('returns null without data', () => {
    expect(computeNPS(null)).toBeNull();
    expect(computeNPS({})).toBeNull();
  });

  it('computes NPS level', () => {
    const data = { satisfaction_nps: { score: 32, promoters_pct: 45, passives_pct: 40, detractors_pct: 15, responses: 487 } };
    const result = computeNPS(data);
    expect(result.score).toBe(32);
    expect(result.level).toBe('good');
    expect(result.responses).toBe(487);
  });

  it('excellent level for score >= 50', () => {
    const data = { satisfaction_nps: { score: 55, promoters_pct: 60, passives_pct: 30, detractors_pct: 10, responses: 100 } };
    expect(computeNPS(data).level).toBe('excellent');
  });
});

describe('computeAlumni', () => {
  const sampleData = {
    summary: { total_alumni: 1847, cohorts_tracked: 6, employment_rate_6m_pct: 78.4, avg_time_to_employment_months: 3.2 },
    by_cohort: [
      { year: 2022, graduates: 301, employed_6m_pct: 83.4 },
      { year: 2023, graduates: 318, employed_6m_pct: 85.2 },
      { year: 2025, graduates: 367, employed_6m_pct: null },
    ],
    by_faculty: [
      { faculty_code: 'FM6M', total_alumni: 487, employment_rate_pct: 91.2 },
    ],
  };

  it('returns null without data', () => {
    expect(computeAlumni(null)).toBeNull();
  });

  it('extracts summary metrics', () => {
    const result = computeAlumni(sampleData);
    expect(result.totalAlumni).toBe(1847);
    expect(result.employmentRate).toBe(78.4);
  });

  it('computes average employment across complete cohorts only', () => {
    const result = computeAlumni(sampleData);
    // Only 2022 and 2023 have data (2025 is null)
    expect(result.avgEmploymentAcrossCohorts).toBeCloseTo(84.3, 0);
  });

  it('includes faculty breakdown', () => {
    const result = computeAlumni(sampleData);
    expect(result.byFaculty).toHaveLength(1);
    expect(result.byFaculty[0].faculty_code).toBe('FM6M');
  });
});
