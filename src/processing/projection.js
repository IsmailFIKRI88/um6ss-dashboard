import { daysBetween, today, daysAgo } from '../utils/dateHelpers';
import { DEFAULT_CAMPAIGN_TIMELINE, QUALIFIED_SCORE_MIN } from '../config/defaults';

// ═══════════════════════════════════════════════
// PROJECTION — Forecast remplissage & gap budget
// ═══════════════════════════════════════════════

export function computeProjection(leads, adSpend, timeline = DEFAULT_CAMPAIGN_TIMELINE) {
  const remaining = Math.max(0, daysBetween(today(), timeline.end));
  const elapsed = Math.max(1, daysBetween(timeline.start, today()));

  // Recent daily lead rate (14-day moving average)
  const recentDate = daysAgo(14);
  const recentLeads = leads.filter(l => (l.created_at || '').split(' ')[0] >= recentDate);
  const dailyRate = recentLeads.length / 14;

  // Projected total leads at current pace
  const projectedLeads = leads.length + Math.round(dailyRate * remaining);

  // Conversion rate lead → enrolled (from actual data or flagged as estimate)
  const enrolled = leads.filter(l => l.outcome === 'enrolled' || l.outcome === 'inscrit').length;
  const hasRealConvRate = leads.length > 50 && enrolled > 0;
  const convRate = hasRealConvRate ? enrolled / leads.length : null;
  const projectedEnrolled = convRate ? Math.round(projectedLeads * convRate) : null;

  // Required daily rate to hit target
  const computeRequiredRate = (targetLeads) => {
    const gap = targetLeads - leads.length;
    return remaining > 0 ? Math.round(gap / remaining * 10) / 10 : null;
  };

  // Budget gap: additional spend needed
  const totalSpend = adSpend.reduce((s, r) => s + (r.spend || 0), 0);
  const currentCPL = leads.length > 0 ? totalSpend / leads.length : 0;

  return {
    elapsed,
    remaining,
    currentDailyRate: Math.round(dailyRate * 10) / 10,
    projectedLeads,
    projectedEnrolled,     // null if no real conversion data
    hasRealConvRate,       // false = not enough data to project inscrits
    conversionRate: convRate ? Math.round(convRate * 100) : null,
    currentCPL: Math.round(currentCPL),
    computeRequiredRate,
    computeAdditionalBudget: (targetLeads) => {
      const additionalLeads = Math.max(0, targetLeads - projectedLeads);
      return Math.round(additionalLeads * currentCPL);
    },
  };
}
