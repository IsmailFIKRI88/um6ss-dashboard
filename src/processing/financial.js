// ═══════════════════════════════════════════════
// FINANCIAL — LTV, CAC, ROAS, Payback
// ═══════════════════════════════════════════════

/**
 * @param {object} params
 * @param {number} params.totalSpend          Media spend total
 * @param {number} params.monthlyFixedCosts   Agence + infra + personnel / mois
 * @param {number} params.monthsActive        Nombre de mois de campagne écoulés
 * @param {number} params.enrolledCount       Inscrits confirmés
 * @param {number} params.avgAnnualFees       Frais scolarité annuels moyens
 * @param {number} params.avgProgramDuration  Durée moyenne en années
 */
export function computeFinancials({
  totalSpend = 0,
  monthlyFixedCosts = 0,
  monthsActive = 1,
  enrolledCount = 0,
  avgAnnualFees = 0,
  avgProgramDuration = 3,
}) {
  const fullCost = totalSpend + (monthlyFixedCosts * monthsActive);
  const ltv = avgAnnualFees * avgProgramDuration;

  const mediaCPL = enrolledCount > 0 ? Math.round(totalSpend / enrolledCount) : null;
  const fullCAC = enrolledCount > 0 ? Math.round(fullCost / enrolledCount) : null;
  const ltvCacRatio = fullCAC > 0 ? (ltv / fullCAC).toFixed(1) : null;

  const roas = fullCost > 0 && enrolledCount > 0
    ? ((enrolledCount * ltv) / fullCost).toFixed(1) : null;

  // Payback: months until revenue covers CAC
  const monthlyRevPerStudent = avgAnnualFees / 12;
  const paybackMonths = fullCAC > 0 && monthlyRevPerStudent > 0
    ? Math.ceil(fullCAC / monthlyRevPerStudent) : null;

  const projectedRevenue = enrolledCount * ltv;

  return {
    fullCost,
    ltv,
    mediaCPL,
    fullCAC,
    ltvCacRatio,
    roas,
    paybackMonths,
    projectedRevenue,
    enrolledCount,
  };
}
