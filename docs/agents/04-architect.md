# Agent : Architecte Technique — Plan d'extension

> Session 1 · Mars 2026 · Mission : concevoir l'architecture technique pour le cycle complet

## Nouveaux hooks

1. **useOutcomesData** : endpoint `/outcomes-extended` + fallback JSON statique. Flag `source: 'live'|'static'`. ✅ Implémenté Phase A.
2. **useScolariteData** : fichier JSON `public/data/scolarite.json`. Semestriel.
3. **useStaticData** (générique) : charge un JSON depuis public/data/. ✅ Implémenté Phase A.

## Proposition : 6 vues (pas 4, pas 8)

| Vue | Phase | Audience | Données requises |
|---|---|---|---|
| Stratégie | Toutes | DG | Tout (synthèse) |
| Acquisition | 1 | Marketing | leads + ads |
| Qualité Leads | 1-2 | Admissions | leads + outcomes |
| Budget | 1-3 | Finance | leads + ads + outcomes + ref financier |
| **Admissions** | 2-3 | Dir. Faculté | leads + outcomes |
| **Rétention** | 4-6 | VP Académique | scolarité + alumni |

## Nouveaux modules processing

- `processing/admissions.js` : computeAdmissionFunnel, computeAdmissionsByProgram, computeYieldComparison
- `processing/retention.js` : computeRetentionByCohorte, computeChurnAnalysis, computeSourceRetentionCorrelation
- `processing/satisfaction.js` : computeNPS, computeNPSTrend
- `processing/alumni.js` : computeAlumniMetrics, computeAlumniByProgram

## Migration en 5 phases

- **Phase A** (2 sem) : Hooks + dataLayers + ConditionalSection ✅ Fait
- **Phase B** (2 sem) : Vue Admissions + processing/admissions.js
- **Phase C** (2 sem) : Extension financière (P&L par programme, cohorte)
- **Phase D** (3 sem) : Vue Rétention + Alumni + RetentionHeatmap
- **Phase E** (1 sem) : Suppression vues legacy ✅ Partiellement fait (3/4 supprimées)

## Composants UI nouveaux

- ConditionalSection ✅ Implémenté
- CohortSelector (dropdown cohorte — Phase B)
- FillRateCard (factorisation remplissage entité)
- RetentionHeatmap (cohorte × année, gradient couleur)
- WaterfallChart (cascade admis → désistés → inscrits)

## Arbre de fichiers cible

8 fichiers nouveaux, 8 modifiés, 4 supprimés (en Phase E).
Total après extension : ~4 000 lignes (vs ~2 400 actuel).
