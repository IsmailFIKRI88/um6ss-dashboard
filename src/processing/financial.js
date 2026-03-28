// ═══════════════════════════════════════════════
// FINANCIAL — LTV, CAC, ROAS, Payback
// ═══════════════════════════════════════════════

import { FACULTY_LABELS } from '../config/theme';
import { PROGRAMS_BY_ENTITY, ENTITY_KEY, computeProgramLTV } from '../config/programs';

/**
 * Core financial calculator.
 * Now receives pre-computed weighted LTV instead of raw fee inputs.
 */
export function computeFinancials({
  totalSpend = 0,
  marketingFixedCosts = 0,
  monthsActive = 1,
  enrolledCount = 0,
  weightedLTV = 0,
  avgAnnualFees = 0,
  registrationFees = 0,
}) {
  const fullCost = totalSpend + (marketingFixedCosts * monthsActive);

  const fullCAC = enrolledCount > 0 ? Math.round(fullCost / enrolledCount) : null;
  const mediaCPL = enrolledCount > 0 ? Math.round(totalSpend / enrolledCount) : null;
  const ltvCacRatio = fullCAC > 0 && weightedLTV > 0 ? (weightedLTV / fullCAC).toFixed(1) : null;

  const roas = fullCost > 0 && enrolledCount > 0 && weightedLTV > 0
    ? ((enrolledCount * weightedLTV) / fullCost).toFixed(1) : null;

  // Payback: months until revenue covers CAC (based on annual fees, not LTV)
  const monthlyRevPerStudent = avgAnnualFees / 12;
  const paybackMonths = fullCAC > 0 && monthlyRevPerStudent > 0
    ? Math.ceil(fullCAC / monthlyRevPerStudent) : null;

  // Year-1 revenue per student (null if fees not configured)
  const year1Revenue = enrolledCount > 0 && (avgAnnualFees > 0 || registrationFees > 0)
    ? enrolledCount * (registrationFees + avgAnnualFees)
    : null;

  // Cohort lifetime revenue (null if LTV not configured)
  const cohortRevenue = weightedLTV > 0 ? enrolledCount * weightedLTV : null;

  return {
    fullCost,
    weightedLTV,
    mediaCPL,
    fullCAC,
    ltvCacRatio,
    roas,
    paybackMonths,
    year1Revenue,
    cohortRevenue,
    enrolledCount,
  };
}

/**
 * Compute weighted-average financial params from per-program settings,
 * aggregated at entity level based on the lead distribution.
 *
 * Returns pre-computed LTV (with retention curve), not raw inputs.
 */
export function weightedFinancialParams(leads, settings = {}) {
  // Helper: compute entity-level financial averages from its programs
  function entityAvg(entityCode) {
    const programs = PROGRAMS_BY_ENTITY[entityCode] || [];
    if (programs.length === 0) return { ltv: 0, fees: 0, regFees: 0, fixed: 0, budget: 0 };

    // Entity-level settings
    const entitySettings = settings[ENTITY_KEY(entityCode)] || {};

    const items = programs.map(p => {
      const s = settings[p.id] || {};
      return {
        fees: s.annualFees || 0,
        regFees: s.registrationFees || 0,
        ltv: computeProgramLTV(s),
        target: s.enrollmentTarget || 0,
      };
    });

    // Weight by enrollmentTarget if any are set, otherwise equal weight
    const hasTargets = items.some(i => i.target > 0);
    const configured = items.filter(i => i.fees > 0);
    const pool = configured.length > 0 ? configured : items;

    let avgLTV, avgFees, avgRegFees;

    if (hasTargets) {
      const totalTarget = pool.reduce((s, i) => s + (i.target || 1), 0);
      avgLTV = Math.round(pool.reduce((s, i) => s + i.ltv * (i.target || 1), 0) / totalTarget);
      avgFees = Math.round(pool.reduce((s, i) => s + i.fees * (i.target || 1), 0) / totalTarget);
      avgRegFees = Math.round(pool.reduce((s, i) => s + i.regFees * (i.target || 1), 0) / totalTarget);
    } else {
      const n = pool.length || 1;
      avgLTV = Math.round(pool.reduce((s, i) => s + i.ltv, 0) / n);
      avgFees = Math.round(pool.reduce((s, i) => s + i.fees, 0) / n);
      avgRegFees = Math.round(pool.reduce((s, i) => s + i.regFees, 0) / n);
    }

    return {
      ltv: avgLTV,
      fees: avgFees,
      regFees: avgRegFees,
      fixed: entitySettings.marketingFixedCosts || 0,
      budget: entitySettings.budgetAlloue || 0,
    };
  }

  // Count leads per entity
  const byFac = {};
  leads.forEach(l => {
    const entity = l.lp_entite || l.entity_code || '';
    let code = null;
    for (const k of Object.keys(FACULTY_LABELS)) {
      if (entity.includes(k) || entity.toLowerCase().includes((FACULTY_LABELS[k] || '').toLowerCase())) {
        code = k;
        break;
      }
    }
    if (!code) return;
    byFac[code] = (byFac[code] || 0) + 1;
  });

  const total = Object.values(byFac).reduce((s, n) => s + n, 0);

  if (total === 0) {
    // Fallback: simple average across all entities with configured programs
    const entities = Object.keys(FACULTY_LABELS);
    const avgs = entities.map(e => entityAvg(e)).filter(a => a.ltv > 0);
    const n = avgs.length || 1;
    return {
      weightedLTV: Math.round(avgs.reduce((s, a) => s + a.ltv, 0) / n),
      avgAnnualFees: Math.round(avgs.reduce((s, a) => s + a.fees, 0) / n),
      registrationFees: Math.round(avgs.reduce((s, a) => s + a.regFees, 0) / n),
      marketingFixedCosts: Math.round(avgs.reduce((s, a) => s + a.fixed, 0)),
      totalBudgetAlloue: avgs.reduce((s, a) => s + a.budget, 0),
    };
  }

  let wLTV = 0, wFees = 0, wRegFees = 0, totalFixed = 0, totalBudget = 0;
  for (const [code, count] of Object.entries(byFac)) {
    const avg = entityAvg(code);
    const weight = count / total;
    wLTV += avg.ltv * weight;
    wFees += avg.fees * weight;
    wRegFees += avg.regFees * weight;
    totalFixed += avg.fixed;
    totalBudget += avg.budget;
  }

  return {
    weightedLTV: Math.round(wLTV),
    avgAnnualFees: Math.round(wFees),
    registrationFees: Math.round(wRegFees),
    marketingFixedCosts: Math.round(totalFixed),
    totalBudgetAlloue: totalBudget,
  };
}
