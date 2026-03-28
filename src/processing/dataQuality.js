// ═══════════════════════════════════════════════
// DATA QUALITY — Confidence score
// ═══════════════════════════════════════════════

export function computeDataQuality(leads) {
  if (!leads.length) return { score: 0, details: {}, issues: [] };

  const issues = [];
  let penaltyPoints = 0;

  // Missing critical fields
  const criticalFields = ['programme_label', 'channel_group', 'score', 'email', 'first_touch_source'];
  const missingRates = {};
  criticalFields.forEach(field => {
    const missing = leads.filter(l => !l[field] || l[field] === '').length;
    const rate = Math.round(missing / leads.length * 100);
    missingRates[field] = rate;
    if (rate > 20) {
      issues.push({ severity: 'warning', text: `${rate}% des leads sans ${field}` });
      penaltyPoints += Math.min(15, rate / 2);
    }
  });

  // Bot rate
  const bots = leads.filter(l => Number(l.bot_score) > 50).length;
  const botRate = Math.round(bots / leads.length * 100);
  if (botRate > 5) {
    issues.push({ severity: 'error', text: `${botRate}% de leads suspects (bot_score > 50)` });
    penaltyPoints += Math.min(20, botRate * 2);
  }

  // Duplicates (same email same day)
  const emailDayMap = {};
  let duplicates = 0;
  leads.forEach(l => {
    const key = `${l.email}::${(l.created_at || '').split(' ')[0]}`;
    if (l.email && emailDayMap[key]) duplicates++;
    emailDayMap[key] = true;
  });
  const dupRate = Math.round(duplicates / leads.length * 100);
  if (dupRate > 3) {
    issues.push({ severity: 'warning', text: `${dupRate}% de doublons probables (même email/jour)` });
    penaltyPoints += Math.min(10, dupRate);
  }

  // Schema version mix
  const schemas = {};
  leads.forEach(l => { schemas[l.schema_version || 'unknown'] = (schemas[l.schema_version || 'unknown'] || 0) + 1; });
  if (Object.keys(schemas).length > 2) {
    issues.push({ severity: 'info', text: `${Object.keys(schemas).length} versions de schéma mélangées` });
    penaltyPoints += 5;
  }

  // Freshness
  const latestLead = leads.reduce((latest, l) => {
    const d = l.created_at || '';
    return d > latest ? d : latest;
  }, '');
  const hoursSince = latestLead
    ? Math.round((Date.now() - new Date(latestLead).getTime()) / 3600000)
    : 999;
  if (hoursSince > 48) {
    issues.push({ severity: 'warning', text: `Dernier lead il y a ${hoursSince}h` });
    penaltyPoints += 5;
  }

  const hasErrors = issues.some(i => i.severity === 'error');
  const hasWarnings = issues.some(i => i.severity === 'warning');
  const level = hasErrors ? 'error' : hasWarnings ? 'warning' : 'ok';

  return {
    level,
    label: level === 'ok' ? 'Données OK' : level === 'warning' ? 'À vérifier' : 'Problème détecté',
    details: { missingRates, botRate, dupRate, hoursSince, schemas },
    issues: issues.sort((a, b) => (a.severity === 'error' ? 0 : a.severity === 'warning' ? 1 : 2) - (b.severity === 'error' ? 0 : b.severity === 'warning' ? 1 : 2)),
  };
}
