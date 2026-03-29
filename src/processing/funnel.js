import { QUALIFIED_SCORE_MIN } from '../config/defaults';
import { COLORS } from '../config/theme';
import { isEnrolled, isContacted } from '../config/outcomeMapping';

// ═══════════════════════════════════════════════
// FUNNEL — 8 étapes acquisition
// ═══════════════════════════════════════════════

export function buildFunnel(leads, visits, adSpend, outcomes) {
  const totalImpressions = adSpend.reduce((s, r) => s + (r.impressions || 0), 0);
  const totalClicks = adSpend.reduce((s, r) => s + (r.clicks || 0), 0);
  const totalVisits = visits.length || Math.round(totalClicks * 0.85);
  const formStarts = leads.filter(l => Number(l.form_started) === 1).length || Math.round(leads.length * 1.3);
  const totalLeads = leads.length;
  const qualified = leads.filter(l => Number(l.score) >= QUALIFIED_SCORE_MIN).length;
  const contacted = leads.filter(l => isContacted(l)).length
    || outcomes?.filter?.(o => isContacted(o.outcome))?.length || 0;
  const enrolled = leads.filter(l => isEnrolled(l)).length
    || outcomes?.filter?.(o => isEnrolled(o.outcome))?.length || 0;

  return [
    { name: 'Impressions', value: totalImpressions, fill: COLORS.accent, source: 'ads' },
    { name: 'Clicks', value: totalClicks, fill: '#6C5CE7', source: 'ads' },
    { name: 'Visites LP', value: totalVisits, fill: COLORS.primary, source: 'wp' },
    { name: 'Form Starts', value: formStarts, fill: '#7E4091', source: 'wp' },
    { name: 'Leads Bruts', value: totalLeads, fill: COLORS.warning, source: 'wp' },
    { name: 'Leads Qualifiés', value: qualified, fill: '#00827F', source: 'wp' },
    { name: 'Contactés', value: contacted, fill: COLORS.good, source: 'wp' },
    { name: 'Inscrits', value: enrolled, fill: COLORS.bad, source: 'wp' },
  ];
}

export function funnelConversionRates(funnel) {
  return funnel.map((step, i) => ({
    ...step,
    convRate: i > 0 && funnel[i - 1].value > 0
      ? Math.round(step.value / funnel[i - 1].value * 100) : 100,
  }));
}
