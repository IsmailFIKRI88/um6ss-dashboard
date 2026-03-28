import { describe, it, expect } from 'vitest';
import { computeAdmissionFunnel, computeAdmissionsByEntity, computeAdmissionsByProgramme } from '../admissions';

const makeLead = (overrides = {}) => ({
  id: Math.random().toString(36),
  score: '50',
  outcome: 'pending',
  lp_entite: 'FM6SIPS',
  programme_label: 'Infirmier Polyvalent',
  ...overrides,
});

describe('computeAdmissionFunnel', () => {
  it('counts total, qualified, contacted, enrolled', () => {
    const leads = [
      makeLead({ score: '70', outcome: 'contacted' }),
      makeLead({ score: '80', outcome: 'enrolled' }),
      makeLead({ score: '30', outcome: 'pending' }),
      makeLead({ score: '65', outcome: 'pending' }),
    ];
    const result = computeAdmissionFunnel(leads);

    expect(result.total).toBe(4);
    expect(result.qualified).toBe(3); // 70, 80, 65 >= 60
    expect(result.contacted).toBe(2); // contacted + enrolled
    expect(result.enrolled).toBe(1);
  });

  it('computes yield rate = enrolled / contacted', () => {
    const leads = [
      makeLead({ outcome: 'contacted' }),
      makeLead({ outcome: 'contacted' }),
      makeLead({ outcome: 'enrolled' }),
      makeLead({ outcome: 'enrolled' }),
    ];
    const result = computeAdmissionFunnel(leads);
    // contacted = 4 (2 contacted + 2 enrolled), enrolled = 2
    expect(result.yieldRate).toBe(50);
  });

  it('yield rate is null when no contacted', () => {
    const leads = [makeLead({ outcome: 'pending' })];
    expect(computeAdmissionFunnel(leads).yieldRate).toBeNull();
  });

  it('counts pending hot leads', () => {
    const leads = [
      makeLead({ score: '75', outcome: 'pending' }),
      makeLead({ score: '85', outcome: 'pending' }),
      makeLead({ score: '60', outcome: 'pending' }),
      makeLead({ score: '90', outcome: 'enrolled' }), // not pending
    ];
    expect(computeAdmissionFunnel(leads).pendingHot).toBe(2);
  });
});

describe('computeAdmissionsByEntity', () => {
  it('groups by entity', () => {
    const leads = [
      makeLead({ lp_entite: 'FM6SIPS' }),
      makeLead({ lp_entite: 'FM6SIPS' }),
      makeLead({ lp_entite: 'FM6M' }),
    ];
    const result = computeAdmissionsByEntity(leads);
    expect(result.length).toBeGreaterThanOrEqual(2);
    const sips = result.find(e => e.code === 'FM6SIPS');
    expect(sips.total).toBe(2);
  });

  it('computes fill rate when capacity configured', () => {
    const leads = [
      makeLead({ lp_entite: 'FM6SIPS', outcome: 'enrolled' }),
      makeLead({ lp_entite: 'FM6SIPS', outcome: 'enrolled' }),
    ];
    const settings = {
      'fm6sips-inf-poly': { maxCapacity: 10 },
    };
    const result = computeAdmissionsByEntity(leads, settings);
    const sips = result.find(e => e.code === 'FM6SIPS');
    expect(sips.fillRate).toBe(20); // 2/10
  });

  it('fill rate is null when no capacity', () => {
    const leads = [makeLead({ lp_entite: 'FM6SIPS' })];
    const result = computeAdmissionsByEntity(leads);
    const sips = result.find(e => e.code === 'FM6SIPS');
    expect(sips.fillRate).toBeNull();
  });

  it('sorts by total descending', () => {
    const leads = [
      makeLead({ lp_entite: 'FM6M' }),
      makeLead({ lp_entite: 'FM6SIPS' }),
      makeLead({ lp_entite: 'FM6SIPS' }),
    ];
    const result = computeAdmissionsByEntity(leads);
    expect(result[0].code).toBe('FM6SIPS');
  });
});

describe('computeAdmissionsByProgramme', () => {
  it('groups by programme label', () => {
    const leads = [
      makeLead({ programme_label: 'Kinésithérapie' }),
      makeLead({ programme_label: 'Kinésithérapie' }),
      makeLead({ programme_label: 'Ergothérapie' }),
    ];
    const result = computeAdmissionsByProgramme(leads);
    expect(result.length).toBe(2);
    const kine = result.find(p => p.name === 'Kinésithérapie');
    expect(kine.total).toBe(2);
  });

  it('collects campus information', () => {
    const leads = [
      makeLead({ programme_label: 'Kinésithérapie', campus_label: 'Casablanca' }),
      makeLead({ programme_label: 'Kinésithérapie', campus_label: 'Rabat' }),
    ];
    const result = computeAdmissionsByProgramme(leads);
    expect(result[0].campus).toContain('Casablanca');
    expect(result[0].campus).toContain('Rabat');
  });

  it('computes avg score', () => {
    const leads = [
      makeLead({ programme_label: 'Test', score: '60' }),
      makeLead({ programme_label: 'Test', score: '80' }),
    ];
    const result = computeAdmissionsByProgramme(leads);
    expect(result[0].avgScore).toBe(70);
  });
});
