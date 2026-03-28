# Agent 21 — Marketing Granularity Audit

**Mission** : Evaluer la profondeur de drill-down marketing et identifier les trous de granularite.

## Score global : 6.5/10

Le dashboard offre un drill-down en 4 niveaux theoriques, mais le niveau creatif est incomplet
et le niveau ad set est absent.

## Drill-down par niveau

| Niveau | Score | Detail |
|--------|-------|--------|
| Plateforme (Meta/Google/LinkedIn/TikTok) | 8/10 | Cards canal avec spend, leads, CPL. Bon. |
| Campagne | 8/10 | Table avec spend, leads, CPL WP. Tri et filtre OK. |
| Creative | 5/10 | Affiche spend/impressions/clicks/CTR mais pas CPL WP par crea. |
| Ad Set | 0/10 | Absent. Pas de niveau intermediaire campagne > crea. |

## Phantom gap — Valeur unique du dashboard

Le "phantom gap" (ecart entre conversions plateforme et leads WordPress) est la fonctionnalite
la plus differenciante. Aucun outil natif ne le calcule. Il revele :
- Les conversions fantomes (Meta compte, WP ne voit pas)
- Les problemes de tracking (pixel, UTM casses)
- La sur-declaration des plateformes

**Score valeur unique : 9/10** — c'est la raison d'etre du dashboard vs les outils natifs.

## CPL Qualifie — Absent des plateformes natives

Le CPL calcule depuis les leads WordPress (pas les conversions plateforme) est disponible
aux niveaux plateforme et campagne. C'est un KPI que Meta/Google ne peuvent pas fournir.

**Mais** : le CPL WP par creative est absent. La reconciliation `reconciliation.js` matche
au niveau `campaign_name` (via UTM), pas au niveau `ad_id`. Pour descendre au niveau crea,
il faudrait enrichir les UTMs avec `ad_id` ou `ad_name`.

## Manques critiques identifies

### 1. Comparaison periode/periode (absent)
Pas de "vs semaine derniere" ou "vs meme periode mois dernier". Le composant trend (fleche
haut/bas) existe dans `ui/index.jsx` mais n'est pas branche dans la vue Acquisition.

### 2. Trend KPI non branche
`KPICard` accepte une prop `trend` mais la vue Acquisition ne la passe jamais.
Les donnees temporelles existent dans `useAdSpendData` pour calculer le delta.

### 3. ROAS par campagne absent
Le ROAS global est dans la vue Budget. Pas de ROAS par campagne car il necessite
les outcomes (inscriptions) par campagne, pas seulement les leads.

### 4. Filtre statut campagne absent
Les campagnes pausees, terminees et actives sont melangees. Pas de filtre pour isoler
les campagnes actives uniquement. Impact : pollution des CPL moyens.

### 5. CPL WP par creative absent
La reconciliation se fait au niveau campagne (utm_campaign). Descendre au niveau
creative necesserait d'ajouter utm_content=ad_id dans les UTMs des ads.

## Rafraichissement des donnees

Les donnees ads arrivent via un cron WordPress toutes les 6h avec possibilite de refresh
manuel depuis le Settings panel. Latence acceptable pour un dashboard de pilotage
(pas de real-time bidding).

## Recommandations prioritaires

1. **Brancher les trends** sur les KPICards Acquisition (effort : faible, impact : fort)
2. **Ajouter un filtre statut campagne** actif/pause/termine (effort : moyen)
3. **Enrichir les UTMs** avec ad_id pour permettre le CPL WP par creative (effort : moyen, cote ads)
4. **Ajouter le niveau ad set** entre campagne et creative (effort : moyen, cote API)
