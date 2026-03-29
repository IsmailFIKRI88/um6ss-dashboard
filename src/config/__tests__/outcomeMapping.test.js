import { describe, it, expect } from 'vitest';
import { normalizeOutcome, isEnrolled, isContacted, isPending, isUnmappedOutcome } from '../outcomeMapping';

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

  it('defaults to pending for null/undefined/empty', () => {
    expect(normalizeOutcome(null)).toBe('pending');
    expect(normalizeOutcome(undefined)).toBe('pending');
    expect(normalizeOutcome('')).toBe('pending');
    expect(normalizeOutcome('pending')).toBe('pending');
  });

  it('defaults to pending for unknown values', () => {
    expect(normalizeOutcome('quelque_chose_inconnu')).toBe('pending');
    expect(normalizeOutcome('STAT_A01')).toBe('pending');
  });

  it('handles numeric values (DSI codes)', () => {
    expect(normalizeOutcome(0)).toBe('pending');
    expect(normalizeOutcome(1)).toBe('pending');
    expect(normalizeOutcome('1')).toBe('pending');
    expect(normalizeOutcome('0')).toBe('pending');
  });

  it('handles boolean false', () => {
    expect(normalizeOutcome(false)).toBe('pending');
  });
});

describe('isUnmappedOutcome', () => {
  it('returns false for null/undefined/empty (no value = not unmapped)', () => {
    expect(isUnmappedOutcome(null)).toBe(false);
    expect(isUnmappedOutcome(undefined)).toBe(false);
    expect(isUnmappedOutcome('')).toBe(false);
  });

  it('returns false for known values', () => {
    expect(isUnmappedOutcome('enrolled')).toBe(false);
    expect(isUnmappedOutcome('inscrit')).toBe(false);
    expect(isUnmappedOutcome('pending')).toBe(false);
    expect(isUnmappedOutcome('contacté')).toBe(false);
  });

  it('returns true for unknown DSI values', () => {
    expect(isUnmappedOutcome('1')).toBe(true);
    expect(isUnmappedOutcome('STAT_A01')).toBe(true);
    expect(isUnmappedOutcome('مقبول')).toBe(true);
    expect(isUnmappedOutcome('quelque_chose')).toBe(true);
  });

  it('returns true for numeric codes', () => {
    expect(isUnmappedOutcome(1)).toBe(true);
    expect(isUnmappedOutcome(0)).toBe(true);
    expect(isUnmappedOutcome(42)).toBe(true);
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

  it('isPending returns true for unknown values (treated as pending)', () => {
    expect(isPending('STAT_A01')).toBe(true);
    expect(isPending(1)).toBe(true);
  });
});
