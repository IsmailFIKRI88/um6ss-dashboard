# Agent : Stratège Média — SOV & ESOV

> Session 2 · Mars 2026 · Mission : définir comment mesurer le SOV pour une université privée

## Périmètre du marché SOV

Deux marchés parallèles :
- **Marché ads** = universités privées santé (3-5 concurrents)
- **Marché search** = toutes facultés santé Maroc (public inclus pour requêtes génériques)

## Comment mesurer le SOV sans données concurrents

| Source | Fiabilité | Effort | Fréquence |
|---|---|---|---|
| Google Ads Auction Insights (IS) | Haute | Faible (API) | Hebdomadaire |
| Meta Ad Library (nombre annonces) | Moyenne | Moyen (API) | Mensuel |
| Semrush SOV organique | Haute | Faible (outil) | Mensuel |
| Social listening (Google Alerts) | Basse | Gratuit | Continu |

Google IS est le proxy le plus fiable. Formule directe : `SOV_Google = impression_share`.

## SOV Composite

```
SOV_composite = SOV_Search × 0.40 + SOV_Organique × 0.35 + SOV_Meta_estimé × 0.25
```

## ESOV — Adaptation éducation

Coefficient Binet & Field adapté : **0.025** (0.25% SOM par 10 points ESOV).
Conservateur vs FMCG (0.05) car : capacité contrainte, cycle long, saisonnalité.

À calibrer après 2 saisons de données.

## Limites

1. Ne jamais agréger branded et generic dans le même IS
2. Pondérer toujours par volume de recherche (IS × Search Volume)
3. Décalage 6-18 mois entre ESOV positif et gain SOM en éducation
4. SOV cesse d'être pertinent quand le goulot est la capacité, pas la demande
5. Coefficient non calibré tant que < 2 saisons de données → toujours afficher "non calibré"

## Métriques pour le dashboard

- `impression_share` (Google IS, champ à ajouter dans l'endpoint ad-spend)
- `search_lost_budget` / `search_lost_rank` (IS perdu, pour diagnostic)
- SOV composite mensuel
- ESOV avec intervalle de confiance
