# CLAUDE.md — um6ss-dashboard v1.1.0

Dashboard React/Vite de pilotage campagne acquisition UM6SS 2026-2027.
4 vues par rôle, 20+ KPIs, données temps réel WordPress + plateformes ads.

## Commandes

```bash
npm run dev        # Dev server (localhost:5173)
npm run build      # Production build → dist/
npm run preview    # Preview production build
npm test           # Run unit tests (Vitest, 105 tests)
npm test:watch     # Watch mode — relance à chaque sauvegarde
```

Déployé automatiquement via GitHub Actions → GitHub Pages sur push `main`.

## Stack

React 18 · Vite 6 · Recharts · Pas de state manager (useState/useMemo suffisent).
Pas de TypeScript, pas de CSS framework — styles inline avec le système de couleurs `src/config/theme.js`.

## Architecture

```
src/
├── Dashboard.jsx          ← Orchestrateur (config, data hooks, routing vues)
├── main.jsx               ← Entry point
├── config/
│   ├── api.js             ← Endpoints REST + timeout
│   ├── defaults.js        ← Seuils alertes, benchmarks, timeline campagne
│   ├── theme.js           ← Couleurs, labels entités/canaux, SCORE_LABELS
│   └── marketSizing.js    ← Defaults Fermi TAM/SAM/SOM
├── data/
│   ├── useWordPressData.js ← Hook : leads, visits, abandons, outcomes, experiments
│   ├── useAdSpendData.js   ← Hook : spend, breakdowns, video, schema
│   ├── useOutcomesData.js  ← Hook : outcomes étendu (live + fallback JSON statique)
│   └── useStaticData.js    ← Hook générique : fichiers JSON public/data/
├── processing/            ← Modules de calcul purs (pas de React)
│   ├── funnel.js          ← Funnel visite → lead → qualifié → inscrit
│   ├── financial.js       ← LTV, CAC, ROAS, payback
│   ├── projection.js      ← Forecast leads/inscrits à fin campagne
│   ├── attribution.js     ← Reattribution first-touch / last-touch
│   ├── reconciliation.js  ← Matching leads WP ↔ spend ads par campagne
│   ├── budgetPacing.js    ← Burn rate, projection spend
│   ├── engagement.js      ← Score × engagement quadrants
│   ├── formDiagnostics.js ← Waterfall friction, device gap
│   ├── cohortAnalysis.js  ← Cohortes hebdomadaires
│   ├── dataQuality.js     ← 3 niveaux (ok/warning/error), pas de score
│   └── marketSizing.js    ← TAM/SAM/SOM Fermi, SOV/ESOV, scénarios budget
├── views/                 ← 4 vues, une par rôle décideur
│   ├── Strategie.jsx      ← Direction générale : objectifs, alertes, résumé IA
│   ├── Acquisition.jsx    ← Marketing/Growth : CPL drill-down, créas, pacing
│   ├── QualiteLeads.jsx   ← Admissions : scoring buckets, conversion, qualité/canal
│   └── Budget.jsx         ← Finance : spend vs budget, coût/inscrit, P&L
├── components/
│   ├── ui/index.jsx       ← KPICard, AlertBadge, SectionTitle, DataTable, ProgressBar
│   ├── ui/ConditionalSection.jsx ← Wrapper données disponibles/indisponibles
│   ├── charts/index.jsx   ← CustomTooltip, FunnelBar
│   ├── charts/MarketFunnel.jsx   ← Funnel visuel TAM→SAM→SOM→Inscrits
│   ├── MarketSizingPanel.jsx     ← Config Fermi TAM/SAM/SOM
│   └── layout/index.jsx   ← Header, Navigation, SettingsPanel, Footer
└── utils/
    ├── formatters.js      ← fmt.mad(), fmt.number(), fmt.pct(), fmt.dateShort()
    ├── dateHelpers.js     ← daysAgo(), groupByDate(), filterByDateRange()
    └── csvExport.js       ← Export table → CSV (virgule, standard international)
```

## Contexte métier — IMPORTANT

UM6SS = université privée santé au Maroc. 9 entités, 54 programmes (licence à doctorat).
Modèle économique = frais de scolarité (~65K MAD/an, 3-6 ans). Chaque inscrit = revenu récurrent.
Campagne saisonnière : décembre 2025 → août 2026. Pics : bac (juin) et résultats (juillet).

Le dashboard sert 4 profils décideurs. Chaque vue doit répondre à UNE question :

| Vue | Rôle | Question principale |
|-----|------|-------------------|
| Stratégie | DG / Direction | "Est-ce qu'on va atteindre les objectifs d'inscription ?" |
| Acquisition | Marketing / Growth | "Où est-ce que je mets mon prochain dirham ?" |
| Qualité Leads | Admissions | "Est-ce que les leads qu'on reçoit sont bons ?" |
| Budget | Finance | "Est-ce qu'on dépense bien et c'est rentable ?" |

Un filtre global "Entité" est accessible depuis toutes les vues (pas une vue séparée).

## Règles d'honnêteté des données — NE JAMAIS VIOLER

1. Pas de KPI financier (ROAS, payback, revenue) sans données inscriptions réelles (outcomes)
2. Pas de projection inscrits sans taux de conversion calculé depuis les données réelles
3. Pas de score numérique data quality — 3 niveaux seulement (OK / Vérifier / Problème)
4. Disclaimer visible quand attribution first-touch : "spend = last-touch, CPL non comparable"
5. Pas de benchmarks inventés présentés comme des faits — si c'est une estimation, le dire
6. Le scatter score × engagement est RETIRÉ — remplacé par répartition buckets de scoring

## Lead scoring — Buckets (alignés avec le thème lp-template)

Les buckets sont définis dans `src/config/theme.js` → `SCORE_LABELS` :

| Bucket | Score | Couleur | Icône |
|--------|-------|---------|-------|
| Très chaud | ≥80 | #c62828 | 🔥 |
| Chaud | ≥60 | #e65100 | 🔴 |
| Tiède-haut | ≥40 | #f9a825 | 🟠 |
| Tiède-bas | ≥20 | #9e9e9e | 🟡 |
| Froid | <20 | #546e7a | 🔵 |

Le scoring est calculé côté WordPress (serveur) et stocké dans le champ `score` de chaque lead.
Max théorique = 100. 77% des leads tombent dans Tiède-bas et Tiède-haut. "Très chaud" est quasi-inaccessible.

## API REST — Contrat avec le plugin WordPress

Base URL : configurée dans Settings panel (défaut `http://candidatureum6ss.local/wp-json/um6ss/v1`)
Auth : header `X-UM6SS-API-Key`

| Endpoint | Données | Champs clés |
|----------|---------|-------------|
| /leads | Tous les leads | score, score_label, source, channel_group, programme_id, lp_entite, outcome, days_to_convert, created_at |
| /visits | Visites anonymes | — |
| /abandons | Abandons formulaire | — |
| /outcomes | Inscriptions DSI | — |
| /experiments | Expérimentations A/B | — |
| /schema | Métadonnées colonnes | — |
| /ad-spend | Dépenses pub par jour/campagne/ad | platform, campaign_id, campaign_name, ad_id, ad_name, spend, impressions, clicks, conversions |
| /ad-breakdowns | Breakdowns démographiques | dimension (age/gender/device/publisher), dimension_value, spend, clicks |
| /ad-video | Métriques vidéo | — |
| /ad-schema | Métadonnées ads | — |

## IA intégrée — Analyse sur demande

Chaque section a un bouton "🤖 Analyser" qui appelle l'API Anthropic (Claude Haiku) avec les données
de la section et retourne un résumé de 2-3 phrases : ce qui va bien, ce qui est anormal, action suggérée.
L'appel est côté client (pas de backend) via l'API Anthropic avec le modèle `claude-haiku-4-5-20251001`.
Le résumé est affiché dans un encart sous la section, dismissable. Un seul appel par clic (pas à chaque refresh).

## Drill-down coût — Canal → Campagne → Ad Set → Créa

La vue Acquisition doit permettre de descendre du coût global jusqu'à la créa individuelle :
1. KPIs globaux par canal (Meta, Google, LinkedIn, TikTok)
2. Clic sur un canal → liste des campagnes avec spend, leads, CPL
3. Clic sur une campagne → ad sets / créas avec spend, impressions, clicks, CTR, conversions
4. À chaque niveau : le CPL calculé depuis les leads WordPress (pas les conversions plateforme)

## Conventions code

- Composants : PascalCase, un fichier par vue
- Processing : fonctions pures, pas de React, pas de side-effects
- Styles : inline avec `COLORS` de theme.js — pas de CSS externe
- Exports : named exports pour les utils/processing, default export pour les vues
- Imports : `../` depuis views (un seul niveau), jamais `../../`
- localStorage pour la configuration métier persistante (financialSettings, marketSizingSettings). sessionStorage pour la config API (URL, clé). React state pour tout le reste.

## dataLayers — Activation conditionnelle

Dashboard.jsx expose un objet `dataLayers` passé à toutes les vues :
- `leads` : données WordPress chargées
- `ads` : données publicitaires disponibles
- `outcomes` : outcomes DSI importés (source: 'live' ou 'static')
- `financialRef` : frais de scolarité configurés dans le panel financier

Les KPIs financiers (ROAS, cohortRevenue, year1Revenue) retournent `null` — jamais `0` —
quand les données sources sont manquantes. Cela permet aux vues de distinguer "pas de données"
de "résultat calculé = zéro".

## Modèle Fermi — TAM/SAM/SOM

Le dashboard intègre un modèle de dimensionnement marché (Fermi estimation) :
- Config dans `src/config/marketSizing.js`, persistée dans localStorage séparé
- Processing dans `src/processing/marketSizing.js` (fonctions pures)
- Visualisation dans la vue Stratégie (funnel + pénétration + SOV/ESOV)
- Chaque paramètre a 3 valeurs : pessimiste/base/optimiste (propagation d'incertitude)
- Les estimations Fermi utilisent un style visuel distinct des faits mesurés (bordure dashed, badge "~ MODÈLE")

## Référence

- README.md : changelog, limites des données, architecture détaillée
- Thème lp-template : @docs/DATA_DICTIONARY.md pour le schéma complet des leads
- docs/ARCHITECTURE.md : décisions architecturales, cartographie concurrentielle, modèle Fermi
