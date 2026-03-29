// ═══════════════════════════════════════════════
// OUTCOME MAPPING — Normalise les statuts DSI/Admissions
// ═══════════════════════════════════════════════

/**
 * Maps any outcome value from DSI/Admissions to a normalized group.
 * Add new variants as they appear in real data.
 */
export const OUTCOME_GROUPS = {
  enrolled: ['enrolled', 'inscrit', 'payé', 'confirmé', 'inscription_confirmée', 'paid'],
  contacted: ['contacted', 'contacté', 'admis', 'convoqué', 'entretien', 'en_traitement', 'called', 'admitted'],
  refused: ['refusé', 'refused', 'rejeté', 'non_admis', 'rejected'],
  withdrawn: ['désisté', 'withdrawn', 'annulé', 'no_show', 'cancelled'],
  waitlisted: ['liste_attente', 'waitlisted', 'en_attente', 'waitlist'],
  pending: ['pending', 'nouveau', 'new', ''],
};

// Pre-built O(1) lookup Map — avoids recreating Object.entries() on every call
const OUTCOME_LOOKUP = new Map();
for (const [group, variants] of Object.entries(OUTCOME_GROUPS)) {
  for (const v of variants) OUTCOME_LOOKUP.set(v, group);
}

/**
 * Normalize any raw outcome value to a standard group.
 * Handles strings, numbers, null, undefined.
 * @param {*} raw - The outcome value from the lead (string, number, null, undefined)
 * @returns {'enrolled'|'contacted'|'refused'|'withdrawn'|'waitlisted'|'pending'}
 */
export function normalizeOutcome(raw) {
  if (raw === null || raw === undefined) return 'pending';
  const val = String(raw).toLowerCase().trim();
  if (val === '') return 'pending';
  return OUTCOME_LOOKUP.get(val) || 'pending';
}

/**
 * Check if a raw outcome value is NOT recognized by any mapping group.
 * Distinguishes "unknown value from DSI" from "no value at all".
 * @param {*} raw
 * @returns {boolean} true if raw has a value but it's not in any group
 */
export function isUnmappedOutcome(raw) {
  if (raw === null || raw === undefined) return false;
  const val = String(raw).toLowerCase().trim();
  if (val === '') return false;
  return !OUTCOME_LOOKUP.has(val);
}

/** Check if a lead is in the "enrolled" group. */
export function isEnrolled(outcome) {
  return normalizeOutcome(outcome) === 'enrolled';
}

/** Check if a lead has been contacted (includes enrolled — enrolled implies contacted). */
export function isContacted(outcome) {
  const n = normalizeOutcome(outcome);
  return n === 'contacted' || n === 'enrolled';
}

/** Check if a lead is still pending (no action taken). */
export function isPending(outcome) {
  return normalizeOutcome(outcome) === 'pending';
}
