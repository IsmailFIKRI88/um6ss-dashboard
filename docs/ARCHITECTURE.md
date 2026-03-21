# Dashboard V2 — Plan Directeur

> Ce fichier est le point d'entrée. Les specs détaillées sont dans `specs/`.

## Vue d'ensemble

Dashboard React de pilotage campagne acquisition UM6SS. 5 vues par rôle décideur, ~80 KPIs, données multi-sources via API unifiée.

## Vues

| Vue | Rôle | Question | Fréquence | Spec |
|-----|------|----------|-----------|------|
| Stratégie | CODIR / DG | "On remplit ou pas ?" | Mensuelle | [specs/views.md#strategie](specs/views.md#vue-1--stratégie-codir) |
| Acquisition | Marketing / Growth | "Où mettre le prochain dirham ?" | Hebdo/quotidienne | [specs/views.md#acquisition](specs/views.md#vue-2--acquisition-marketinggrowth) |
| Qualité Leads | Admissions | "Les leads sont-ils bons ?" | Hebdo | [specs/views.md#qualite](specs/views.md#vue-3--qualité-leads-admissions) |
| Budget | Finance | "On dépense bien ?" | Mensuelle | [specs/views.md#budget](specs/views.md#vue-4--budget-finance) |
| Marque & Comm | Communication | "On est visible et crédible ?" | Hebdo | [specs/views.md#marque](specs/views.md#vue-5--marque--communication-nouvelle) |

## Filtres globaux

6 dimensions transverses appliquées à toutes les vues. → [specs/filters-periods.md](specs/filters-periods.md)

```
Header : [Entité ▼] [Campus ▼] [Canal ▼] [Pays ▼] [Période ▼] [Cohorte ▼]
```

Chaque KPI affiche `valeur actuelle` + `Δ vs N-1` (même période année précédente).

## Funnel

9 étapes admissions (Lead brut → Paiement reçu). Migration progressive — les étapes sans source connectée sont grisées. → [specs/funnel.md](specs/funnel.md)

## Canaux

14 canaux d'acquisition (9 actuels + WhatsApp, Événement, Partenaire, Bouche-à-oreille, Organic Social). → [specs/channels.md](specs/channels.md)

## Source de données

Le dashboard consomme **une API REST unifiée**. Aujourd'hui c'est WordPress directement. Demain c'est le data hub (repo séparé).

Le contrat d'interface :
- Base URL configurable dans le Settings Panel
- Auth : header `X-UM6SS-API-Key`
- Format : JSON paginé, headers `X-WP-Total` / `X-WP-TotalPages`
- Le dashboard ne sait pas (et n'a pas besoin de savoir) ce qu'il y a derrière l'API

Les 4 couches de sources et leur statut de connexion. → [specs/data-sources.md](specs/data-sources.md)

## Règles d'honnêteté des données

1. Pas de KPI financier (ROAS, payback, revenue) sans données inscriptions réelles
2. Pas de projection inscrits sans taux de conversion calculé depuis données réelles
3. Pas de score numérique data quality — 3 niveaux seulement (OK / Vérifier / Problème)
4. Disclaimer visible quand attribution first-touch
5. Pas de benchmarks inventés présentés comme des faits
6. Les étapes du funnel sans source connectée sont grisées, pas inventées
7. En l'absence de N-1, afficher `—` avec tooltip, pas un faux 0%

## Migration — 3 phases

### Phase 1 : Dashboard actuel enrichi
- Ajouter les 4 canaux manquants
- Ajouter campus comme filtre global
- Ajouter comparaison N-1 (vide si 1ère campagne)
- Enrichir funnel avec les étapes disponibles
- Ajouter taux de remplissage global + manque à gagner places vides
- Source : WordPress uniquement

### Phase 2 : Proxy backend + sources externes
- Dashboard consomme le data hub au lieu de WP directement
- GA4 + Search Console connectés
- SharePoint (SI Scolarité) pour funnel complet
- Vue Marque ajoutée (blocs 7-8)
- Historique N-1 stocké dans le data hub

### Phase 3 : Couverture complète
- WhatsApp, APIs sociales, SI Finance, veille média, événements SharePoint
- Modèles prédictifs (what-if, efficience marginale)
- Génération PDF CODIR via agent IA

## Delta actuel vs cible

| Composant | V1 (actuel) | V2 (cible) |
|-----------|-------------|------------|
| Vues | 4 | 5 (+Marque) |
| KPIs | ~20 | ~80 |
| Sources | 1 (WordPress) | 10+ (via data hub) |
| Canaux | 9 | 14 |
| Funnel | 8 étapes marketing | 9 étapes admissions |
| Filtres globaux | 1 (entité) | 6 |
| Comparaison N-1 | Trend 30j | Systématique |
| Période | Presets fixes | Presets + sur mesure + N-1 auto |
| Backend | Client → WP direct | Proxy data hub sécurisé |
