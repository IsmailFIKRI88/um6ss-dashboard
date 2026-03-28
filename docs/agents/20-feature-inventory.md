# Agent 20 — Feature Inventory

**Mission** : Inventorier exhaustivement les fonctionnalites du dashboard et scorer leur maturite.

## Inventaire global

**133 fonctionnalites identifiees** reparties en 3 statuts :

| Statut | Nombre | % |
|--------|--------|---|
| Operationnelles | 45 | 34% |
| En attente de donnees | 75 | 56% |
| Non exposees (processing only) | 7 | 5% |
| Partiellement implementees | 6 | 5% |

Les 75 fonctionnalites "en attente" dependent de l'API WordPress (`/leads`, `/outcomes`, `/ad-spend`).
Sans connexion API reelle, elles affichent des etats vides ou des fallbacks gracieux.

## Scoring maturite (grille /15)

Criteres : implementation (5), integration donnees (5), UX/affordance (5).

### Top scores (15/15)

| Fonctionnalite | Vue | Justification |
|----------------|-----|---------------|
| Navigation inter-vues | Layout | Routing complet, etat actif, icones |
| Filtre periode | Header | DateRange picker, presets, persistance |
| Systeme d'alertes | Strategie | Seuils configurables, 3 niveaux, badges |
| Cards canal | Acquisition | KPIs, couleurs plateforme, clic drill-down |

### Lowest scores (7/15)

| Fonctionnalite | Score | Probleme |
|----------------|-------|----------|
| Footer | 7/15 | Contenu statique, pas de valeur actionnable |
| DesignModePicker | 7/15 | Switcher present mais un seul mode actif |
| CSV Export | 8/15 | Fonctionnel mais pas de selection colonnes |

## 7 modules processing non exposes

Ces modules existent dans `src/processing/` mais aucune vue ne les consomme :

1. **funnel.js** — Calcul complet visite > lead > qualifie > inscrit. Aucune vue Funnel dediee.
2. **cohortAnalysis.js** — Cohortes hebdomadaires prets. Pas de tableau cohorte dans aucune vue.
3. **engagement.js** — Score x engagement quadrants (retire par design, cf. CLAUDE.md).
4. **attribution.js** — Matrice first-touch / last-touch complete. Seul first-touch utilise.
5. **channelRoles** — Roles par canal (initiateur, convertisseur). Non affiche.
6. **dataQuality.js** — Details granulaires disponibles, seul le badge OK/Warning/Error est expose.
7. **reconciliation.js** — Matching click IDs complet mais pas de vue reconciliation dediee.

## 3 fonctionnalites les plus sous-utilisees (score vs potentiel)

### 1. Funnel complet (potentiel 15, score 3)
Le processing calcule tout le funnel. Seuls les KPIs isoles sont affiches.
Un visuel funnel (barres empilees ou Sankey) aurait un impact majeur en vue Strategie.

### 2. Cohortes hebdomadaires (potentiel 12, score 0)
`cohortAnalysis.js` est complet avec retention par semaine.
Aucune visualisation. Impact fort pour Admissions (suivi qualite dans le temps).

### 3. Attribution multi-touch (potentiel 14, score 4)
Seul first-touch est utilise. Last-touch et la comparaison first/last sont calcules
mais jamais affiches. La vue Acquisition beneficierait d'un toggle first/last.

## Repartition par vue

| Vue | Operationnelles | En attente | Non exposees |
|-----|-----------------|------------|--------------|
| Strategie | 12 | 18 | 2 |
| Acquisition | 15 | 22 | 3 |
| Qualite Leads | 10 | 20 | 1 |
| Budget | 8 | 15 | 1 |

## Recommandation prioritaire

Exposer le funnel visuel et les cohortes dans les vues existantes (pas de nouvelle vue).
Cela transformerait 2 modules "dead code" en fonctionnalites a fort impact avec un effort
d'implementation faible (les calculs sont deja faits).
