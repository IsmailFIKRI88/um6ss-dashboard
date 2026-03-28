// ═══════════════════════════════════════════════
// RETENTION — Churn, NPS, Alumni metrics
// ═══════════════════════════════════════════════

/**
 * Compute retention metrics from scolarite data (static JSON).
 * @param {Object|null} scolariteData - Parsed scolarite-sample.json
 * @returns {Object|null}
 */
export function computeRetention(scolariteData) {
  if (!scolariteData?.retention_by_cohort?.length) return null;

  const cohorts = scolariteData.retention_by_cohort;
  const avgRetention = cohorts.length > 0
    ? Math.round(cohorts.reduce((s, c) => s + (c.retention_y1_pct || 0), 0) / cohorts.length * 10) / 10
    : null;

  const latestCohort = cohorts[cohorts.length - 1];
  const trend = cohorts.length >= 2
    ? Math.round((cohorts[cohorts.length - 1].retention_y1_pct - cohorts[cohorts.length - 2].retention_y1_pct) * 10) / 10
    : null;

  return {
    cohorts,
    avgRetentionY1: avgRetention,
    latestRetentionY1: latestCohort?.retention_y1_pct || null,
    latestCohortYear: latestCohort?.cohort || null,
    trend,
    totalCohorts: cohorts.length,
  };
}

/**
 * Compute NPS from scolarite data.
 * @param {Object|null} scolariteData
 * @returns {Object|null}
 */
export function computeNPS(scolariteData) {
  if (!scolariteData?.satisfaction_nps) return null;
  const nps = scolariteData.satisfaction_nps;
  return {
    score: nps.score,
    promoters: nps.promoters_pct,
    passives: nps.passives_pct,
    detractors: nps.detractors_pct,
    responses: nps.responses,
    level: nps.score >= 50 ? 'excellent' : nps.score >= 30 ? 'good' : nps.score >= 0 ? 'average' : 'poor',
  };
}

/**
 * Compute alumni metrics from alumni data (static JSON).
 * @param {Object|null} alumniData - Parsed alumni-sample.json
 * @returns {Object|null}
 */
export function computeAlumni(alumniData) {
  if (!alumniData?.summary) return null;

  const summary = alumniData.summary;
  const byCohort = alumniData.by_cohort || [];
  const byFaculty = alumniData.by_faculty || [];

  const completeCohorts = byCohort.filter(c => c.employed_6m_pct != null);
  const avgEmployment = completeCohorts.length > 0
    ? Math.round(completeCohorts.reduce((s, c) => s + c.employed_6m_pct, 0) / completeCohorts.length * 10) / 10
    : null;

  return {
    totalAlumni: summary.total_alumni,
    employmentRate: summary.employment_rate_6m_pct,
    avgTimeToEmployment: summary.avg_time_to_employment_months,
    avgEmploymentAcrossCohorts: avgEmployment,
    byCohort,
    byFaculty,
    cohortsTracked: summary.cohorts_tracked,
  };
}
