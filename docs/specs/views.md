# Vues — Specs détaillées

## Vue 1 : Stratégie (CODIR)

**Question** : "On remplit ou pas ?"
**Fréquence** : mensuelle

### 8 KPIs CODIR

| # | KPI | Calcul | Statut | Source cible |
|---|-----|--------|--------|-------------|
| 1 | Taux de remplissage | Inscrits (paiement) / Capacité × 100 | ⚠️ Partiel | SI Scolarité + SI Finance |
| 2 | Progression vs N-1 | Taux remplissage vs même date N-1 | ❌ Pas de N-1 | Data hub historique |
| 3 | Yield rate | Admis inscrits / Total admis × 100 | ❌ Pas de statut admis | SI Scolarité |
| 4 | CPA global | Budget total / Inscrits attribuables | ✅ Existe | Toutes sources |
| 5 | Valeur du pipeline | Leads actifs × taux conv. × ARPU | ❌ À créer | CRM + modèle |
| 6 | Ratio demande/offre | Candidatures complètes / Places dispo | ❌ | SI Scolarité + CRM |
| 7 | Mix géographique | Répartition inscrits par zone | ⚠️ Partiel (dans QualiteLeads) | SI Scolarité |
| 8 | Budget consommé/alloué | % budget engagé, indexé saisonnalité | ✅ Existe | Comptabilité |

### Sections

- Funnel 9 étapes (visuel)
- Projection remplissage à fin campagne
- Alertes : entités en retard, budget épuisé, chute leads
- Remplissage par entité (jauge avec capacité)
- Scoring buckets (barres)

---

## Vue 2 : Acquisition (Marketing/Growth)

**Question** : "Où mettre le prochain dirham ?"
**Fréquence** : hebdo/quotidienne

### Bloc 3 — Performance média

| # | Métrique | Statut |
|---|----------|--------|
| 3.1 | Dépense par plateforme | ✅ |
| 3.2 | CPL par plateforme | ✅ |
| 3.3 | CPL qualifié par plateforme | ✅ |
| 3.4 | CPA par plateforme | ⚠️ Partiel |
| 3.5 | CTR | ✅ |
| 3.6 | Taux conversion LP | ❌ GA4 |
| 3.7 | Coût par visite LP | ❌ GA4 |
| 3.8 | ROAS indicatif | ✅ (Budget) |
| 3.9 | Impression share | ❌ Google Ads API |

### Bloc 5 — Événements acquisition

| # | Métrique | Source |
|---|----------|--------|
| 5.1 | Leads par événement | CRM (channel_group = event) |
| 5.2 | Coût par lead événement | Comptabilité + CRM |
| 5.3 | Taux conversion post-event (30/60/90j) | CRM attribution |
| 5.4 | CPA événement | Comptabilité + CRM + SI Scolarité |
| 5.5 | Performance par partenaire terrain | CRM (channel_group = partner) |

### Existant conservé

- Drill-down Canal → Campagne → Créa
- Attribution toggle first/last touch
- Budget pacing + burn rate
- CPL timeline

### À ajouter

- Filtre campus dans les KPIs canal
- Événements comme canal à part entière

---

## Vue 3 : Qualité Leads (Admissions)

**Question** : "Les leads sont-ils bons ?"
**Fréquence** : hebdo

### Bloc 2 — Qualité et scoring

| # | Métrique | Statut |
|---|----------|--------|
| 2.1 | Score moyen | ✅ |
| 2.2 | Distribution des scores | ✅ |
| 2.3 | Taux conversion par tranche de score | ⚠️ Par entity, pas par bucket |
| 2.4 | Taux de qualification | ✅ Calculable |
| 2.5 | Motifs de disqualification | ❌ Champ inexistant |

### Bloc 4 — Interactions nurturing

| # | Métrique | Source |
|---|----------|--------|
| 4.1 | Taux contact premier < 24h | CRM timestamps |
| 4.2 | Volume WhatsApp (envoyé/lu/répondu) | WhatsApp Business API |
| 4.3 | Taux réponse WhatsApp par template | WhatsApp Business API |
| 4.4 | Volume appels (sortants/entrants) | Téléphonie IP / CRM |
| 4.5 | Taux contact utile (appels) | CRM |
| 4.6 | Taux ouverture email | CRM |
| 4.7 | Taux clic email | CRM |
| 4.8 | Taux réponse global (tous canaux) | CRM agrégation |
| 4.9 | Motifs de non-inscription des admis | CRM (champ à créer) |

### Bloc 6 — International (conditionnel : filtre géo ≠ Maroc)

| # | Métrique | Source |
|---|----------|--------|
| 6.1 | Pipeline par statut administratif (visa, logement, arrivée) | SharePoint / CRM |
| 6.2 | Taux conversion admis → arrivé par pays | Suivi interne |
| 6.3 | Délai moyen visa par pays | Suivi interne |

### Existant conservé

- Scoring buckets + CPL par bucket
- Qualité par canal (table score moyen)
- Origine géographique (top pays + villes)
- Conversion par entité et programme
- Volume leads/semaine + tendance
- Cycle de conversion (days_to_convert)
- Mobile vs Desktop
- Friction formulaire (collapsible)

---

## Vue 4 : Budget (Finance)

**Question** : "On dépense bien ?"
**Fréquence** : mensuelle

### KPIs CODIR financier

| # | KPI | Statut |
|---|-----|--------|
| B.1 | CA brut campagne | ❌ SI Finance |
| B.2 | CA net (brut − bourses − remises) | ❌ SI Finance |
| B.3 | Taux de recouvrement | ❌ SI Finance |
| B.4 | Encours impayés par tranche | ❌ SI Finance |
| B.5 | Manque à gagner places vides | ⚠️ Calculable |
| B.6 | LTV/CAC ratio | ✅ |
| B.7 | Marge contribution par entité | ❌ Comptabilité analytique |
| B.8 | Projection CA fin d'année | ⚠️ Partiel |

### Bloc B.2 — Opérationnel financier

| # | Métrique | Source |
|---|----------|--------|
| B.2.1 | Valeur pipeline par entité | CRM + modèle |
| B.2.2 | CPA par entité × filière × canal × pays | Multi-dimensionnel |
| B.2.3 | Budget engagé vs plan par canal | Comptabilité + plan |
| B.2.4 | Efficience marginale par canal | Modèle courbe rendement |
| B.2.5 | Scénarios what-if | Modèle paramétrique |

### Existant conservé

- Spend total + projection
- P&L cohorte
- LTV vs CAC + ROAS + Payback
- Répartition spend par canal
- Évolution spend mensuel
- Table détaillée par canal

---

## Vue 5 : Marque & Communication (NOUVELLE)

**Question** : "On est visible et crédible ?"
**Fréquence** : hebdo

### KPIs CODIR marque

| # | KPI | Source |
|---|-----|--------|
| C.1 | Contribution comm au pipeline | CRM attribution |
| C.2 | Reach total (paid + organic) | Plateformes sociales + Ads |
| C.3 | Sentiment de marque | Veille + NLP |
| C.4 | Retombées presse | Veille média |
| C.5 | Taux engagement communauté | Plateformes sociales |
| C.6 | Événements réalisés vs plan | SharePoint Events |

### Bloc 7 — Réseaux sociaux

| # | Métrique | Source |
|---|----------|--------|
| 7.1 | Posts publiés vs planifiés | Outil planification |
| 7.2 | Reach par post | APIs sociales |
| 7.3 | Taux engagement par post | APIs sociales |
| 7.4 | Top posts | APIs sociales |
| 7.5 | Performance par type contenu | APIs sociales |
| 7.6 | Performance par page (multi-pages UM6SS) | APIs sociales |
| 7.7 | Croissance nette followers | APIs sociales |
| 7.8 | Mentions et tags | Veille sociale |
| 7.9 | Commentaires négatifs | Veille / NLP |

### Bloc 8 — Site web + SEO

| # | Métrique | Source |
|---|----------|--------|
| 8.1 | Trafic site institutionnel | GA4 |
| 8.2 | Trafic landing pages recrutement | GA4 |
| 8.3 | Taux conversion LP | GA4 / GTM |
| 8.4 | Positionnement SEO (top requêtes) | Search Console |
| 8.5 | Trafic organique total | GA4 + Search Console |
| 8.6 | Requêtes marque vs génériques | Search Console |

### Bloc 9 — Relations presse

| # | Métrique | Source |
|---|----------|--------|
| 9.1 | Communiqués diffusés | SharePoint |
| 9.2 | Taux de reprise | Veille média |
| 9.3 | Couverture par type de média | Veille média |
| 9.4 | Interventions médiatiques | Saisie manuelle |
| 9.5 | Retombées liées aux événements | Veille + calendrier |

### Bloc 10 — Événements institutionnels

| # | Métrique | Source |
|---|----------|--------|
| 10.1 | Événements réalisés vs planifiés | SharePoint Events |
| 10.2 | Participation par événement | Système inscription |
| 10.3 | Taux de présence | Pointage |
| 10.4 | Coût par événement | Comptabilité |
| 10.5 | Satisfaction participants | Formulaire post-event |
