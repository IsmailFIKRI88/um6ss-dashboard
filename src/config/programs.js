// ═══════════════════════════════════════════════
// PROGRAMS — All UM6SS programs by entity
// ═══════════════════════════════════════════════

export const CYCLE_DEFAULTS = {
  'Licence':                    { years: 3, retentionY1: 88, retentionOngoing: 95 },
  'Master':                     { years: 2, retentionY1: 90, retentionOngoing: 97 },
  'Doctorat':                   { years: 6, retentionY1: 92, retentionOngoing: 98 },
  "Diplôme d'Ingénieur d'État": { years: 5, retentionY1: 90, retentionOngoing: 97 },
};

export const PROGRAMS = [
  // ── FM6SIPS ──
  { id: 'fm6sips-inf-poly',        entity: 'FM6SIPS', name: 'Infirmier Polyvalent',                                          cycle: 'Licence' },
  { id: 'fm6sips-inf-anesth',      entity: 'FM6SIPS', name: 'Infirmier en Anesthésie et Réanimation',                        cycle: 'Licence' },
  { id: 'fm6sips-inf-neo',         entity: 'FM6SIPS', name: 'Infirmier en Néonatalogie et Pédiatrie',                        cycle: 'Licence' },
  { id: 'fm6sips-inf-bloc',        entity: 'FM6SIPS', name: 'Infirmier en Bloc Opératoire',                                  cycle: 'Licence' },
  { id: 'fm6sips-tech-labo',       entity: 'FM6SIPS', name: 'Techniques de Laboratoire',                                     cycle: 'Licence' },
  { id: 'fm6sips-tech-radio',      entity: 'FM6SIPS', name: 'Techniques de Radiologie',                                      cycle: 'Licence' },
  { id: 'fm6sips-nutrition',       entity: 'FM6SIPS', name: 'Nutrition et Diététique',                                       cycle: 'Licence' },
  { id: 'fm6sips-psychomot',       entity: 'FM6SIPS', name: 'Psychomotricité',                                               cycle: 'Licence' },
  { id: 'fm6sips-orthophonie',     entity: 'FM6SIPS', name: 'Orthophonie',                                                   cycle: 'Licence' },
  { id: 'fm6sips-orthoptie',       entity: 'FM6SIPS', name: 'Orthoptie',                                                     cycle: 'Licence' },
  { id: 'fm6sips-kine',            entity: 'FM6SIPS', name: 'Kinésithérapie / Physiothérapie',                               cycle: 'Licence' },
  { id: 'fm6sips-ergo',            entity: 'FM6SIPS', name: 'Ergothérapie',                                                  cycle: 'Licence' },
  { id: 'fm6sips-audioprothese',   entity: 'FM6SIPS', name: 'Audioprothèse',                                                 cycle: 'Licence' },
  { id: 'fm6sips-sage-femme',      entity: 'FM6SIPS', name: 'Sage-femme',                                                    cycle: 'Licence' },
  { id: 'fm6sips-m-pedagogie',     entity: 'FM6SIPS', name: 'Pédagogie et Ingénierie de la Formation en Sci. Infirmières',   cycle: 'Master' },
  { id: 'fm6sips-m-onco',          entity: 'FM6SIPS', name: 'Pratiques Inf. Avancées en Oncologie et Soins Palliatifs',      cycle: 'Master' },
  { id: 'fm6sips-m-perinatal',     entity: 'FM6SIPS', name: 'Pratiques Inf. Avancées en Périnatalité',                       cycle: 'Master' },
  { id: 'fm6sips-m-urgento',       entity: 'FM6SIPS', name: 'Pratiques Inf. Avancées en Urgentologie',                       cycle: 'Master' },
  { id: 'fm6sips-m-audio',         entity: 'FM6SIPS', name: 'Audiologie et Thérapies Auditives',                              cycle: 'Master' },
  { id: 'fm6sips-m-kine-sport',    entity: 'FM6SIPS', name: 'Kinésithérapie Musculo-squelettique et du Sport',                cycle: 'Master' },
  { id: 'fm6sips-m-psycho',        entity: 'FM6SIPS', name: 'Psychologie Clinique',                                           cycle: 'Master' },
  { id: 'fm6sips-m-bio-gen',       entity: 'FM6SIPS', name: 'Biologie Médicale – Génétique et Bio-informatique',              cycle: 'Master' },
  { id: 'fm6sips-m-nutri-clin',    entity: 'FM6SIPS', name: 'Nutrition Clinique',                                             cycle: 'Master' },

  // ── ESM6ISS ──
  { id: 'esm6iss-maint-biomed',    entity: 'ESM6ISS', name: 'Maintenance et Génie Biomédical',                               cycle: 'Licence' },
  { id: 'esm6iss-info-sante',      entity: 'ESM6ISS', name: 'Informatique Décisionnelle en Santé Digitale',                  cycle: 'Licence' },
  { id: 'esm6iss-logistique',      entity: 'ESM6ISS', name: 'Logistique Hospitalière',                                       cycle: 'Licence' },
  { id: 'esm6iss-ing-biomed',      entity: 'ESM6ISS', name: 'Génie Biomédical',                                              cycle: "Diplôme d'Ingénieur d'État" },
  { id: 'esm6iss-ing-digital',     entity: 'ESM6ISS', name: 'Génie Digital en Santé',                                        cycle: "Diplôme d'Ingénieur d'État" },
  { id: 'esm6iss-ing-bioinfo',     entity: 'ESM6ISS', name: 'Génie Bio-Informatique',                                        cycle: "Diplôme d'Ingénieur d'État" },
  { id: 'esm6iss-ing-techmed',     entity: 'ESM6ISS', name: 'Génie en Tech. Médicale et Industrie Pharma & Cosmétique',      cycle: "Diplôme d'Ingénieur d'État" },
  { id: 'esm6iss-m-qualite',       entity: 'ESM6ISS', name: 'Management Qualité et Maintenance Biomédicale',                 cycle: 'Master' },
  { id: 'esm6iss-m-physmed',       entity: 'ESM6ISS', name: 'Physique Médicale',                                              cycle: 'Master' },
  { id: 'esm6iss-m-dispositifs',   entity: 'ESM6ISS', name: 'Dispositifs Médicaux et Affaires Réglementaires',               cycle: 'Master' },

  // ── FM6M ──
  { id: 'fm6m-doctorat',           entity: 'FM6M',    name: 'Doctorat en Médecine',                                           cycle: 'Doctorat' },
  { id: 'fm6m-m-immuno',           entity: 'FM6M',    name: 'Immunité, Infection et Inflammation',                             cycle: 'Master' },

  // ── FM6M-EN ──
  { id: 'fm6m-en-medical',         entity: 'FM6M-EN', name: 'Medical Studies',                                                cycle: 'Doctorat' },

  // ── FM6MD ──
  { id: 'fm6md-doctorat',          entity: 'FM6MD',   name: 'Doctorat en Médecine Dentaire',                                  cycle: 'Doctorat' },
  { id: 'fm6md-prothese',          entity: 'FM6MD',   name: 'Technologie de Laboratoire de Prothèse Dentaire',                cycle: 'Licence' },

  // ── FM6P ──
  { id: 'fm6p-doctorat',           entity: 'FM6P',    name: 'Doctorat en Pharmacie',                                          cycle: 'Doctorat' },
  { id: 'fm6p-assistant',          entity: 'FM6P',    name: 'Assistant du Pharmacie',                                         cycle: 'Licence' },
  { id: 'fm6p-fabrication',        entity: 'FM6P',    name: 'Fabrication et Contrôle des Produits de Santé',                  cycle: 'Licence' },

  // ── FM6MV ──
  { id: 'fm6mv-doctorat',          entity: 'FM6MV',   name: 'Médecine Vétérinaire',                                           cycle: 'Doctorat' },

  // ── EIMSP ──
  { id: 'eimsp-m-data',            entity: 'EIMSP',   name: 'Sciences des Données de Santé',                                  cycle: 'Master' },
  { id: 'eimsp-m-eco',             entity: 'EIMSP',   name: 'Économie et Financement de la Santé',                            cycle: 'Master' },
  { id: 'eimsp-m-management',      entity: 'EIMSP',   name: 'Management des Établissements de Santé',                         cycle: 'Master' },
  { id: 'eimsp-m-sante-pub',       entity: 'EIMSP',   name: 'Santé Publique',                                                 cycle: 'Master' },

  // ── ISMBB ──
  { id: 'ismbb-m-qhse',            entity: 'ISMBB',   name: 'Qualité, Hygiène, Sécurité et Environnement',                   cycle: 'Master' },
  { id: 'ismbb-m-medicolegal',     entity: 'ISMBB',   name: 'Sciences Médicolégales',                                         cycle: 'Master' },
  { id: 'ismbb-m-biotech',         entity: 'ISMBB',   name: 'Biotechnologie et Santé',                                        cycle: 'Master' },
];

// Group programs by entity
export const PROGRAMS_BY_ENTITY = PROGRAMS.reduce((acc, p) => {
  if (!acc[p.entity]) acc[p.entity] = [];
  acc[p.entity].push(p);
  return acc;
}, {});

// Entity settings key prefix (to avoid collision with program ids)
export const ENTITY_KEY = (code) => `_entity_${code}`;

// Build default settings: programs + entity-level
export function buildDefaultProgramFinancials() {
  const defaults = {};
  for (const p of PROGRAMS) {
    const cd = CYCLE_DEFAULTS[p.cycle] || {};
    defaults[p.id] = {
      registrationFees: 0,
      annualFees: 0,
      programYears: cd.years || 3,
      retentionY1: cd.retentionY1 || 88,
      retentionOngoing: cd.retentionOngoing || 97,
      maxCapacity: 0,
      enrollmentTarget: 0,
      trainingCostPerYear: 0,
      noShowRate: 0,
      scholarshipRate: 0,
    };
  }
  // Entity-level defaults
  for (const entity of Object.keys(PROGRAMS_BY_ENTITY)) {
    defaults[ENTITY_KEY(entity)] = {
      budgetAlloue: 0,
      marketingFixedCosts: 0,
      admissionsCosts: 0,
    };
  }
  return defaults;
}

// Compute LTV for a single program, accounting for retention curve
export function computeProgramLTV({ registrationFees = 0, annualFees = 0, programYears = 0, retentionY1 = 100, retentionOngoing = 100 }) {
  if (programYears <= 0 || annualFees <= 0) return 0;

  const r1 = Math.min(retentionY1, 100) / 100;
  const r2 = Math.min(retentionOngoing, 100) / 100;

  // Year 1: 100% pay
  let effectiveYears = 1;

  if (programYears > 1) {
    if (r2 >= 0.9999) {
      // No ongoing churn — simple multiplication
      effectiveYears += r1 * (programYears - 1);
    } else {
      // Geometric series: r1 × Σ(r2^k, k=0..N-2) = r1 × (1 - r2^(N-1)) / (1 - r2)
      effectiveYears += r1 * (1 - Math.pow(r2, programYears - 1)) / (1 - r2);
    }
  }

  return Math.round(registrationFees + annualFees * effectiveYears);
}
