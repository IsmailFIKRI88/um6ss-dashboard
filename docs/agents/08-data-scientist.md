# Agent : Data Scientist — Formules mathématiques Fermi

> Session 2 · Mars 2026 · Mission : modèle formel avec propagation d'incertitude

## Variables d'entrée (distributions triangulaires)

| Variable | Min | Mode | Max |
|---|---|---|---|
| bacheliers_sci | 28 000 | 32 000 | 36 000 |
| pct_sante | 0.18 | 0.22 | 0.28 |
| pct_solvable | 0.18 | 0.24 | 0.32 |
| pct_pas_public | 0.30 | 0.40 | 0.50 |
| pct_prefere_prive | 0.40 | 0.55 | 0.70 |
| market_share | 0.08 | 0.15 | 0.25 |

## Formules

```
TAM(θ) = B × ps × (1 + pA + pR)
SAM(θ) = TAM(θ) × psv × pnp × ppp
SOM(θ) = min(SAM(θ) × ms, Cmax)
```

## Propagation d'incertitude — Monte Carlo

N = 100 000 tirages. IC 80% recommandé (P10-P90). Le `min(·, Cmax)` crée une non-linéarité qui invalide la propagation analytique.

## Métriques dérivées

- Taux de pénétration : τ = Ir / SOM_P50
- Taux de capture : τcap = L / TAM_P50 (14.8% si L=3400, TAM=23K — dans le benchmark 8-20%)
- Efficacité funnel relative : εrel = (Ir/L) / (SOM/TAM)
- Headroom : H = SOM_P50 - Ir
- SOV requis : SOV_req = (ms_cible / ms_actuel)^(1/α) × SOV_actuel (α ≈ 0.8)
- Budget requis : Budget = SOV_req × CPM_moyen × TAM_digital

## Analyse de sensibilité (indices de Sobol)

Toutes les élasticités sont unitaires (modèle multiplicatif) sauf pA et pR (poids dilué).
**Paramètre prioritaire à préciser : pct_solvable** (plus large incertitude relative × élasticité unitaire).

Si pct_solvable passe de 20% à 30% → SOM augmente de 50%.

## Mise à jour bayésienne

Prior : TAM ~ LogN(μ0, σ0²)
Posterior semestriel : σ_post⁻² = σ_prior⁻² + σ_lik⁻²
Règle : si |μ_post - μ_prior| > 1.5σ_prior → révision complète du Fermi.

## Affichage anti-fausse précision

| CV | Format |
|---|---|
| < 0.05 | Entier exact |
| 0.05-0.15 | Arrondi 500 |
| 0.15-0.30 | Arrondi 1K |
| ≥ 0.30 | Ordre de grandeur |

Confiance = 1 - (SOM_P90 - SOM_P10) / SOM_P50. Vert [0.7,1], Orange [0.4,0.7], Rouge [0,0.4].
