# Agent 23 — Data Integrity Audit

**Mission** : Identifier les bugs et risques d'integrite des donnees dans le pipeline
leads WordPress > processing > affichage.

## 3 bugs critiques

### Bug 1 — Double-comptage leads via includes() substring

**Localisation** : `src/processing/reconciliation.js`

Le matching leads-campagnes utilise `campaign_name.includes(utm_campaign)` (ou l'inverse).
Un lead avec `utm_campaign = "medecine"` matchera :
- "medecine-2026"
- "medecine-dentaire-2026"
- "prepa-medecine-2026"

**Impact** : Un meme lead est compte dans N campagnes. Le CPL par campagne est sous-evalue
(plus de leads attribues que reel). Le total des leads par campagne > total reel.

**Correction** : Matching exact ou par ID (`campaign_id` au lieu de `campaign_name`).
A defaut, utiliser un separateur strict et matcher le segment complet :
`utm_campaign === campaign_slug` (egalite stricte).

### Bug 2 — first_touch_source absent de criticalFields

**Localisation** : `src/processing/dataQuality.js`

Le module dataQuality definit une liste `criticalFields` pour verifier la completude
des leads. Le champ `first_touch_source` n'y figure pas.

**Impact** : Un lead sans `first_touch_source` passe le check qualite sans alerte.
L'attribution first-touch est silencieusement faussee : ces leads tombent dans "Direct"
ou "Unknown" sans que personne ne soit alerte.

**Correction** : Ajouter `first_touch_source` a `criticalFields`. Afficher un warning
dans la vue Strategie quand le taux de first_touch_source manquant depasse 5%.

### Bug 3 — platform_conversions semantique ambigue

**Localisation** : `src/data/useAdSpendData.js`, champ `conversions` de `/ad-spend`

Le champ `conversions` de l'API ad-spend a une semantique differente selon la plateforme :
- **Meta** : 1 conversion = 1 action optimisee (lead form, page view, etc.)
- **Google** : 1 conversion = peut inclure plusieurs actions (appel + formulaire + page)
- **TikTok** : 1 conversion = complete payment ou submit form selon config

**Impact** : Le phantom gap (conversions plateforme - leads WP) est biaise.
Google sur-declare mecaniquement. La comparaison inter-plateforme est non fiable.

**Correction** : Ajouter un indicateur de fiabilite par plateforme dans le phantom gap.
Afficher un disclaimer "Conversions Google = multi-actions" dans le tooltip.

## Problemes secondaires

### Fetch partiel silencieux
Les hooks `useWordPressData` et `useAdSpendData` utilisent `.catch(() => [])` sur
certains endpoints. Si `/outcomes` echoue, le dashboard affiche 0 inscriptions sans
erreur visible. L'utilisateur croit que les donnees sont completes.

**Correction** : Tracker le statut de chaque endpoint. Afficher un badge par source
(OK / Erreur / Partiel) dans le header ou le Settings panel.

### UTM orphelins non traces
Les leads avec un `utm_campaign` qui ne matche aucune campagne dans `/ad-spend`
sont silencieusement ignores dans la reconciliation. Pas de compteur "leads non reconcilies".

**Correction** : Ajouter un KPI "leads non reconcilies" dans la vue Acquisition.
Si > 10%, afficher une alerte.

### Campagnes pausees non filtrables
Les campagnes pausees ou terminees sont melangees avec les actives dans toutes les tables.
Leurs metriques (CPL eleve car plus de spend mais leads anciens) polluent les moyennes.

**Correction** : Ajouter un champ `status` dans l'API ad-spend et un filtre dans la vue.

## 3 corrections prioritaires

| Priorite | Bug | Effort | Impact |
|----------|-----|--------|--------|
| P0 | Deduplication single-pass (includes > ===) | 2h | Elimine le double-comptage |
| P1 | first_touch_source dans criticalFields | 30min | Attribution fiable |
| P2 | Indicateur integrite par plateforme | 4h | Phantom gap fiable |

## Principe general

Le dashboard respecte bien la regle "pas de KPI sans donnees reelles" (CLAUDE.md).
Mais il manque la regle symetrique : **signaler quand les donnees sont partielles
ou ambigues**. Le fetch silencieux et l'absence de metriques d'integrite sont les
deux plus grands risques pour la confiance dans les chiffres affiches.
