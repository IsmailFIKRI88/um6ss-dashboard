> **Note (mars 2026)** : Vision V2. Le code actuel implémente un funnel 8 étapes marketing.
> L'extension à 9 étapes admissions est prévue en Phase B.

# Funnel Admissions — 9 étapes

## Étapes

| # | Étape | Définition | Source | Statut |
|---|-------|-----------|--------|--------|
| 1 | **Lead brut** | Contact entré (formulaire, event, partenaire) | WordPress | ✅ |
| 2 | **Lead qualifié (MQL)** | Score ≥ 60 | Scoring WP | ✅ |
| 3 | **Dossier déposé** | Candidat a initié un dossier | SI Scolarité | ❌ |
| 4 | **Dossier complet** | Toutes les pièces fournies | SI Scolarité | ❌ |
| 5 | **Concours/entretien passé** | Évaluation passée | SI Scolarité | ❌ |
| 6 | **Admissible** | Résultat positif | SI Scolarité | ❌ |
| 7 | **Admis** | Décision d'admission formelle | SI Scolarité | ❌ |
| 8 | **Inscription confirmée** | Pré-inscription / intention | SI Scolarité | ❌ |
| 9 | **Paiement reçu (inscrit)** | Premier paiement effectué | SI Finance | ⚠️ Via outcomes WP |

## Affichage

- Les étapes avec données : barre pleine avec count + taux de conversion depuis l'étape précédente
- Les étapes sans source : barre grisée, label "Source non connectée"
- Jamais de données inventées pour combler les trous

## Métriques dérivées

| Métrique | Calcul | Usage |
|----------|--------|-------|
| Taux conversion inter-étapes | count(étape N+1) / count(étape N) × 100 | Identifier le goulot |
| Vélocité par étape | Durée moyenne (jours) entre timestamps étapes N et N+1 | Identifier les ralentissements |
| Leads stagnants | Leads sans changement > X jours (seuil par étape) | Déclencher relances |
| Projection remplissage | Pipeline actuel × taux conv. historique par étape | Anticiper le gap |
| Écart projection vs objectif | Inscrits projetés − objectif remplissage | Quantifier le problème |

## Migration

| Phase | Étapes disponibles | Source |
|-------|-------------------|--------|
| Phase 1 (actuel) | 1, 2, 9 | WordPress (`leads` + `outcomes`) |
| Phase 2 (data hub) | 1, 2, 3-8, 9 | WP + SI Scolarité + SI Finance |
