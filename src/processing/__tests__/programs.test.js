import { describe, it, expect } from 'vitest';
import { PROGRAMS, PROGRAMS_BY_ENTITY, buildDefaultProgramFinancials, computeProgramLTV, CYCLE_DEFAULTS } from '../../config/programs';

describe('PROGRAMS catalog', () => {
  it('has all 9 entities', () => {
    const entities = [...new Set(PROGRAMS.map(p => p.entity))];
    expect(entities).toContain('FM6SIPS');
    expect(entities).toContain('ESM6ISS');
    expect(entities).toContain('FM6M');
    expect(entities).toContain('FM6M-EN');
    expect(entities).toContain('FM6MD');
    expect(entities).toContain('FM6P');
    expect(entities).toContain('FM6MV');
    expect(entities).toContain('EIMSP');
    expect(entities).toContain('ISMBB');
    expect(entities).toHaveLength(9);
  });

  it('groups programs by entity correctly', () => {
    const totalGrouped = Object.values(PROGRAMS_BY_ENTITY).reduce((s, arr) => s + arr.length, 0);
    expect(totalGrouped).toBe(PROGRAMS.length);
  });

  it('every program has a valid cycle', () => {
    PROGRAMS.forEach(p => {
      expect(CYCLE_DEFAULTS).toHaveProperty(p.cycle);
    });
  });
});

describe('buildDefaultProgramFinancials', () => {
  it('generates defaults for all programs with Phase C fields', () => {
    const defaults = buildDefaultProgramFinancials();
    PROGRAMS.forEach(p => {
      expect(defaults).toHaveProperty(p.id);
      expect(defaults[p.id]).toHaveProperty('annualFees');
      expect(defaults[p.id]).toHaveProperty('programYears');
      expect(defaults[p.id]).toHaveProperty('retentionY1');
      expect(defaults[p.id]).toHaveProperty('maxCapacity');
      // Phase C fields initialized at 0
      expect(defaults[p.id].trainingCostPerYear).toBe(0);
      expect(defaults[p.id].noShowRate).toBe(0);
      expect(defaults[p.id].scholarshipRate).toBe(0);
    });
  });

  it('generates entity-level defaults with Phase C fields', () => {
    const defaults = buildDefaultProgramFinancials();
    Object.keys(PROGRAMS_BY_ENTITY).forEach(entity => {
      const key = `_entity_${entity}`;
      expect(defaults).toHaveProperty(key);
      expect(defaults[key]).toHaveProperty('budgetAlloue');
      expect(defaults[key]).toHaveProperty('marketingFixedCosts');
      expect(defaults[key].admissionsCosts).toBe(0);
    });
  });

  it('uses cycle defaults for retention', () => {
    const defaults = buildDefaultProgramFinancials();
    // A licence program should have licence retention defaults
    expect(defaults['fm6sips-inf-poly'].retentionY1).toBe(88);
    expect(defaults['fm6sips-inf-poly'].retentionOngoing).toBe(95);
    expect(defaults['fm6sips-inf-poly'].programYears).toBe(3);

    // A doctorat program should have doctorat retention defaults
    expect(defaults['fm6m-doctorat'].retentionY1).toBe(92);
    expect(defaults['fm6m-doctorat'].retentionOngoing).toBe(98);
    expect(defaults['fm6m-doctorat'].programYears).toBe(6);
  });
});

describe('computeProgramLTV edge cases', () => {
  it('returns 0 when annualFees is 0', () => {
    expect(computeProgramLTV({ annualFees: 0, programYears: 3 })).toBe(0);
  });

  it('handles retention > 100 by capping', () => {
    const ltv = computeProgramLTV({
      registrationFees: 0,
      annualFees: 100000,
      programYears: 3,
      retentionY1: 150, // invalid but should be capped
      retentionOngoing: 100,
    });
    // Capped to 100% → effectiveYears = 3
    expect(ltv).toBe(300000);
  });

  it('handles 0% retention', () => {
    const ltv = computeProgramLTV({
      registrationFees: 10000,
      annualFees: 65000,
      programYears: 6,
      retentionY1: 0,
      retentionOngoing: 0,
    });
    // Only year 1 pays → effectiveYears = 1
    expect(ltv).toBe(10000 + 65000);
  });
});
