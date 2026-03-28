# Agent 15 — Information Architect : Inventaire, Wireframes & Hierarchies

## Inventaire par vue (etat actuel)

- **Strategie** : 8 sections (alertes, remplissage, funnel, tendance, projection, cohorts, data quality, config panels)
- **Acquisition** : 7 sections (KPIs canaux, CPL, pacing, drill-down, ESOV, cohorts, config panels)
- **QualiteLeads** : 6 sections (buckets scoring, conversion, repartition canal, diagnostics form, cohorts, config)
- **Budget** : 6 sections (spend vs budget, CPL/CAC, ROAS, P&L, projection, config)
- **Probleme** : panels config repetes dans chaque vue, doublons ROAS/CAC entre Acquisition et Budget

## Wireframes textuels — Hierarchies recommandees

### Vue Strategie (DG)
```
[HERO] Jauge remplissage : X/Y inscrits (Z%)     [Alertes: N]
[ROW]  Funnel global   |  Tendance leads/semaine  |  Projection fin campagne
[ROW]  Top 3 entites   |  Data quality status
[FOLD] Detail cohorts (replie par defaut)
```

### Vue Acquisition (Marketing)
```
[HERO] CPL moyen + evolution   |  Budget consume: X%   |  ESOV
[ROW]  4 cards canaux (Meta/Google/LinkedIn/TikTok) avec spend, leads, CPL
[DRILL] Clic canal -> Campagnes -> Ad Sets -> Creas (breadcrumb)
[ROW]  Pacing budget (burn rate + projection)
[FOLD] Cohorts acquisition (replie)
```

### Vue Qualite Leads (Admissions)
```
[HERO] Leads chauds en attente: N   |  Taux conversion qualifie: X%
[ROW]  Buckets scoring (barres horizontales, chauds en haut)
[ROW]  Conversion par canal   |  Delai moyen lead -> qualifie
[ROW]  Diagnostics formulaire (waterfall friction)
[FOLD] Detail par entite (replie)
```

### Vue Budget (CFO)
```
[HERO] Spend total vs budget   |  Cout par inscrit   |  Jours restants
[ROW]  Repartition spend par canal (pie/bar)   |  ROAS
[ROW]  P&L campagne simplifie (revenus - couts = marge)
[ROW]  Projection spend fin campagne   |  Payback period
[FOLD] Detail par entite (replie)
```

### Onglet Parametres (nouveau)
```
[SECTION] Connexion API (URL, cle, test)
[SECTION] Parametres financiers (LTV, frais scolarite, duree)
[SECTION] Estimations Fermi (TAM/SAM/SOM, intervalles)
[SECTION] Preferences affichage (theme, refresh interval)
```

## Priorites d'implementation

### P0 — Critique
1. **Deplacer panels config** dans un onglet Parametres dedie. Elimine le bruit dans les 4 vues.
2. **Reordonner Strategie** : remplissage en hero, alertes en haut a droite, funnel dessous.
3. **Eliminer doublons ROAS/CAC** : ROAS maitre dans Budget, reference dans Acquisition.

### P1 — Important
4. Inverser ordre buckets dans QualiteLeads (chauds d'abord).
5. Ajouter breadcrumb dans le drill-down Acquisition.
6. Sections repliables (FOLD) pour le contenu secondaire.

### P2 — Nice to have
7. Liens cross-vues ("Voir detail dans Budget") pour les metriques en reference.
8. Mode resume (1 ecran) vs mode detail par vue.

## Principes de hierarchie appliques

- **Pyramide inversee** : la reponse a la question principale est toujours en haut (hero)
- **Progressive disclosure** : detail en fold, drill-down sur clic
- **Single source of truth** : chaque KPI a une vue maitre, les autres font reference
- **Config separee du contenu** : les parametres ne polluent pas l'analyse
