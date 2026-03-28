import { describe, it, expect } from 'vitest';
import { computeMarketSizing, computeSOVMetrics, computeScenarios } from '../marketSizing';
import { MARKET_SIZING_DEFAULTS } from '../../config/marketSizing';

describe('computeMarketSizing', () => {
  const defaults = MARKET_SIZING_DEFAULTS;

  it('returns null when no params', () => {
    expect(computeMarketSizing(null)).toBeNull();
    expect(computeMarketSizing({})).toBeNull();
  });

  it('computes TAM > SAM > SOM (base values)', () => {
    const result = computeMarketSizing(defaults, 0, 65000, 300000);
    expect(result.tam.base).toBeGreaterThan(result.sam.base);
    expect(result.sam.base).toBeGreaterThan(result.som.base);
  });

  it('maintains low < base < high for each level', () => {
    const result = computeMarketSizing(defaults, 0, 65000, 300000);
    expect(result.tam.low).toBeLessThanOrEqual(result.tam.base);
    expect(result.tam.base).toBeLessThanOrEqual(result.tam.high);
    expect(result.sam.low).toBeLessThanOrEqual(result.sam.base);
    expect(result.som.low).toBeLessThanOrEqual(result.som.base);
  });

  it('caps SOM at capacityMax', () => {
    const params = { ...defaults, capacityMax: 500, marketSharePct: 90, marketSharePctLow: 80, marketSharePctHigh: 95 };
    const result = computeMarketSizing(params, 0, 65000, 300000);
    expect(result.som.base).toBeLessThanOrEqual(500);
    expect(result.som.high).toBeLessThanOrEqual(500);
  });

  it('computes penetrationRate correctly', () => {
    const result = computeMarketSizing(defaults, 700, 65000, 300000);
    expect(result.penetrationRate).toBeGreaterThan(0);
    expect(result.penetrationRate).toBeLessThanOrEqual(100);
    expect(result.enrolledCount).toBe(700);
  });

  it('penetrationRate is 0 when no enrolled', () => {
    const result = computeMarketSizing(defaults, 0, 65000, 300000);
    expect(result.penetrationRate).toBe(0);
  });

  it('computes headroom = som.base - enrolled', () => {
    const result = computeMarketSizing(defaults, 500, 65000, 300000);
    expect(result.headroom).toBe(result.som.base - 500);
  });

  it('headroom is 0 when enrolled > som', () => {
    const params = { ...defaults, capacityMax: 100, marketSharePct: 1, marketSharePctLow: 1, marketSharePctHigh: 1 };
    const result = computeMarketSizing(params, 5000, 65000, 300000);
    expect(result.headroom).toBe(0);
  });

  it('computes somLTV when weightedLTV > 0', () => {
    const result = computeMarketSizing(defaults, 0, 65000, 300000);
    expect(result.somLTV).not.toBeNull();
    expect(result.somLTV.base).toBe(result.som.base * 300000);
  });

  it('somLTV is null when weightedLTV = 0', () => {
    const result = computeMarketSizing(defaults, 0, 65000, 0);
    expect(result.somLTV).toBeNull();
  });
});

describe('computeSOVMetrics', () => {
  it('returns null when no market spend', () => {
    expect(computeSOVMetrics(100000, 0, 50)).toBeNull();
  });

  it('returns null when no our spend', () => {
    expect(computeSOVMetrics(0, 5000000, 50)).toBeNull();
  });

  it('computes SOV correctly', () => {
    const result = computeSOVMetrics(1000000, 5000000, 50);
    expect(result.sov).toBe(20); // 1M / 5M = 20%
  });

  it('computes ESOV = SOV - SOM', () => {
    const result = computeSOVMetrics(1000000, 5000000, 30);
    // SOV = 20%, SOM = 30% → ESOV = -10
    expect(result.esov).toBe(-10);
    expect(result.isGrowing).toBe(false);
  });

  it('positive ESOV means growing', () => {
    const result = computeSOVMetrics(2000000, 5000000, 20);
    // SOV = 40%, SOM = 20% → ESOV = +20
    expect(result.esov).toBe(20);
    expect(result.isGrowing).toBe(true);
  });

  it('is not calibrated by default', () => {
    const result = computeSOVMetrics(1000000, 5000000, 50);
    expect(result.calibrated).toBe(false);
  });
});

describe('computeScenarios', () => {
  const marketSizing = computeMarketSizing(MARKET_SIZING_DEFAULTS, 700, 65000, 300000);

  it('returns empty array without required params', () => {
    expect(computeScenarios(null, 1000000, 5000, 300000)).toEqual([]);
    expect(computeScenarios(marketSizing, 1000000, 0, 300000)).toEqual([]);
  });

  it('returns 3 scenarios', () => {
    const result = computeScenarios(marketSizing, 1000000, 5000, 300000);
    expect(result).toHaveLength(3);
    expect(result[0].label).toBe('Conservateur');
    expect(result[1].label).toBe('Base');
    expect(result[2].label).toBe('Croissance');
  });

  it('conservative budget < base < aggressive', () => {
    const result = computeScenarios(marketSizing, 1000000, 5000, 300000);
    expect(result[0].budget).toBeLessThan(result[1].budget);
    expect(result[1].budget).toBeLessThanOrEqual(result[2].budget);
  });

  it('base scenario has enrolled delta = 0 (same spend)', () => {
    const result = computeScenarios(marketSizing, 1000000, 5000, 300000);
    expect(result[1].enrolledDelta).toBe(0);
    expect(result[1].totalEnrolled).toBe(700);
  });

  it('aggressive scenario has more enrolled than base', () => {
    const result = computeScenarios(marketSizing, 1000000, 5000, 300000);
    expect(result[2].totalEnrolled).toBeGreaterThan(result[1].totalEnrolled);
  });
});
