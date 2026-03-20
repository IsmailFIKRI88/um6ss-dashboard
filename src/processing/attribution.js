import { QUALIFIED_SCORE_MIN } from '../config/defaults';

// ═══════════════════════════════════════════════
// ATTRIBUTION — First-touch vs Last-touch
// ═══════════════════════════════════════════════

export function computeAttribution(leads) {
  const matrix = {}; // discovery → conversion → count
  const discoveryTotals = {};
  const conversionTotals = {};

  leads.forEach(lead => {
    const discovery = lead.first_touch_source || lead.first_touch_medium || 'direct';
    const conversion = lead.channel_group || lead.source_normalized || 'direct';

    if (!matrix[discovery]) matrix[discovery] = {};
    if (!matrix[discovery][conversion]) matrix[discovery][conversion] = { count: 0, qualified: 0, scores: [], daysToConvert: [] };

    matrix[discovery][conversion].count++;
    if (Number(lead.score) >= QUALIFIED_SCORE_MIN) matrix[discovery][conversion].qualified++;
    matrix[discovery][conversion].scores.push(Number(lead.score) || 0);
    if (lead.days_to_convert != null) matrix[discovery][conversion].daysToConvert.push(Number(lead.days_to_convert) || 0);

    discoveryTotals[discovery] = (discoveryTotals[discovery] || 0) + 1;
    conversionTotals[conversion] = (conversionTotals[conversion] || 0) + 1;
  });

  // Identify awareness vs closing channels
  const channels = [...new Set([...Object.keys(discoveryTotals), ...Object.keys(conversionTotals)])];
  const channelRoles = channels.map(ch => {
    const firstTouch = discoveryTotals[ch] || 0;
    const lastTouch = conversionTotals[ch] || 0;
    const total = firstTouch + lastTouch;
    const role = firstTouch > lastTouch * 1.5 ? 'awareness'
      : lastTouch > firstTouch * 1.5 ? 'closing'
      : 'balanced';
    return { channel: ch, firstTouch, lastTouch, role };
  }).sort((a, b) => (b.firstTouch + b.lastTouch) - (a.firstTouch + a.lastTouch));

  // Flatten matrix for visualization
  const flows = [];
  Object.entries(matrix).forEach(([discovery, conversions]) => {
    Object.entries(conversions).forEach(([conversion, data]) => {
      const avg = arr => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
      flows.push({
        discovery, conversion,
        count: data.count,
        qualified: data.qualified,
        avgScore: avg(data.scores),
        medianDaysToConvert: data.daysToConvert.length > 0
          ? data.daysToConvert.sort((a, b) => a - b)[Math.floor(data.daysToConvert.length / 2)]
          : null,
      });
    });
  });

  return { matrix, flows: flows.sort((a, b) => b.count - a.count), channelRoles };
}

/**
 * Redistribue les leads selon le modèle d'attribution choisi.
 */
export function reattribute(leads, model = 'last-touch') {
  if (model === 'first-touch') {
    return leads.map(l => ({
      ...l,
      _attributed_channel: l.first_touch_source || l.first_touch_medium || l.channel_group || 'direct',
    }));
  }
  return leads.map(l => ({
    ...l,
    _attributed_channel: l.channel_group || 'direct',
  }));
}
