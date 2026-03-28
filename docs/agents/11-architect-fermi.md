# Agent : Architecte Technique — Implémentation Fermi

> Session 2 · Mars 2026 · Mission : plan technique pour marketSizing.js

## Module processing — `src/processing/marketSizing.js` ✅ Implémenté

4 fonctions pures :
- `computeMarketSizing(params, enrolled, avgFees, weightedLTV)` → TAM/SAM/SOM avec fourchettes
- `computeSOVMetrics(ourSpend, totalMarketSpend, currentSOM)` → SOV, ESOV, prédiction
- `computeScenarios(marketSizing, currentSpend, currentCAC, weightedLTV, multipliers)` → 3 scénarios
- `computeRequiredBudget(params)` → budget requis pour objectif

Propagation d'incertitude : multiplication des bornes (pas Monte Carlo — cohérent avec le codebase).

## Configuration — `src/config/marketSizing.js` ✅ Implémenté

localStorage séparé (`um6ss_market_sizing`), pas fusionné dans financialSettings.
Deep merge avec defaults au chargement.

## Panel de config — `MarketSizingPanel.jsx` ✅ Implémenté

Même pattern que FinancialSettingsPanel : collapsible, inputs low/base/high, bouton reset.

## Intégration vues

- **Stratégie** : MarketFunnel + pénétration + headroom + SOV/ESOV ✅ Implémenté
- **Acquisition** : SOV/ESOV, budget requis (à faire)
- **Budget** : opportunity cost, scénarios CFO (à faire)

## Composants charts

- `MarketFunnel.jsx` ✅ Implémenté : barres horizontales hachurées + barre verte inscrits réels
- `ScenarioChart.jsx` (à faire) : LineChart 3 courbes
- `UncertaintyBar.jsx` (à faire) : barre avec whiskers low/high

## Tests — 21 tests ✅ Implémentés

Couvrent : TAM > SAM > SOM, low < base < high, capacity cap, penetration, headroom,
SOV = ourSpend/totalMarketSpend, ESOV positif/négatif, 3 scénarios.
