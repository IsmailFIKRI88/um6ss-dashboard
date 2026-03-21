# Sources de Données — Statut réel

Le dashboard consomme une API REST unifiée. Ce document liste les sources et leur statut **vérifié** — pas les intentions.

## Couche 1 : "Je contrôle" (accès direct)

| Source | Données | Statut | Détail |
|--------|---------|--------|--------|
| WordPress leads | Leads, scoring, geo, form, funnel étapes 1-2 | ✅ Connecté | Plugin `um6ss-rest-api` → endpoints `/leads`, `/visits`, `/abandons`, `/outcomes`, `/experiments`, `/schema` |
| Meta Ads | Spend, impressions, clicks, conversions, créas | ❌ **Non connecté** | Le dashboard a le code frontend prêt (`useAdSpendData.js`, vues Acquisition/Budget) mais aucun endpoint `/ad-spend` n'existe côté plugin WP. Pas de table `ad_spend` en base. |
| Google Ads | Spend, impressions, clicks, impression share | ❌ **Non connecté** | Idem — code frontend prêt, pas de backend |
| LinkedIn Ads | Spend, impressions, clicks | ❌ **Non connecté** | Idem |
| TikTok Ads | Spend, impressions, clicks | ❌ **Non connecté** | Idem |
| GA4 | Sessions, pageviews, conversions LP, sources | ❌ Non connecté | Ni frontend ni backend |
| Google Search Console | Requêtes, positions, clics SEO | ❌ Non connecté | |
| WhatsApp Business API | Messages envoyés/lus/répondus | ❌ Non connecté | |
| Plateformes sociales | Posts, reach, engagement, followers | ❌ Non connecté | |

## Couche 2 : "Je négocie" (convention DSI/DAF)

| Source | Données | Statut |
|--------|---------|--------|
| SI Scolarité | Inscrits, effectifs, capacités, statuts admis, dossiers | ❌ Non connecté |
| SI Finance | CA, recouvrement, créances, bourses, budget | ❌ Non connecté |

## Couche 3 : "Je construis" (à structurer)

| Donnée | Où la créer | Statut |
|--------|------------|--------|
| Motifs de non-inscription | Champ CRM (chargés admissions) | ❌ |
| Suivi partenaires terrain | SharePoint ou CRM | ❌ |
| Pipeline visa/logistique international | SharePoint | ❌ |
| Veille média structurée | Outil dédié ou SharePoint | ❌ |

## Couche 4 : "Je calcule" (modèles dérivés)

| Modèle | Input → Output | Statut |
|--------|----------------|--------|
| Valeur pipeline | Leads × taux conv. × ARPU → MAD | ❌ |
| LTV | Frais × durée × rétention → MAD/inscrit | ✅ `financial.js` |
| Projection remplissage | Pipeline + vélocité + historique → inscrits projetés | ⚠️ Partiel (`projection.js`) |
| Efficience marginale | Courbe rendement par canal → CPA marginal | ❌ |
| Scénarios what-if | Budget additionnel × rendement → inscrits additionnels | ❌ |

## Contrat d'interface API

Le dashboard attend :
- **Base URL** : configurable (Settings Panel)
- **Auth** : header `X-UM6SS-API-Key`
- **Format** : JSON paginé, headers `X-WP-Total` / `X-WP-TotalPages`

### Endpoints existants (WordPress plugin)

```
GET /leads          ✅
GET /leads/{id}     ✅
GET /visits         ✅
GET /abandons       ✅
GET /outcomes       ✅
GET /experiments    ✅
GET /schema         ✅
```

### Endpoints attendus par le dashboard mais inexistants

```
GET /ad-spend       ❌ Le dashboard appelle, le serveur retourne 404
GET /ad-breakdowns  ❌ Idem
GET /ad-video       ❌ Idem
GET /ad-schema      ❌ Idem
```

### Endpoints futurs (data hub)

```
GET /ga4-sessions
GET /social-posts
GET /social-metrics
GET /scolarite-admissions
GET /finance-transactions
GET /events
```
