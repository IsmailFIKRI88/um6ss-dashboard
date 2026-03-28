import { QUALIFIED_SCORE_MIN } from '../config/defaults';
import { FACULTY_LABELS } from '../config/theme';
import { PROGRAMS_BY_ENTITY } from '../config/programs';

// ═══════════════════════════════════════════════
// ADMISSIONS — Pipeline admission + yield rate
// ═══════════════════════════════════════════════

/**
 * Compute admission funnel metrics from leads.
 * Works with current outcome field values (pending/contacted/enrolled/inscrit).
 *
 * @param {Array} leads - Filtered leads
 * @param {Object} financialSettings - Per-program settings (for capacity)
 * @returns {Object}
 */
export function computeAdmissionFunnel(leads, financialSettings = {}) {
  const total = leads.length;
  const qualified = leads.filter(l => Number(l.score) >= QUALIFIED_SCORE_MIN).length;
  const contacted = leads.filter(l =>
    l.outcome === 'contacted' || l.outcome === 'contacté' ||
    l.outcome === 'enrolled' || l.outcome === 'inscrit'
  ).length;
  const enrolled = leads.filter(l => l.outcome === 'enrolled' || l.outcome === 'inscrit').length;

  const yieldRate = contacted > 0 ? Math.round(enrolled / contacted * 100) : null;
  const conversionRate = total > 0 ? Math.round(enrolled / total * 1000) / 10 : 0;
  const contactRate = total > 0 ? Math.round(contacted / total * 100) : 0;

  return {
    total, qualified, contacted, enrolled,
    yieldRate,
    conversionRate,
    contactRate,
    pendingHot: leads.filter(l =>
      Number(l.score) >= 70 && (l.outcome === 'pending' || !l.outcome)
    ).length,
  };
}

/**
 * Compute admission metrics per entity (faculty).
 *
 * @param {Array} leads
 * @param {Object} financialSettings
 * @returns {Array}
 */
export function computeAdmissionsByEntity(leads, financialSettings = {}) {
  const byEntity = {};

  leads.forEach(l => {
    const code = l.entity_code || extractEntityFromLead(l);
    if (!byEntity[code]) byEntity[code] = {
      code, name: FACULTY_LABELS[code] || code,
      total: 0, qualified: 0, contacted: 0, enrolled: 0, scores: [],
    };
    byEntity[code].total++;
    if (Number(l.score) >= QUALIFIED_SCORE_MIN) byEntity[code].qualified++;
    if (['contacted', 'contacté', 'enrolled', 'inscrit'].includes(l.outcome)) byEntity[code].contacted++;
    if (l.outcome === 'enrolled' || l.outcome === 'inscrit') byEntity[code].enrolled++;
    byEntity[code].scores.push(Number(l.score) || 0);
  });

  return Object.values(byEntity).map(e => {
    const programs = PROGRAMS_BY_ENTITY[e.code] || [];
    let capacity = 0, target = 0;
    programs.forEach(p => {
      const s = financialSettings[p.id] || {};
      capacity += s.maxCapacity || 0;
      target += s.enrollmentTarget || 0;
    });

    const avgScore = e.scores.length > 0
      ? Math.round(e.scores.reduce((a, b) => a + b, 0) / e.scores.length)
      : 0;

    return {
      ...e,
      avgScore,
      capacity,
      target,
      fillRate: capacity > 0 ? Math.round(e.enrolled / capacity * 100) : null,
      yieldRate: e.contacted > 0 ? Math.round(e.enrolled / e.contacted * 100) : null,
      convRate: e.total > 0 ? Math.round(e.enrolled / e.total * 1000) / 10 : 0,
    };
  }).sort((a, b) => b.total - a.total);
}

/**
 * Compute admission metrics per programme.
 *
 * @param {Array} leads
 * @param {Object} financialSettings
 * @returns {Array}
 */
export function computeAdmissionsByProgramme(leads, financialSettings = {}) {
  const byProg = {};

  leads.forEach(l => {
    const prog = l.programme_label || l.programme_id || 'Non spécifié';
    const entity = l.entity_code || extractEntityFromLead(l);
    if (!byProg[prog]) byProg[prog] = {
      name: prog, entity, total: 0, qualified: 0, contacted: 0, enrolled: 0,
      scores: [], campus: new Set(),
    };
    byProg[prog].total++;
    if (Number(l.score) >= QUALIFIED_SCORE_MIN) byProg[prog].qualified++;
    if (['contacted', 'contacté', 'enrolled', 'inscrit'].includes(l.outcome)) byProg[prog].contacted++;
    if (l.outcome === 'enrolled' || l.outcome === 'inscrit') byProg[prog].enrolled++;
    byProg[prog].scores.push(Number(l.score) || 0);
    if (l.campus_label) byProg[prog].campus.add(l.campus_label);
  });

  return Object.values(byProg).map(p => {
    const s = financialSettings[p.name] || {};
    const avgScore = p.scores.length > 0
      ? Math.round(p.scores.reduce((a, b) => a + b, 0) / p.scores.length) : 0;

    return {
      name: p.name,
      entity: p.entity,
      entityName: FACULTY_LABELS[p.entity] || p.entity,
      total: p.total, qualified: p.qualified, contacted: p.contacted, enrolled: p.enrolled,
      avgScore,
      campus: [...p.campus],
      fillRate: (s.maxCapacity || 0) > 0 ? Math.round(p.enrolled / s.maxCapacity * 100) : null,
      capacity: s.maxCapacity || 0,
    };
  }).sort((a, b) => b.total - a.total);
}

// Helper
function extractEntityFromLead(lead) {
  const e = (lead.lp_entite || '').toLowerCase();
  if (e.includes('infirm') || e.includes('fm6sips')) return 'FM6SIPS';
  if (e.includes('dentaire') || e.includes('fm6md')) return 'FM6MD';
  if (e.includes('pharmacie') || e.includes('fm6p')) return 'FM6P';
  if (e.includes('vétérinaire') || e.includes('fm6mv')) return 'FM6MV';
  if (e.includes('ingénieur') || e.includes('esm6iss')) return 'ESM6ISS';
  if (e.includes('médecine') || e.includes('fm6m')) return 'FM6M';
  if (e.includes('biosciences') || e.includes('ismbb')) return 'ISMBB';
  if (e.includes('santé publique') || e.includes('eimsp')) return 'EIMSP';
  return lead.entity_code || 'Autre';
}
