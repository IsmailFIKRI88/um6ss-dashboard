// ═══════════════════════════════════════════════
// MARKET SIZING — Fermi TAM/SAM/SOM defaults
// ═══════════════════════════════════════════════

/**
 * User-configurable parameters for the Fermi market model.
 * Persisted separately in localStorage (not in financialSettings).
 * Each parameter has low/base/high for uncertainty propagation.
 */
export const MARKET_SIZING_DEFAULTS = {
  // TAM — Total population of potential students
  targetPopulation: 55000,       // Bacheliers sciences Maroc + Afrique visant santé
  targetPopulationLow: 42000,
  targetPopulationHigh: 68000,

  // SAM filter — % solvable (can pay 65K MAD/an)
  pctSolvable: 24,               // %
  pctSolvableLow: 18,
  pctSolvableHigh: 32,

  // SAM filter — % who don't have public access or prefer private
  pctPrivateMarket: 45,          // %
  pctPrivateMarketLow: 35,
  pctPrivateMarketHigh: 55,

  // SOM — UM6SS market share within the private SAM
  marketSharePct: 35,            // %
  marketSharePctLow: 25,
  marketSharePctHigh: 45,

  // Capacity constraint (physical max new students/year)
  capacityMax: 2500,

  // SOV — Estimated total market ad spend (all private health schools, MAD/year)
  totalMarketSpend: 5000000,

  // Scenario multipliers
  conservatifMultiplier: 0.70,
  agressifMultiplier: 1.40,
};

export const MARKET_SIZING_STORAGE_KEY = 'um6ss_market_sizing';
