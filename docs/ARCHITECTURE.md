# Architecture du Dashboard UM6SS

> Document de référence interne — Mars 2026
> Généré à partir de l’analyse de 18 agents spécialisés (2 sessions)

## 1. Vue d’ensemble

Dashboard React/Vite de pilotage campagne acquisition UM6SS 2026-2027.
Étendu au cycle de vie étudiant complet (6 phases) et au modèle de marché Fermi.

### Stack
- React 18 · Vite 6 · Recharts · Vitest
- Pas de TypeScript, pas de CSS framework
- Styles inline via `src/config/theme.js`
- Déployé GitHub Pages via GitHub Actions

### Arbre de fichiers

```
src/
├── Dashboard.jsx                    ← Orchestrateur (hooks, dataLayers, routing)
├── main.jsx
├── config/
│   ├── api.js                       ← Endpoints REST + timeout
│   ├── defaults.js                  ← Seuils alertes, benchmarks, timeline
│   ├── theme.js                     ← Couleurs, labels, SCORE_LABELS
│   ├── ThemeContext.jsx             ← 3 modes design (classique/contemporain/funky)
│   ├── programs.js                  ← 54 programmes, LTV avec série géométrique
│   └── marketSizing.js              ← Defaults Fermi TAM/SAM/SOM + localStorage key
├── data/
│   ├── useWordPressData.js          ← Hook : leads, visits, abandons, outcomes
│   ├── useAdSpendData.js            ← Hook : spend, breakdowns, video
│   ├── useOutcomesData.js           ← Hook : outcomes étendu (live API + fallback JSON)
│   ├── useStaticData.js             ← Hook générique : fichiers JSON statiques
│   └── __tests__/
├── processing/                      ← Modules de calcul purs (pas de React)
│   ├── funnel.js                    ← Funnel 8 étapes
│   ├── financial.js                 ← LTV, CAC, ROAS, payback (guards null si données manquantes)
│   ├── projection.js                ← Forecast leads/inscrits
│   ├── attribution.js               ← First-touch / last-touch
│   ├── reconciliation.js            ← Matching leads WP ↔ spend ads (bug fix: utm_campaign first)
│   ├── budgetPacing.js              ← Burn rate, projection spend
│   ├── engagement.js                ← Score engagement composite
│   ├── formDiagnostics.js           ← Waterfall friction, device gap
│   ├── cohortAnalysis.js            ← Cohortes hebdomadaires
│   ├── dataQuality.js               ← 3 niveaux (ok/warning/error)
│   ├── marketSizing.js              ← TAM/SAM/SOM Fermi, SOV/ESOV, scénarios
│   └── __tests__/                   ← 105 tests (14 fichiers)
├── views/
│   ├── Strategie.jsx                ← DG : objectifs, alertes, Fermi, SOV
│   ├── Acquisition.jsx              ← Marketing : CPL, attribution, pacing
│   ├── QualiteLeads.jsx             ← Admissions : scoring, diagnostic formulaire
│   └── Budget.jsx                   ← Finance : spend vs budget, P&L
├── components/
│   ├── ui/index.jsx                 ← KPICard, AlertBadge, ConditionalSection, etc.
│   ├── ui/ConditionalSection.jsx    ← Wrapper données disponibles/indisponibles
│   ├── charts/index.jsx             ← CustomTooltip, FunnelBar
│   ├── charts/MarketFunnel.jsx      ← Funnel TAM→SAM→SOM→Inscrits
│   ├── layout/index.jsx             ← Header, Navigation, SettingsPanel, Footer
│   ├── FinancialSettingsPanel.jsx   ← Config financière par programme
│   └── MarketSizingPanel.jsx        ← Config Fermi TAM/SAM/SOM
└── utils/
    ├── formatters.js
    ├── dateHelpers.js
    ├── extractEntity.js
    └── csvExport.js

public/
└── data/
    ├── outcomes-sample.json          ← Agrégats leads par faculté/canal (demo)
    ├── scolarite-sample.json         ← Rétention par cohorte + NPS (demo)
    └── alumni-sample.json            ← Taux insertion par promo (demo)
```

## 2. Pattern dataLayers

Introduit en Phase A. Centralise la disponibilité des données dans Dashboard.jsx :

```js
const dataLayers = {
  leads: wp.leads.length > 0,
  ads: ads.available,
  outcomes: outcomes.available,
  outcomesSource: outcomes.source,  // 'live' | 'static' | null
  financialRef: Object.values(financialSettings).some(s => s.annualFees > 0),
};
```

Passé à toutes les vues via `viewProps`. Chaque vue conditionne ses sections sur ces flags.

### Règle : null, jamais 0

Les KPIs financiers retournent `null` (pas `0` ni `"0.0"`) quand les données sont manquantes :
- `ROAS` → null si `weightedLTV = 0`
- `cohortRevenue` → null si `weightedLTV = 0`
- `year1Revenue` → null si `avgAnnualFees = 0 && registrationFees = 0`
- `ltvCacRatio` → null si `weightedLTV = 0`

Cela permet aux vues de distinguer "pas de données" de "résultat calculé = zéro".

## 3. Modèle de marché Fermi

### Paramètres (calibrés par 9 agents — mars 2026)

| Paramètre | Low | Base | High | Source |
|---|---|---|---|---|
| Population cible (bacheliers santé/an) | 42K | 55K | 68K | Économiste éducation |
| % solvables (≥65K MAD/an) | 18% | 24% | 32% | Challenger + HCP |
| % marché privé | 35% | 45% | 55% | Cartographie concurrence |
| Market share UM6SS | 25% | 35% | 45% | Intelligence concurrentielle |
| Capacité max UM6SS | — | 2 500 | — | Contrainte physique |

### Formules

```
TAM = targetPopulation (déjà filtré santé)
SAM = TAM × pctSolvable × pctPrivateMarket
SOM = min(SAM × marketSharePct, capacityMax)
```

Propagation d'incertitude : multiplication des bornes (low×low, base×base, high×high).

### SOV / ESOV

```
SOV = ourSpend / totalMarketSpend × 100
ESOV = SOV - SOM (en points de %)
Prédiction croissance = ESOV × 0.025 (coefficient conservateur éducation)
```

ESOV > 0 → croissance prédite. ESOV < 0 → déclin. Coefficient à calibrer après 2 saisons.

### UX : Estimations vs Faits

| Élément | Fait mesuré | Estimation Fermi |
|---|---|---|
| Bordure | `solid` | `dashed` |
| Couleur | Couleurs vives (accent, good, bad) | `#6B85A8` (bleu-ardoise désaturé) |
| Valeur | `3 421` | `~23K` |
| Sous-titre | — | `18K — 28K` (fourchette monospace) |
| Badge | — | `~ MODÈLE` |

## 4. Hooks de données

### useWordPressData
Source principale. Pagination automatique, retry 429. Retourne leads, visits, abandons, outcomes, experiments, schema.

### useAdSpendData
Source ads. Flag `available: false` quand pas de données ads (pas une erreur). Retourne spend, breakdowns, video, adSchema.

### useOutcomesData
Nouveau (Phase A). Stratégie : try live API → fallback JSON statique. Expose `source: 'live'|'static'` pour que les vues puissent afficher un badge "Demo". Timeout 8s avant fallback.

### useStaticData
Générique pour `public/data/*.json`. Un seul fetch one-shot. URL construite avec `import.meta.env.BASE_URL` pour éviter les doubles-slashes sur GitHub Pages.

## 5. Réconciliation plateforme (bug fix)

Bug corrigé : les leads avec `fbclid` étaient matchés à TOUTES les campagnes Meta (pas seulement la leur).

Nouveau comportement :
1. `utm_campaign` vérifié en premier (matching précis vers une campagne)
2. `campaign_id` aussi vérifié
3. Click ID (`fbclid`, `gclid`, etc.) uniquement en fallback quand pas d'`utm_campaign`

## 6. Schéma programs.js (Phase C ready)

Chaque programme a ces champs (les 4 derniers ajoutés en Phase A, défaut 0) :

```js
{
  registrationFees: 0,
  annualFees: 0,
  programYears: 3,
  retentionY1: 88,
  retentionOngoing: 95,
  maxCapacity: 0,
  enrollmentTarget: 0,
  trainingCostPerYear: 0,   // Phase C
  noShowRate: 0,             // Phase C
  scholarshipRate: 0,        // Phase C
}
```

Entity-level : `budgetAlloue`, `marketingFixedCosts`, `admissionsCosts` (Phase C).

Le localStorage fait un deep-merge avec les defaults → nouveaux champs ajoutés sans perdre les données utilisateur existantes.

## 7. Feuille de route

| Phase | Branche | Statut | Contenu |
|---|---|---|---|
| Fix | `fix/current-issues` | ✅ Mergé | Bug réconciliation + 77 tests |
| A | `feature/phase-a-foundations` | ✅ Mergé | dataLayers, hooks, ConditionalSection, guards financiers |
| Fermi | `feature/fermi-market-sizing` | ✅ Mergé | TAM/SAM/SOM, SOV/ESOV, funnel, panel config |
| B | `feature/phase-b-admissions` | 🔜 | Vue Admissions + processing/admissions.js |
| C | `feature/phase-c-financial` | 🔜 | P&L par programme, marge, opportunity cost |
| D | `feature/phase-d-retention` | 🔜 | Vue Rétention + alumni |
| E | `feature/phase-e-cleanup` | 🔜 | Suppression vues legacy |

## 8. Cartographie concurrentielle (mars 2026)

| Institution | Ville | Capacité estimée | Frais (MAD) | Positionnement |
|---|---|---|---|---|
| **UM6SS** (leader) | Casa + Rabat | 8K-10K stock | 55-80K | Premium, full-spectrum, CHU propre |
| UIR | Rabat | 500-800 | 50-70K | Premium, technologique |
| UEMF | Fès | 400-700 | 50-75K | Régional premium, montée en puissance |
| UPF | Fès | 600-1K | 40-60K | Régional, dentaire/pharmacie |
| EMSI | Multi-villes | 2K-3K | 25-40K | Mid-market, volume paramédical |

UM6SS = ~40-45% du marché privé universitaire santé au Maroc.

## 9. Segment Afrique francophone

Estimation réaliste du SOM UM6SS : **50-150 nouvelles inscriptions africaines/an** (pas 5 000).

Stock total étudiants subsahariens santé au Maroc : ~6 000-8 750. Dont privé : ~20%.

Canaux d'acquisition Afrique (par ordre d'efficacité) :
1. Alumni / bouche à oreille
2. Agences de placement (commission-based)
3. Facebook (domine en Afrique francophone)
4. WhatsApp communities
5. Salons éducatifs (Dakar, Abidjan, Yaoundé)

## 10. Tests

105 tests dans 14 fichiers. Framework : Vitest.

```bash
npm test           # Run once
npm test:watch     # Watch mode
```

Couverture : tous les modules processing + programs config + hooks (URL construction).

---

## 11. Vision V2 — Plan Directeur (cible long terme)

> Ce qui suit est la vision produit initiale (mars 2026). Elle coexiste avec le plan de phases (A→E)
> documenté en section 7. Les deux convergent vers le même objectif par des chemins complémentaires.
> Les specs détaillées sont dans `docs/specs/`.

### Vues cibles (5)

| Vue | Rôle | Question | Statut |
|-----|------|----------|--------|
| Stratégie | CODIR / DG | "On remplit ou pas ?" | ✅ Implémentée |
| Acquisition | Marketing / Growth | "Où mettre le prochain dirham ?" | ✅ Implémentée |
| Qualité Leads | Admissions | "Les leads sont-ils bons ?" | ✅ Implémentée |
| Budget | Finance | "On dépense bien ?" | ✅ Implémentée |
| Marque & Comm | Communication | "On est visible et crédible ?" | 🔜 Non développée |

### Filtres globaux cibles (6)

```
[Entité ▼] [Campus ▼] [Canal ▼] [Pays ▼] [Période ▼] [Cohorte ▼]
```

Implémentés : Entité, Période. Les 4 autres sont dans la cible V2.

### Sources de données cibles

Le dashboard consomme **une API REST unifiée**. Aujourd'hui WordPress directement. Demain le data hub (repo séparé).

Contrat d'interface :
- Base URL configurable dans le Settings Panel
- Auth : header `X-UM6SS-API-Key`
- Format : JSON paginé, headers `X-WP-Total` / `X-WP-TotalPages`
- Le dashboard ne sait pas (et n'a pas besoin de savoir) ce qu'il y a derrière l'API

→ [specs/data-sources.md](specs/data-sources.md)

### Migration V2 — 3 phases

**Phase 1 : Dashboard actuel enrichi** (en cours)
- Canaux manquants, campus comme filtre, comparaison N-1, funnel enrichi
- Source : WordPress uniquement

**Phase 2 : Proxy backend + sources externes**
- Data hub au lieu de WP directement
- GA4 + Search Console, SharePoint (SI Scolarité), vue Marque

**Phase 3 : Couverture complète**
- WhatsApp, APIs sociales, SI Finance, modèles prédictifs, PDF CODIR via IA

### Delta actuel vs cible V2

| Composant | Actuel | Cible V2 |
|-----------|--------|----------|
| Vues | 4 (+Fermi dans Stratégie) | 5 (+Marque) + Admissions + Rétention |
| KPIs | ~25 (+Fermi) | ~80 |
| Sources | 1 (WordPress) + JSON statiques | 10+ (via data hub) |
| Canaux | 10 | 14 |
| Funnel | 8 étapes marketing | 9 étapes admissions |
| Filtres globaux | 2 (entité, période) | 6 |
| Tests | 105 | Couverture intégration + e2e |
| Backend | Client → WP direct | Proxy data hub sécurisé |
