// ═══════════════════════════════════════════════
// COHORT ANALYSIS — Conversion velocity by cohort
// ═══════════════════════════════════════════════

function getWeekKey(dateStr) {
  const d = new Date(dateStr);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function computeCohorts(leads) {
  const cohorts = {};

  leads.forEach(lead => {
    const created = lead.created_at?.split?.(' ')?.[0];
    if (!created) return;

    const weekKey = getWeekKey(created);
    if (!cohorts[weekKey]) cohorts[weekKey] = { week: weekKey, total: 0, contacted: 0, enrolled: 0, daysToOutcome: [] };

    cohorts[weekKey].total++;

    const outcome = lead.outcome || 'pending';
    if (['contacted', 'contacté'].includes(outcome)) cohorts[weekKey].contacted++;
    if (['enrolled', 'inscrit'].includes(outcome)) {
      cohorts[weekKey].enrolled++;
      cohorts[weekKey].contacted++; // enrolled implies contacted
    }

    if (lead.outcome_updated_at && lead.created_at) {
      const days = Math.round((new Date(lead.outcome_updated_at) - new Date(lead.created_at)) / 86400000);
      if (days >= 0) cohorts[weekKey].daysToOutcome.push(days);
    }
  });

  return Object.values(cohorts)
    .map(c => ({
      ...c,
      contactRate: c.total > 0 ? Math.round(c.contacted / c.total * 100) : 0,
      enrollRate: c.total > 0 ? Math.round(c.enrolled / c.total * 100) : 0,
      medianDaysToOutcome: c.daysToOutcome.length > 0
        ? c.daysToOutcome.sort((a, b) => a - b)[Math.floor(c.daysToOutcome.length / 2)]
        : null,
    }))
    .sort((a, b) => a.week.localeCompare(b.week));
}
