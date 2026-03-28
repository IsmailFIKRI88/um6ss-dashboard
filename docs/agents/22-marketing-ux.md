# Agent 22 — Marketing UX Audit

**Mission** : Evaluer l'experience utilisateur de la vue Acquisition pour un responsable marketing.

## Score global : 6.5/10

Le workflow drill-down fonctionne en 2 clics (bon), mais plusieurs problemes d'affordance
et de layout reduisent l'efficacite du parcours.

## Workflow drill-down

**Parcours actuel** : Cards canal > Table campagnes > Table creatives
- 2 clics pour atteindre le niveau campagne : acceptable
- Le retour arriere est implicite (scroll up) : pas ideal mais fonctionnel

## Problemes UX identifies

### 1. Cards canal non evidemment cliquables (severite : haute)
Les cards canal (Meta, Google, LinkedIn, TikTok) sont cliquables mais rien ne l'indique :
- Pas de curseur pointer au hover
- Pas d'effet hover (elevation, bordure, couleur)
- Pas de texte "Voir campagnes >" ou chevron

**Recommandation** : Ajouter `cursor: pointer`, un hover subtle (ombre ou bordure), et un
chevron ou texte "Voir detail" en bas de card.

### 2. CampaignCreatives sous la table (severite : haute)
Quand on clique sur une campagne, les creatives apparaissent sous la table des campagnes.
Cela cree une rupture spatiale : l'utilisateur doit scroller pour voir le detail.

**Recommandation** : Drawer lateral (slide-in depuis la droite) pour les creatives.
L'utilisateur garde le contexte de la table campagnes visible a gauche.

### 3. Trend non branche (severite : moyenne)
Le composant `KPICard` supporte une prop `trend` (fleche haut/bas avec pourcentage et couleur).
La vue Acquisition ne passe jamais cette prop. Les KPIs sont donc statiques et ne montrent
pas si la situation s'ameliore ou se degrade.

**Recommandation** : Calculer le delta semaine courante vs semaine precedente dans
`useAdSpendData` et le passer aux KPICards.

### 4. Breakdowns en badges texte (severite : basse)
Les breakdowns demographiques (age, genre, device) sont affiches en badges texte.
Pas de visualisation (bar chart, donut). Pour un marketeur, une repartition visuelle
est plus lisible qu'une liste de pourcentages.

**Recommandation** : Mini bar chart horizontal inline pour les breakdowns.

## Valeur ajoutee vs outils natifs

| Fonctionnalite | Score | Detail |
|----------------|-------|--------|
| Phantom gap | 10/10 | Aucun outil natif ne compare conversions plateforme vs leads WP |
| Scoring qualif | 9/10 | CPL par bucket de scoring = introuvable nativement |
| Multi-canal unifie | 8/10 | Vue unifiee Meta + Google + LinkedIn + TikTok en un ecran |
| **Moyenne valeur unique** | **9/10** | Le dashboard a une vraie raison d'exister |

## Top propositions d'amelioration

### Priorite 1 — Brancher les trends (effort : 2h)
Calculer `currentWeekSpend / previousWeekSpend - 1` dans le hook et passer aux KPICards.
Impact immediat sur la lisibilite du pilotage.

### Priorite 2 — Tri cards par CPL (effort : 1h)
Permettre de trier les cards canal par CPL croissant (ou spend, ou leads).
Aide a repondre instantanement a "ou mettre le prochain dirham".

### Priorite 3 — Sparklines inline (effort : 4h)
Ajouter un mini graphe (7 derniers jours) dans chaque card canal.
Montre la tendance sans cliquer. Utiliser Recharts `<Sparkline>` ou `<LineChart>` mini.

### Priorite 4 — Drawer creatives (effort : 6h)
Remplacer l'affichage sous-table par un drawer lateral.
Meilleure conservation du contexte, pattern standard des dashboards marketing.

## Benchmark UX dashboard marketing

Comparaison avec les patterns standards (Triple Whale, Northbeam, Supermetrics) :
- Navigation drill-down : standard respecte (clic sur ligne)
- Affordance : en dessous du standard (pas de hover states)
- Trends : en dessous du standard (tous les dashboards montrent le delta)
- Filtres : correct (periode + entite) mais manque filtre statut campagne
