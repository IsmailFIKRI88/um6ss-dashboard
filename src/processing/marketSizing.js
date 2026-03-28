// ═══════════════════════════════════════════════
// MARKET SIZING — TAM/SAM/SOM Fermi + SOV/ESOV
// ═══════════════════════════════════════════════

/**
 * Compute TAM, SAM, SOM with uncertainty propagation.
 * Simple interval multiplication (low×low, base×base, high×high).
 *
 * @param {Object} params - Market sizing parameters (from config/marketSizing.js)
 * @param {number} enrolledCount - Actual enrolled students
 * @param {number} avgAnnualFees - Weighted avg annual fees (from financialSettings)
 * @param {number} weightedLTV - Weighted LTV (from financialSettings)
 * @returns {Object|null}
 */
export function computeMarketSizing(params, enrolledCount = 0, avgAnnualFees = 0, weightedLTV = 0) {
  if (!params || !params.targetPopulation) return null;

  const p = params;

  // TAM = target population (already represents health-seeking students)
  const tam = {
    low: p.targetPopulationLow || p.targetPopulation * 0.75,
    base: p.targetPopulation,
    high: p.targetPopulationHigh || p.targetPopulation * 1.25,
  };

  // SAM = TAM × %solvable × %private-market
  const solvable = (p.pctSolvable || 24) / 100;
  const solvableLow = (p.pctSolvableLow || p.pctSolvable * 0.75) / 100;
  const solvableHigh = (p.pctSolvableHigh || p.pctSolvable * 1.25) / 100;

  const privateMkt = (p.pctPrivateMarket || 45) / 100;
  const privateMktLow = (p.pctPrivateMarketLow || p.pctPrivateMarket * 0.75) / 100;
  const privateMktHigh = (p.pctPrivateMarketHigh || p.pctPrivateMarket * 1.25) / 100;

  const sam = {
    low: Math.round(tam.low * solvableLow * privateMktLow),
    base: Math.round(tam.base * solvable * privateMkt),
    high: Math.round(tam.high * solvableHigh * privateMktHigh),
  };

  // SOM = SAM × market share, capped by capacity
  const ms = (p.marketSharePct || 35) / 100;
  const msLow = (p.marketSharePctLow || p.marketSharePct * 0.75) / 100;
  const msHigh = (p.marketSharePctHigh || p.marketSharePct * 1.25) / 100;
  const cap = p.capacityMax || 9999;

  const som = {
    low: Math.min(Math.round(sam.low * msLow), cap),
    base: Math.min(Math.round(sam.base * ms), cap),
    high: Math.min(Math.round(sam.high * msHigh), cap),
  };

  // Derived metrics
  const penetrationRate = som.base > 0 ? Math.round(enrolledCount / som.base * 100) : 0;
  const penetrationLow = som.high > 0 ? Math.round(enrolledCount / som.high * 100) : 0;
  const penetrationHigh = som.low > 0 ? Math.min(100, Math.round(enrolledCount / som.low * 100)) : 0;

  const headroom = Math.max(0, som.base - enrolledCount);

  return {
    tam, sam, som,
    tamRevenue: avgAnnualFees > 0 ? { low: tam.low * avgAnnualFees, base: tam.base * avgAnnualFees, high: tam.high * avgAnnualFees } : null,
    somLTV: weightedLTV > 0 ? { low: som.low * weightedLTV, base: som.base * weightedLTV, high: som.high * weightedLTV } : null,
    penetrationRate,
    penetrationRange: { low: penetrationLow, high: penetrationHigh },
    headroom,
    headroomLTV: weightedLTV > 0 ? headroom * weightedLTV : null,
    enrolledCount,
  };
}

/**
 * Compute Share of Voice and Excess SOV.
 *
 * @param {number} ourSpend - Our total ad spend (MAD)
 * @param {number} totalMarketSpend - Estimated total market spend (MAD)
 * @param {number} currentSOM - Our market share as % (0-100)
 * @returns {Object|null}
 */
export function computeSOVMetrics(ourSpend, totalMarketSpend, currentSOM = 0) {
  if (!totalMarketSpend || totalMarketSpend <= 0) return null;
  if (ourSpend <= 0) return null;

  const sov = Math.round(ourSpend / totalMarketSpend * 100);
  const esov = sov - currentSOM;

  // Binet & Field coefficient adapted for education (conservative)
  const coeff = 0.025; // 0.25% SOM growth per 10 points ESOV
  const predictedGrowth = esov * coeff;

  return {
    sov,                 // % — our share of total market ad spend
    som: currentSOM,     // % — our share of market (inscrits)
    esov,                // pp — excess SOV (positive = growing)
    predictedGrowthPct: Math.round(predictedGrowth * 10) / 10,
    isGrowing: esov > 0,
    calibrated: false,   // Set to true after 2 seasons of validation
  };
}

/**
 * Generate 3 budget scenarios (conservateur / base / agressif).
 *
 * @param {Object} marketSizing - Result of computeMarketSizing
 * @param {number} currentSpend - Current total ad spend
 * @param {number} currentCAC - Current cost per enrolled
 * @param {number} weightedLTV - Weighted LTV
 * @param {Object} multipliers - { conservatif, agressif }
 * @returns {Array}
 */
export function computeScenarios(marketSizing, currentSpend, currentCAC, weightedLTV, multipliers = {}) {
  if (!marketSizing || !currentCAC || currentCAC <= 0) return [];

  const conserv = multipliers.conservatifMultiplier || 0.70;
  const aggress = multipliers.agressifMultiplier || 1.40;
  const { som, enrolledCount } = marketSizing;
  const ltvNet = weightedLTV * 0.35; // ~35% margin assumption

  const makeScenario = (label, spendMultiplier) => {
    const budget = Math.round(currentSpend * spendMultiplier);
    // Diminishing returns: inscriptions scale sub-linearly with spend
    const elasticity = 0.55; // 1% more spend → 0.55% more enrolled
    const enrolledDelta = Math.round(enrolledCount * (Math.pow(spendMultiplier, elasticity) - 1));
    const totalEnrolled = enrolledCount + enrolledDelta;
    const cacMarginal = enrolledDelta > 0 ? Math.round((budget - currentSpend) / enrolledDelta) : null;
    const penetration = som.base > 0 ? Math.round(totalEnrolled / som.base * 100) : 0;
    const roiIncremental = enrolledDelta > 0 && ltvNet > 0
      ? ((enrolledDelta * ltvNet - (budget - currentSpend)) / Math.max(1, budget - currentSpend) * 100).toFixed(0)
      : null;

    return {
      label, budget, totalEnrolled, enrolledDelta,
      cacMarginal, penetration, roiIncremental,
      paybackMonths: cacMarginal && ltvNet > 0 ? Math.ceil(cacMarginal / (ltvNet / 12)) : null,
    };
  };

  return [
    makeScenario('Conservateur', conserv),
    makeScenario('Base', 1.0),
    makeScenario('Croissance', aggress),
  ];
}
