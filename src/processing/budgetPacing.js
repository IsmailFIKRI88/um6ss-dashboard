import { daysBetween, today } from '../utils/dateHelpers';
import { DEFAULT_CAMPAIGN_TIMELINE } from '../config/defaults';

// ═══════════════════════════════════════════════
// BUDGET PACING — Burn rate & projection
// ═══════════════════════════════════════════════

export function computeBudgetPacing(adSpend, timeline = DEFAULT_CAMPAIGN_TIMELINE) {
  const totalDays = daysBetween(timeline.start, timeline.end);
  const elapsedDays = Math.max(0, daysBetween(timeline.start, today()));
  const remainingDays = Math.max(0, totalDays - elapsedDays);
  const pctElapsed = totalDays > 0 ? Math.round(elapsedDays / totalDays * 100) : 0;

  // Spend by platform
  const byPlatform = {};
  const byDate = {};

  adSpend.forEach(row => {
    const plat = row.platform || 'unknown';
    if (!byPlatform[plat]) byPlatform[plat] = { spend: 0, impressions: 0, clicks: 0, conversions: 0 };
    byPlatform[plat].spend += row.spend || 0;
    byPlatform[plat].impressions += row.impressions || 0;
    byPlatform[plat].clicks += row.clicks || 0;
    byPlatform[plat].conversions += row.platform_conversions || 0;

    const date = row.date || '';
    if (!byDate[date]) byDate[date] = { date, spend: 0 };
    byDate[date].spend += row.spend || 0;
  });

  const totalSpend = Object.values(byPlatform).reduce((s, p) => s + p.spend, 0);
  const dailySeries = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));

  // Average daily spend (last 14 days)
  const recent = dailySeries.slice(-14);
  const avgDailySpend = recent.length > 0
    ? recent.reduce((s, d) => s + d.spend, 0) / recent.length : 0;

  // Projection
  const projectedTotalSpend = totalSpend + (avgDailySpend * remainingDays);

  // Cumulative series
  let cumul = 0;
  const cumulSeries = dailySeries.map(d => {
    cumul += d.spend;
    return { date: d.date, daily: d.spend, cumul };
  });

  return {
    totalDays, elapsedDays, remainingDays, pctElapsed,
    totalSpend, avgDailySpend: Math.round(avgDailySpend),
    projectedTotalSpend: Math.round(projectedTotalSpend),
    byPlatform,
    cumulSeries,
  };
}
