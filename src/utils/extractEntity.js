import { FACULTY_LABELS } from '../config/theme';

// ═══════════════════════════════════════════════
// EXTRACT ENTITY CODE from a lead object
// ═══════════════════════════════════════════════
//
// Le seul champ entité en base est lp_entite (VARCHAR 300, nom complet).
// Le code court (FM6SIPS, ESM6ISS, etc.) est dérivé de lp_entite ou lp_slug.
//
// Priority:
//   1. lp_entite — nom complet, match par inclusion du label court
//   2. lp_slug — mapping officiel ci-dessous
//   3. Fallback: 'Autre'

// ── lp_slug → entity code (mapping officiel) ──
// Ordre important : règles les plus spécifiques en premier.
const SLUG_RULES = [
  // FM6SIPS — toutes les filières sciences infirmières
  { match: 'sciences-infirmieres',           entity: 'FM6SIPS' },
  { match: 'nutrition-techniques-sante',     entity: 'FM6SIPS' },
  { match: 'reeducation-rehabilitation',     entity: 'FM6SIPS' },
  { match: 'sciences-obstetricales',         entity: 'FM6SIPS' },
  // ESM6ISS — ingénieurs santé
  { match: 'ingenieurs-sante',              entity: 'ESM6ISS' },
  { match: 'diplome-ingenieur-etat',        entity: 'ESM6ISS' },
  // FM6MD — médecine dentaire
  { match: 'prothese-dentaire',             entity: 'FM6MD' },
  // FM6P — pharmacie
  { match: 'pharmacie',                     entity: 'FM6P' },
  // FM6MV — vétérinaire
  { match: 'veterinaire',                   entity: 'FM6MV' },
  // EIMSP — santé publique
  { match: 'sante-publique',               entity: 'EIMSP' },
  // ISMBB — biosciences
  { match: 'biosciences',                  entity: 'ISMBB' },
  // FM6M — médecine (concours commun, master) — doit être après les autres "medecine-*"
  { match: 'concours-commun',              entity: 'FM6M' },
  { match: 'medecine',                     entity: 'FM6M' },
];

// ── lp_entite → entity code (par mots-clés dans le nom complet) ──
const ENTITE_RULES = [
  { match: 'sciences infirmières',          entity: 'FM6SIPS' },
  { match: 'professions de la santé',       entity: 'FM6SIPS' },
  { match: 'ingénierie en sciences',        entity: 'ESM6ISS' },
  { match: 'ingénieurs',                    entity: 'ESM6ISS' },
  { match: 'médecine dentaire',             entity: 'FM6MD' },
  { match: 'pharmacie',                     entity: 'FM6P' },
  { match: 'médecine vétérinaire',          entity: 'FM6MV' },
  { match: 'vétérinaire',                   entity: 'FM6MV' },
  { match: 'santé publique',                entity: 'EIMSP' },
  { match: 'biosciences',                   entity: 'ISMBB' },
  { match: 'biotechnologies',               entity: 'ISMBB' },
  // FM6M doit être en dernier — "médecine" est sous-chaîne des autres
  { match: 'médecine',                      entity: 'FM6M' },
];

export function extractEntityCode(lead) {
  // 1. lp_entite — nom complet de la faculté
  const entite = (lead.lp_entite || '').trim();
  if (entite) {
    // Exact match against codes (cas rare mais possible)
    if (FACULTY_LABELS[entite]) return entite;
    // Match par mots-clés dans le nom complet
    const lower = entite.toLowerCase();
    for (const rule of ENTITE_RULES) {
      if (lower.includes(rule.match)) return rule.entity;
    }
  }

  // 2. lp_slug — mapping officiel
  const slug = (lead.lp_slug || '').toLowerCase();
  if (slug) {
    for (const rule of SLUG_RULES) {
      if (slug.includes(rule.match)) return rule.entity;
    }
  }

  return 'Autre';
}
