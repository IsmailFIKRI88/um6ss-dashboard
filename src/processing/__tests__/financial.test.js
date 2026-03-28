import { describe, it, expect } from 'vitest';
import { computeFinancials, weightedFinancialParams } from '../financial';
import { computeProgramLTV } from '../../config/programs';

describe('computeFinancials', () => {
  it('returns null metrics when no enrolled students', () => {
    const result = computeFinancials({ totalSpend: 10000, enrolledCount: 0 });
    expect(result.fullCAC).toBeNull();
    expect(result.mediaCPL).toBeNull();
    expect(result.roas).toBeNull();
    expect(result.paybackMonths).toBeNull();
    expect(result.year1Revenue).toBeNull();
  });

  it('returns null ROAS when LTV is 0 (financialRef not configured)', () => {
    const result = computeFinancials({
      totalSpend: 50000, enrolledCount: 10, weightedLTV: 0, avgAnnualFees: 0,
    });
    expect(result.fullCAC).toBe(5000); // CAC still works
    expect(result.roas).toBeNull();     // ROAS needs LTV
    expect(result.ltvCacRatio).toBeNull();
    expect(result.cohortRevenue).toBeNull();
    expect(result.year1Revenue).toBeNull();
  });

  it('computes CAC correctly', () => {
    const result = computeFinancials({
      totalSpend: 50000,
      marketingFixedCosts: 10000,
      monthsActive: 3,
      enrolledCount: 10,
      weightedLTV: 300000,
      avgAnnualFees: 65000,
    });
    // fullCost = 50000 + 10000*3 = 80000
    // fullCAC = 80000 / 10 = 8000
    expect(result.fullCost).toBe(80000);
    expect(result.fullCAC).toBe(8000);
    expect(result.mediaCPL).toBe(5000); // 50000 / 10
  });

  it('computes ROAS correctly', () => {
    const result = computeFinancials({
      totalSpend: 50000,
      marketingFixedCosts: 0,
      monthsActive: 1,
      enrolledCount: 5,
      weightedLTV: 200000,
      avgAnnualFees: 65000,
    });
    // ROAS = (5 * 200000) / 50000 = 20.0
    expect(result.roas).toBe('20.0');
  });

  it('computes payback in months', () => {
    const result = computeFinancials({
      totalSpend: 50000,
      marketingFixedCosts: 0,
      monthsActive: 1,
      enrolledCount: 10,
      weightedLTV: 300000,
      avgAnnualFees: 60000,
    });
    // fullCAC = 5000, monthlyRev = 60000/12 = 5000
    // payback = ceil(5000/5000) = 1 month
    expect(result.paybackMonths).toBe(1);
  });

  it('computes LTV/CAC ratio', () => {
    const result = computeFinancials({
      totalSpend: 100000,
      marketingFixedCosts: 0,
      monthsActive: 1,
      enrolledCount: 10,
      weightedLTV: 300000,
      avgAnnualFees: 65000,
    });
    // CAC = 10000, LTV/CAC = 300000/10000 = 30.0
    expect(result.ltvCacRatio).toBe('30.0');
  });

  it('computes break-even inscrits', () => {
    const result = computeFinancials({
      totalSpend: 100000, marketingFixedCosts: 0, monthsActive: 1,
      enrolledCount: 10, weightedLTV: 50000, avgAnnualFees: 65000,
    });
    // fullCost = 100000, breakEven = ceil(100000/50000) = 2
    expect(result.breakEvenInscrits).toBe(2);
  });

  it('break-even is null when LTV = 0', () => {
    const result = computeFinancials({
      totalSpend: 100000, enrolledCount: 10, weightedLTV: 0,
    });
    expect(result.breakEvenInscrits).toBeNull();
  });

  it('computes year1 and cohort revenue', () => {
    const result = computeFinancials({
      totalSpend: 0,
      enrolledCount: 100,
      weightedLTV: 350000,
      avgAnnualFees: 65000,
      registrationFees: 10000,
    });
    expect(result.year1Revenue).toBe(100 * (10000 + 65000));
    expect(result.cohortRevenue).toBe(100 * 350000);
  });
});

describe('computeProgramLTV', () => {
  it('returns 0 for missing data', () => {
    expect(computeProgramLTV({})).toBe(0);
    expect(computeProgramLTV({ annualFees: 65000, programYears: 0 })).toBe(0);
  });

  it('computes LTV with 100% retention', () => {
    const ltv = computeProgramLTV({
      registrationFees: 10000,
      annualFees: 65000,
      programYears: 3,
      retentionY1: 100,
      retentionOngoing: 100,
    });
    // 10000 + 65000 * 3 = 205000
    expect(ltv).toBe(205000);
  });

  it('computes LTV with churn using geometric series', () => {
    const ltv = computeProgramLTV({
      registrationFees: 10000,
      annualFees: 65000,
      programYears: 6,
      retentionY1: 92,
      retentionOngoing: 98,
    });
    // Year 1: 1.0
    // effectiveYears = 1 + 0.92 * (1 - 0.98^5) / (1 - 0.98)
    // = 1 + 0.92 * (1 - 0.9039) / 0.02
    // = 1 + 0.92 * 4.8038
    // = 1 + 4.4195 = 5.4195
    // LTV = 10000 + 65000 * 5.4195 = 362267
    expect(ltv).toBeGreaterThan(350000);
    expect(ltv).toBeLessThan(370000);
  });

  it('handles single year program', () => {
    const ltv = computeProgramLTV({
      registrationFees: 5000,
      annualFees: 65000,
      programYears: 1,
      retentionY1: 90,
      retentionOngoing: 95,
    });
    // 1 year only → effectiveYears = 1
    // LTV = 5000 + 65000 * 1 = 70000
    expect(ltv).toBe(70000);
  });
});
