// ═══════════════════════════════════════════════
// DEFAULTS & CONSTANTS
// ═══════════════════════════════════════════════

export const DEFAULT_ALERT_THRESHOLDS = {
  cpl_qualifie_max: 500,       // MAD
  score_moyen_min: 50,
  phantom_gap_max_pct: 25,     // %
  budget_pacing_max_pct: 110,  // %
  delai_contact_max_hours: 48,
  bot_rate_max_pct: 5,         // %
};

export const DEFAULT_BENCHMARKS = {
  cpl_sector_avg: 350,         // MAD — enseignement supérieur privé Maroc
  conversion_rate_lp: 8,       // % — visites → leads
  conversion_rate_enrolled: 12, // % — leads → inscrits
};

export const DEFAULT_CAMPAIGN_TIMELINE = {
  start: '2025-12-01',
  end: '2026-08-31',
};

export const QUALIFIED_SCORE_MIN = 60;

export const LEAD_TYPES = {
  candidature: { label: 'Candidature', shape: 'circle' },
  brochure: { label: 'Brochure', shape: 'triangle' },
  'exit-intent': { label: 'Exit-Intent', shape: 'square' },
};

export const DATE_PRESETS = [
  { key: '7d', label: '7 jours', days: 7 },
  { key: '14d', label: '14 jours', days: 14 },
  { key: '30d', label: '30 jours', days: 30 },
  { key: '90d', label: '90 jours', days: 90 },
  { key: 'all', label: 'Tout', days: null },
];
