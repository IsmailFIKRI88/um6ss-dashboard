import { describe, it, expect } from 'vitest';
import { normalizeOutcome, isEnrolled, isContacted, isPending } from '../outcomeMapping';

describe('normalizeOutcome', () => {
  it('normalizes enrolled variants', () => {
    expect(normalizeOutcome('enrolled')).toBe('enrolled');
    expect(normalizeOutcome('inscrit')).toBe('enrolled');
    expect(normalizeOutcome('payé')).toBe('enrolled');
    expect(normalizeOutcome('confirmé')).toBe('enrolled');
    expect(normalizeOutcome('INSCRIT')).toBe('enrolled');
    expect(normalizeOutcome(' Enrolled ')).toBe('enrolled');
  });

  it('normalizes contacted variants', () => {
    expect(normalizeOutcome('contacted')).toBe('contacted');
    expect(normalizeOutcome('contacté')).toBe('contacted');
    expect(normalizeOutcome('admis')).toBe('contacted');
    expect(normalizeOutcome('convoqué')).toBe('contacted');
    expect(normalizeOutcome('entretien')).toBe('contacted');
  });

  it('normalizes refused variants', () => {
    expect(normalizeOutcome('refusé')).toBe('refused');
    expect(normalizeOutcome('rejected')).toBe('refused');
    expect(normalizeOutcome('non_admis')).toBe('refused');
  });

  it('normalizes withdrawn variants', () => {
    expect(normalizeOutcome('désisté')).toBe('withdrawn');
    expect(normalizeOutcome('no_show')).toBe('withdrawn');
    expect(normalizeOutcome('annulé')).toBe('withdrawn');
  });

  it('normalizes waitlisted variants', () => {
    expect(normalizeOutcome('liste_attente')).toBe('waitlisted');
    expect(normalizeOutcome('waitlisted')).toBe('waitlisted');
  });

  it('defaults to pending for null/undefined/empty/unknown', () => {
    expect(normalizeOutcome(null)).toBe('pending');
    expect(normalizeOutcome(undefined)).toBe('pending');
    expect(normalizeOutcome('')).toBe('pending');
    expect(normalizeOutcome('pending')).toBe('pending');
    expect(normalizeOutcome('quelque_chose_inconnu')).toBe('pending');
  });
});

describe('helper functions', () => {
  it('isEnrolled detects enrolled variants', () => {
    expect(isEnrolled('inscrit')).toBe(true);
    expect(isEnrolled('payé')).toBe(true);
    expect(isEnrolled('contacted')).toBe(false);
    expect(isEnrolled(null)).toBe(false);
  });

  it('isContacted includes enrolled (enrolled implies contacted)', () => {
    expect(isContacted('contacted')).toBe(true);
    expect(isContacted('admis')).toBe(true);
    expect(isContacted('enrolled')).toBe(true);
    expect(isContacted('inscrit')).toBe(true);
    expect(isContacted('pending')).toBe(false);
  });

  it('isPending detects pending and empty values', () => {
    expect(isPending('pending')).toBe(true);
    expect(isPending(null)).toBe(true);
    expect(isPending(undefined)).toBe(true);
    expect(isPending('')).toBe(true);
    expect(isPending('enrolled')).toBe(false);
  });
});
