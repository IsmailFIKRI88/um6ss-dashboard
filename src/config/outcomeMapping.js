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

/**
 * Normalize any raw outcome string to a standard group.
 * @param {string|null|undefined} raw - The outcome value from the lead
 * @returns {'enrolled'|'contacted'|'refused'|'withdrawn'|'waitlisted'|'pending'}
 */
export function normalizeOutcome(raw) {
  if (!raw) return 'pending';
  const val = raw.toLowerCase().trim();
  for (const [group, variants] of Object.entries(OUTCOME_GROUPS)) {
    if (variants.includes(val)) return group;
  }
  return 'pending';
}

/**
 * Check if a lead is in the "enrolled" group.
 */
export function isEnrolled(outcome) {
  return normalizeOutcome(outcome) === 'enrolled';
}

/**
 * Check if a lead has been contacted (includes enrolled — enrolled implies contacted).
 */
export function isContacted(outcome) {
  const n = normalizeOutcome(outcome);
  return n === 'contacted' || n === 'enrolled';
}

/**
 * Check if a lead is still pending (no action taken).
 */
export function isPending(outcome) {
  return normalizeOutcome(outcome) === 'pending';
}
