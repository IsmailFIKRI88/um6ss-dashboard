# UM6SS Dashboard — Campagne Acquisition 2026-2027

**Version 1.1.0** · Mars 2026 · Document confidentiel — Usage interne

Dashboard de pilotage de la campagne de recrutement digital UM6SS. 4 vues, 20+ KPIs, données temps réel depuis WordPress + plateformes publicitaires (Meta, Google, LinkedIn, TikTok).

---

## Sommaire

1. [À qui sert ce dashboard](#1-à-qui-sert-ce-dashboard)
2. [Les 4 vues](#2-les-4-vues)
3. [Guide par profil](#3-guide-par-profil)
4. [Dictionnaire des métriques](#4-dictionnaire-des-métriques)
5. [Limites et honnêteté des données](#5-limites-et-honnêteté-des-données)
6. [Architecture technique](#6-architecture-technique)
7. [Installation](#7-installation)
8. [Maintenance](#8-maintenance)

---

## Changelog

### v1.1.0 (Mars 2026) — Revue critique et corrections

Revue systématique de chaque composant, module de processing, et vue. 15 corrections appliquées, orientées honnêteté des données et suppression du superflu.

**Retiré (8) :**
- Clipboard copy sur KPICard — gadget sans usage réel. Un export CSV ou un screenshot est plus adapté.
- onClick sur AlertBadge — feature documentée mais jamais câblée. Les alertes sont des indicateurs statiques.
- ChannelTableWpOnly (vue Argent) — fallback qui faisait doublon avec la vue Situation. La vue Argent est désormais masquée de la navigation quand aucune donnée ads n'est synchronisée.
- Fallback channel_group → platform dans la réconciliation — produisait des faux positifs (tous les leads "Paid Social" attribués à Meta, même si LinkedIn est aussi du paid social). Le matching se fait maintenant uniquement par click IDs (gclid/fbclid/ttclid/li_fat_id) et utm_campaign.
- Taux de conversion 12% par défaut dans la projection — donnée inventée qui produisait une projection d'inscrits faussement précise. La projection d'inscrits ne s'affiche que si le taux est calculable à partir de données outcomes réelles.
- Score numérique 0-100 dans dataQuality — les penalty points et plafonds étaient arbitraires, le chiffre donnait une fausse impression de précision. Remplacé par 3 niveaux (OK / Vérifier / Problème).
- CampaignProgressBar du header global — information statique qui ne change pas d'un jour à l'autre. Déplacée dans la vue Situation uniquement.
- Séparateur point-virgule dans l'export CSV — non-standard, incompatible avec Google Sheets et Excel anglais. Remplacé par virgule (standard international).

**Corrigé (5) :**
- Vue Argent conditionnelle — masquée de la navigation quand `ads.available === false`. Si l'utilisateur est sur Argent et que les données disparaissent, fallback automatique sur Situation.
- Mode Direction gardé — les KPIs financiers (ROAS, payback, revenue) ne s'affichent que si au moins un inscrit existe dans les outcomes DSI. Sans outcomes, un message explicite remplace les KPIs vides.
- Projection inscrits gardée — n'apparaît que si `hasRealConvRate === true` (leads > 50 et enrolled > 0). Sinon, seule la projection de leads s'affiche avec un message "pas assez de données outcomes".
- Attribution first-touch disclaimer — un avertissement visible apparaît quand le toggle est en first-touch : "Le spend reste lié aux campagnes last-touch — les CPL en first-touch ne sont pas comparables directement."
- Financials hardcodé — le `avgAnnualFees: 65000` n'est plus utilisé pour afficher un ROAS quand il n'y a pas d'inscrits. Le calcul ne se fait que si les outcomes existent.

**Ajouté (4) :**
- CampaignProgressBar dans la vue Situation (déplacée du header).
- Disclaimer "heuristique à valider avec les données d'inscription" sur le scatter engagement.
- Cap 300 points sur le scatter avec indication du total réel quand > 300 leads.
- Section "Limites et honnêteté des données" dans le README (section 5).

**Fichiers modifiés (8) :** Dashboard.jsx, components/ui/index.jsx, components/layout/index.jsx, views/Situation.jsx, views/Argent.jsx, views/Qualite.jsx, processing/reconciliation.js, processing/dataQuality.js, processing/projection.js, utils/csvExport.js.

### v1.0.0 (Mars 2026) — Version initiale

Projet React/Vite complet connecté à l'API REST WordPress (11 endpoints) avec 4 vues, 10 modules de processing, 17 composants UI. Consomme les données leads WordPress + données ad spend synchronisées depuis Meta, Google, LinkedIn et TikTok.

---

## 1. À qui sert ce dashboard

**Head of Growth** — routine quotidienne, optimisation canaux, diagnostic formulaire, priorisation leads.

**CFO / Directoire** — rentabilité de l'investissement, projection remplissage septembre, ROAS, payback. Les KPIs financiers ne s'affichent que quand les données d'inscription sont importées — pas de chiffres vides.

**Data Scientist / Analyste** — architecture des données, modèles d'attribution, modules de processing testables, fiabilité des sources.

---

## 2. Les 4 vues

**⚡ Situation** — Morning briefing avec toggle Pilotage/Direction. Mode Pilotage : alertes, 5 KPI ops, funnel 8 étapes, sparkline 30j, barre de progression campagne. Mode Direction : KPIs financiers (ROAS, payback, revenue projeté) quand les outcomes DSI existent, projection leads septembre, remplissage par entité. Si aucune inscription n'est encore importée, le mode Direction affiche un message clair au lieu de tirets.

**💰 Argent** — Visible uniquement quand des données publicitaires sont synchronisées. Table de vérité réconciliée (12 colonnes triables, export CSV), toggle attribution last-touch/first-touch avec avertissement que le spend n'est pas redistribué en first-touch, drill-down par campagne (creatives + breakdowns démographiques), burn rate cumulé avec projection.

**⭐ Qualité** — Scatter quadrant score × engagement (limité à 300 points pour la lisibilité, avec disclaimer "heuristique à valider"), cycle de conversion (histogramme days_to_convert), comparaison mobile/desktop compacte, waterfall friction formulaire en panneau pliable (fermé par défaut). Alertes conditionnelles : gap mobile/desktop > 15 pts, leads chauds en attente (compteur KPI, pas de liste nominative).

**🏥 Entités** — Filtres par faculté, tableau entités, heatmap programmes (taille=leads, couleur=score). Heatmap efficace après filtrage par entité (~15 programmes). Drill-down programme : détail par campus, A/B tests actifs.

---

## 3. Guide par profil

### 3.1. Head of Growth

**Routine quotidienne :** Vue Situation mode Pilotage. Les alertes (CPL, score, bots) sont le premier signal. Le sparkline 30j montre la tendance. Si un creux apparaît, creuser dans la vue Argent.

**Optimisation canaux :** Vue Argent, trier par "CPL Qualifié". C'est la métrique qui compte — elle divise le spend par les leads score ≥ 60, pas par ce que la plateforme revendique. Le phantom gap par campagne montre si les chiffres plateforme sont fiables. Au-dessus de 25%, investiguer.

**Attribution :** Le toggle First-Touch redistribue les leads au canal de découverte. Utile pour argumenter qu'un canal d'awareness (Meta) nourrit le pipeline même si son last-click CPL semble mauvais. Attention : le spend reste sur le last-touch, les CPL en first-touch ne sont pas directement comparables.

**Creatives :** Cliquer sur une campagne. Le drill-down montre chaque creative avec ses métriques plateforme ET les leads WordPress associés. Une creative à CTR élevé mais score moyen faible attire du clic curieux, pas du prospect.

**Formulaire :** Vue Qualité, ouvrir le panneau "Friction Formulaire". Le waterfall montre le temps médian par champ. Si un champ a un temps anormalement élevé, l'UX est à corriger — actionnable sans budget ads.

**Métriques quotidiennes :** CPL Qualifié, score moyen, leads/jour, phantom gap des campagnes principales.

### 3.2. CFO / Directoire

**En 30 secondes :** Vue Situation, toggle Direction. Les KPIs financiers apparaissent uniquement quand des inscriptions sont importées depuis la DSI. Sans outcomes, la vue affiche les leads/spend/score avec un message expliquant comment activer les métriques financières.

**Avec outcomes :** Coût Total Campagne (media + fixes), Revenue Projeté (inscrits × LTV), ROAS (revenue ÷ coût), Payback (mois avant ROI). La projection septembre montre les leads projetés. La projection d'inscrits n'apparaît que si le taux de conversion est calculable à partir de données réelles — pas d'estimation par défaut qui donnerait un faux sentiment de précision.

**Remplissage :** Entités classées avec leads, qualifiés, inscrits. Drill-down via vue Entités.

**Pour vos réunions :** ROAS, payback, remplissage par entité, projection leads, coût total vs revenue.

### 3.3. Data Scientist

**Sources :** WordPress REST API (10 endpoints, 85 colonnes/lead) + Ad Spend (4 endpoints, schéma unifié, sync cron 6h avec lookback 7j).

**10 modules de processing** dans `src/processing/`, chacun un fichier JS pur sans dépendance UI, testable unitairement :

`reconciliation.js` — Jointure sur click IDs (gclid/fbclid/ttclid/li_fat_id) puis utm_campaign → campaign_name. Pas de fallback channel_group → platform (retiré : trop de faux positifs). Bucket "non-attributable" pour organic/direct.

`funnel.js` — 8 étapes. Les étapes "Form Starts" et "Contactés" peuvent être des estimations selon la disponibilité des données — le champ `source` distingue 'ads' vs 'wp'.

`attribution.js` — Matrice first-touch × last-touch. La fonction `reattribute()` redistribue les leads mais pas le spend — limitation documentée dans l'UI avec un avertissement.

`engagement.js` — Composite 0-100 avec pondérations arbitraires (attention 30%, scroll 25%, micro-conversions 45%). C'est une heuristique, pas une métrique validée. Si score et engagement sont fortement corrélés (probable), le scatter quadrant deviendra une diagonale — à vérifier avec les vraies données.

`formDiagnostics.js` — Parse `form_field_times` JSON (try/catch, les malformés sont ignorés silencieusement). Le nombre de leads avec un JSON parsable vs non-parsable devrait être tracé — TODO.

`budgetPacing.js` — Projection linéaire (moyenne 14j × jours restants). Honnête et simple.

`financial.js` — Full CAC, LTV, ROAS, payback. Les frais de scolarité (avgAnnualFees) sont un paramètre à terme configurable via wp-admin. En l'état, 65 000 MAD par défaut — pas affiché si aucun inscrit.

`projection.js` — Refuse de projeter les inscrits si le taux de conversion est estimé (pas de données outcomes réelles). Projette uniquement les leads dans ce cas.

`dataQuality.js` — Retourne 3 niveaux (ok/warning/error) au lieu d'un score numérique (0-100 était arbitraire et donnait une fausse précision). Les issues sont listées avec sévérité.

`cohortAnalysis.js` — Module disponible dans le code mais non affiché dans les vues principales (analyse ponctuelle, pas monitoring quotidien).

**Fiabilité ads :** Conversions Meta décomposées par action_type. Google agrège toutes les conversion actions — vérifier la config agence. LinkedIn oneClickLeads = Lead Gen Forms hors WordPress. Lookback 7j pour l'attribution rétroactive.

---

## 4. Dictionnaire des métriques

### Acquisition

| Métrique | Définition |
|----------|-----------|
| Leads Total | Soumissions formulaire (candidature + brochure + exit-intent) |
| Leads Qualifiés | Leads score ≥ 60 |
| Phantom Gap | (Leads Plateforme - Leads WP) / Leads Plateforme × 100. > 25% = problème |

### Coût

| Métrique | Définition |
|----------|-----------|
| CPL Plateforme | Spend ÷ Leads Plateforme — ce que l'agence présente |
| CPL WordPress | Spend ÷ Leads WP réels |
| CPL Qualifié | Spend ÷ Leads WP score ≥ 60 — le vrai coût par lead utile |
| Full CAC | (Spend + Coûts fixes) ÷ Inscrits — coût complet par étudiant |

### Financier (mode Direction — nécessite outcomes DSI)

| Métrique | Définition |
|----------|-----------|
| LTV | Frais annuels × Durée programme |
| ROAS | (Inscrits × LTV) ÷ Full Cost |
| Payback | Full CAC ÷ Revenue mensuel par étudiant |

### Qualité

| Métrique | Définition | Note |
|----------|-----------|------|
| Engagement | Composite 0-100 : attention + scroll + micro-conv | Heuristique — pondérations non validées |
| Délai 1er Contact | outcome_updated_at - created_at | Nécessite outcomes DSI |
| Data Quality | 3 niveaux : OK / Vérifier / Problème | Basé sur champs manquants, bots, doublons, fraîcheur |

---

## 5. Limites et honnêteté des données

**Ce qui est fiable :** le nombre de leads WordPress (source de vérité), le score comportemental (calculé côté PHP avec des signaux objectifs), le spend par plateforme (APIs officielles), le phantom gap (différence factuelle entre deux sources).

**Ce qui est une heuristique :** le score d'engagement (composite avec pondérations arbitraires — à valider avec les outcomes), les quadrants du scatter (dépendent de la corrélation score/engagement qui n'est pas mesurée).

**Ce qui est conditionnel :** les KPIs financiers (ROAS, payback, LTV/CAC) n'apparaissent que si des inscriptions réelles sont importées. La projection d'inscrits n'apparaît que si le taux de conversion est calculable à partir de données réelles, pas d'estimation par défaut.

**Ce qui n'est pas redistribué :** en mode first-touch, les leads sont réattribués au canal de découverte mais le spend reste sur le last-touch. Les CPL en first-touch sont informatifs, pas comparatifs.

**Ce qui peut créer de la confusion :** le phantom gap LinkedIn sera structurellement élevé si l'agence utilise des Lead Gen Forms natifs (ils ne transitent pas par WordPress). Les conversions Google Ads agrègent toutes les conversion actions — si le download brochure est configuré comme conversion, le gap sera surévalué.

---

## 6. Architecture technique

```
Plateformes Ads ──→ Cron PHP (6h) ──→ MySQL (3 tables)
                                            │
WordPress BDD (5 tables) ──────────────────┤
                                            │
                                    REST API (11 endpoints)
                                    Auth: X-UM6SS-API-Key
                                            │
                                    Dashboard React (Vite)
                                    Config → Data → Processing → Views
```

27 fichiers · 2 390 lignes · 10 modules processing · 4 vues (Argent conditionnelle)

### Principes de design

**Dashboard, pas CRM.** Montre des métriques et des tendances pour informer des décisions. Ne gère pas de workflows, ne distribue pas de tâches, ne fait pas de file d'attente.

**Dégradation gracieuse.** Sans ads : Situation, Qualité et Entités fonctionnent. Argent est masquée. Sans outcomes DSI : les KPIs financiers ne sont pas affichés. Sans form_field_times : le waterfall est vide avec un message explicite.

**Honnêteté des données.** Les heuristiques sont labellisées comme telles. Les projections sans données suffisantes ne sont pas affichées. Les limites du matching d'attribution sont documentées dans l'UI.

---

## 7. Installation

### Prérequis

- Node.js ≥ 18
- Thème lp-template v2.11.0+ (inc/ad-spend-sync.php)
- Plugin um6ss-rest-api v1.1.0+ (endpoints-ad-spend.php)
- wp-config.php : `define('UM6SS_REST_API_KEY', '...');`

### Démarrage

```bash
unzip um6ss-dashboard-v1.1.0.zip && cd um6ss-dashboard
npm install
npm run dev
```

Ouvrir http://localhost:5173, renseigner URL et clé API.

### Build production

```bash
npm run build
```

Déployer dist/ sur un sous-domaine ou dans le thème WordPress.

---

## 8. Maintenance

### Paramètres (src/config/defaults.js)

| Paramètre | Défaut | Effet |
|-----------|--------|-------|
| QUALIFIED_SCORE_MIN | 60 | Seuil lead qualifié |
| cpl_qualifie_max | 500 MAD | Seuil alerte CPL |
| Campaign timeline | Dec 2025 → Aug 2026 | Progression et projections |

### Roadmap v2

- Fenêtre d'attribution configurable (7/14/30j)
- Projection saisonnière (courbe Y1)
- Frais de scolarité par programme depuis wp-admin (remplace le 65 000 MAD hardcodé)
- Export PDF one-pager direction
- Validation engagement vs outcomes (corrélation score/engagement → ajustement pondérations)
- Compteur form_field_times parsable vs non-parsable dans data quality
- Comparaison Y/Y automatique en Y2

---

Département Communication Stratégique, Institutionnelle et Digitale · UM6SS
