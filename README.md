# UM6SS Dashboard — Campagne Acquisition 2026-2027

**Mars 2026**

Dashboard de pilotage de la campagne de recrutement digital UM6SS. 4 vues par role deciseur, 20+ KPIs, donnees temps reel depuis WordPress + plateformes publicitaires (Meta, Google, LinkedIn, TikTok), modele Fermi TAM/SAM/SOM integre.

---

## Sommaire

1. [A qui sert ce dashboard](#1-a-qui-sert-ce-dashboard)
2. [Les 4 vues](#2-les-4-vues)
3. [Guide par profil](#3-guide-par-profil)
4. [Dictionnaire des metriques](#4-dictionnaire-des-metriques)
5. [Limites et honnetete des donnees](#5-limites-et-honnetete-des-donnees)
6. [Architecture technique](#6-architecture-technique)
7. [Installation](#7-installation)
8. [Maintenance](#8-maintenance)

---

## Changelog

### Mars 2026 — Fermi market sizing

Modele Fermi TAM/SAM/SOM integre dans la vue Strategie. Estimation de la taille du marche avec propagation d'incertitude (fourchettes low/base/high). Composants : `computeMarketSizing()` et `computeSOVMetrics()` dans `processing/marketSizing.js`, `MarketFunnel` (visualisation entonnoir) dans `components/charts/MarketFunnel.jsx`, `MarketSizingPanel` (parametres configurables) dans `components/MarketSizingPanel.jsx`. Metriques SOV et ESOV pour evaluer la pression publicitaire relative. Scenarios budget (conservateur / base / agressif).

### Mars 2026 — Phase A foundations

Pattern `dataLayers` pour activation conditionnelle des sections selon la disponibilite des donnees. Hook `useOutcomesData` avec fallback JSON statique (`public/data/outcomes-sample.json`). Hook `useStaticData` generique pour charger les fichiers JSON depuis `public/data/`. Composant `ConditionalSection` pour afficher un etat vide explicite quand une source de donnees est absente. Guards financiers : les KPIs renvoient `null` (pas `0`) quand les outcomes ne sont pas disponibles. `config/programs.js` etendu avec parametres financiers par programme (frais, duree, capacite).

### Mars 2026 — Bug fixes + tests

Correction du matching dans `reconciliation.js` : priorite a `utm_campaign` avant le fallback sur click IDs. 105 tests Vitest couvrant les 11 modules de processing, les hooks de donnees et la configuration programmes. Tests dans `src/processing/__tests__/` et `src/data/__tests__/`.

### v1.1.0 (Mars 2026) — Revue critique et corrections

Revue systematique de chaque composant, module de processing, et vue. 15 corrections appliquees, orientees honnetete des donnees et suppression du superflu.

**Retire (8) :**
- Clipboard copy sur KPICard — gadget sans usage reel. Un export CSV ou un screenshot est plus adapte.
- onClick sur AlertBadge — feature documentee mais jamais cablee. Les alertes sont des indicateurs statiques.
- ChannelTableWpOnly (vue Argent) — fallback qui faisait doublon avec la vue Situation. La vue Budget est desormais conditionnelle quand aucune donnee ads n'est synchronisee.
- Fallback channel_group vers platform dans la reconciliation — produisait des faux positifs (tous les leads "Paid Social" attribues a Meta, meme si LinkedIn est aussi du paid social). Le matching se fait maintenant uniquement par click IDs (gclid/fbclid/ttclid/li_fat_id) et utm_campaign.
- Taux de conversion 12% par defaut dans la projection — donnee inventee qui produisait une projection d'inscrits faussement precise. La projection d'inscrits ne s'affiche que si le taux est calculable a partir de donnees outcomes reelles.
- Score numerique 0-100 dans dataQuality — les penalty points et plafonds etaient arbitraires, le chiffre donnait une fausse impression de precision. Remplace par 3 niveaux (OK / Verifier / Probleme).
- CampaignProgressBar du header global — information statique qui ne change pas d'un jour a l'autre. Deplacee dans la vue Strategie uniquement.
- Separateur point-virgule dans l'export CSV — non-standard, incompatible avec Google Sheets et Excel anglais. Remplace par virgule (standard international).

**Corrige (5) :**
- Vue Budget conditionnelle — masquee de la navigation quand `ads.available === false`. Fallback automatique sur Strategie.
- Mode Direction garde — les KPIs financiers (ROAS, payback, revenue) ne s'affichent que si au moins un inscrit existe dans les outcomes DSI. Sans outcomes, un message explicite remplace les KPIs vides.
- Projection inscrits gardee — n'apparait que si `hasRealConvRate === true` (leads > 50 et enrolled > 0). Sinon, seule la projection de leads s'affiche avec un message "pas assez de donnees outcomes".
- Attribution first-touch disclaimer — un avertissement visible apparait quand le toggle est en first-touch : "Le spend reste lie aux campagnes last-touch — les CPL en first-touch ne sont pas comparables directement."
- Financials hardcode — le `avgAnnualFees: 65000` n'est plus utilise pour afficher un ROAS quand il n'y a pas d'inscrits. Le calcul ne se fait que si les outcomes existent.

**Ajoute (4) :**
- CampaignProgressBar dans la vue Strategie (deplacee du header).
- Disclaimer "heuristique a valider avec les donnees d'inscription" sur le scatter engagement.
- Cap 300 points sur le scatter avec indication du total reel quand > 300 leads.
- Section "Limites et honnetete des donnees" dans le README (section 5).

### v1.0.0 (Mars 2026) — Version initiale

Projet React/Vite complet connecte a l'API REST WordPress (11 endpoints) avec 4 vues, 10 modules de processing, 17 composants UI. Consomme les donnees leads WordPress + donnees ad spend synchronisees depuis Meta, Google, LinkedIn et TikTok.

---

## 1. A qui sert ce dashboard

**Direction generale / Directoire** — vision strategique, projection remplissage septembre, dimensionnement marche (Fermi TAM/SAM/SOM), alertes campagne. Vue Strategie.

**Head of Growth / Marketing** — routine quotidienne, optimisation canaux, drill-down cout, diagnostic formulaire, attribution, burn rate. Vue Acquisition.

**Responsable Admissions** — qualite des leads recus, scoring buckets, conversion par canal et entite, leads chauds en attente, delai de contact. Vue Qualite Leads.

**CFO / Finance** — rentabilite de l'investissement, spend vs budget, P&L cohorte, LTV vs CAC, cout par canal. Modele Fermi pour estimer le headroom et le retour sur investissement publicitaire. Vue Budget.

**Data Scientist / Analyste** — architecture des donnees, modeles d'attribution, modules de processing testables (105 tests), fiabilite des sources.

---

## 2. Les 4 vues

**⚡ Strategie** — Vue pour la direction generale. Objectifs d'inscription, alertes conditionnelles, KPIs strategiques (inscrits, cout/inscrit, ROAS, CAC — conditionnes aux outcomes DSI). Projection leads fin campagne. Barre de progression campagne. Remplissage par entite avec capacite et objectif par programme. Modele Fermi TAM/SAM/SOM avec fourchettes d'incertitude : entonnoir marche total vers marche adressable vers part capturable. Metriques SOV (Share of Voice) et ESOV (Excess SOV) pour mesurer la pression publicitaire relative au marche. Panneau de parametres Fermi configurable.

**📈 Acquisition** — Vue pour le marketing et le growth. KPIs globaux par canal (Meta, Google, LinkedIn, TikTok) avec spend, leads, CPL, CPL qualifie. Drill-down canal vers campagne vers creative avec metriques plateforme ET leads WordPress associes. Toggle attribution first-touch / last-touch avec avertissement que le spend n'est pas redistribue. Reconciliation plateforme (click IDs + utm_campaign). Burn rate cumule avec projection. Phantom gap par campagne. Breakdowns demographiques.

**⭐ Qualite Leads** — Vue pour les admissions. Repartition des leads par buckets de scoring (5 niveaux : Tres chaud, Chaud, Tiede-haut, Tiede-bas, Froid). Taux de conversion par canal et par entite. Diagnostic formulaire en waterfall (temps median par champ, panneau pliable). Comparaison mobile/desktop. Cycle de conversion (histogramme days_to_convert). Delai moyen de premier contact. Compteur leads chauds en attente. Alertes conditionnelles : gap mobile/desktop > 15 pts.

**💰 Budget** — Vue pour la finance. Spend total vs budget, repartition par canal, evolution cumulative du spend. P&L cohorte (conditionnel aux outcomes DSI) : revenue cohorte, cout total, marge. LTV vs CAC. Cout par inscrit. Budget pacing avec projection lineaire. Les KPIs financiers ne s'affichent que quand des inscriptions reelles existent — pas de chiffres vides.

---

## 3. Guide par profil

### 3.1. Head of Growth

**Routine quotidienne :** Vue Strategie pour les alertes et la tendance. Si un creux apparait, creuser dans la vue Acquisition.

**Optimisation canaux :** Vue Acquisition, trier par "CPL Qualifie". C'est la metrique qui compte — elle divise le spend par les leads score >= 60, pas par ce que la plateforme revendique. Le phantom gap par campagne montre si les chiffres plateforme sont fiables. Au-dessus de 25%, investiguer.

**Attribution :** Le toggle First-Touch redistribue les leads au canal de decouverte. Utile pour argumenter qu'un canal d'awareness (Meta) nourrit le pipeline meme si son last-click CPL semble mauvais. Attention : le spend reste sur le last-touch, les CPL en first-touch ne sont pas directement comparables.

**Creatives :** Cliquer sur un canal, puis sur une campagne. Le drill-down montre chaque creative avec ses metriques plateforme ET les leads WordPress associes. Une creative a CTR eleve mais score moyen faible attire du clic curieux, pas du prospect.

**Formulaire :** Vue Qualite Leads, ouvrir le panneau "Friction Formulaire". Le waterfall montre le temps median par champ. Si un champ a un temps anormalement eleve, l'UX est a corriger — actionnable sans budget ads.

**Metriques quotidiennes :** CPL Qualifie, score moyen, leads/jour, phantom gap des campagnes principales.

### 3.2. CFO / Directoire

**En 30 secondes :** Vue Strategie. Les KPIs financiers apparaissent uniquement quand des inscriptions sont importees depuis la DSI. Sans outcomes, la vue affiche les leads/spend/score avec un message expliquant comment activer les metriques financieres.

**Avec outcomes :** Cout Total Campagne (media + fixes), Revenue Projete (inscrits x LTV), ROAS (revenue / cout), CAC (cout d'acquisition complet par inscrit). La projection septembre montre les leads projetes. La projection d'inscrits n'apparait que si le taux de conversion est calculable a partir de donnees reelles.

**Dimensionnement marche :** Le modele Fermi dans la vue Strategie estime le TAM (marche total), SAM (marche adressable) et SOM (part capturable) avec des fourchettes d'incertitude. Les metriques SOV/ESOV montrent si le budget publicitaire est sous- ou sur-dimensionne par rapport au marche. Ces estimations sont des modeles, pas des faits — les parametres sont configurables via le panneau dedie.

**Remplissage :** Entites classees avec leads, qualifies, inscrits, capacite et objectif par programme.

**Pour vos reunions :** ROAS, CAC, remplissage par entite, projection leads, cout total vs revenue, headroom SOM.

### 3.3. Data Scientist

**Sources :** WordPress REST API (11 endpoints) + Ad Spend (4 endpoints, schema unifie, sync cron 6h avec lookback 7j). Hook `useOutcomesData` avec fallback JSON statique. Hook `useStaticData` generique.

**11 modules de processing** dans `src/processing/`, chacun un fichier JS pur sans dependance UI, testable unitairement (105 tests Vitest) :

`reconciliation.js` — Jointure sur utm_campaign (prioritaire) puis click IDs (gclid/fbclid/ttclid/li_fat_id). Pas de fallback channel_group vers platform (retire : trop de faux positifs). Bucket "non-attributable" pour organic/direct.

`funnel.js` — 8 etapes. Les etapes "Form Starts" et "Contactes" peuvent etre des estimations selon la disponibilite des donnees — le champ `source` distingue 'ads' vs 'wp'.

`attribution.js` — Matrice first-touch x last-touch. La fonction `reattribute()` redistribue les leads mais pas le spend — limitation documentee dans l'UI avec un avertissement.

`engagement.js` — Composite 0-100 avec ponderations arbitraires (attention 30%, scroll 25%, micro-conversions 45%). C'est une heuristique, pas une metrique validee.

`formDiagnostics.js` — Parse `form_field_times` JSON (try/catch, les malformes sont ignores silencieusement). Le nombre de leads avec un JSON parsable vs non-parsable devrait etre trace — TODO.

`budgetPacing.js` — Projection lineaire (moyenne 14j x jours restants). Honnete et simple.

`financial.js` — Full CAC, LTV, ROAS, payback. Parametres financiers configurables par programme via `FinancialSettingsPanel`. Renvoie `null` quand les outcomes sont absents.

`projection.js` — Refuse de projeter les inscrits si le taux de conversion est estime (pas de donnees outcomes reelles). Projette uniquement les leads dans ce cas.

`dataQuality.js` — Retourne 3 niveaux (ok/warning/error) au lieu d'un score numerique. Les issues sont listees avec severite.

`cohortAnalysis.js` — Module disponible dans le code mais non affiche dans les vues principales (analyse ponctuelle, pas monitoring quotidien).

`marketSizing.js` — Modele Fermi TAM/SAM/SOM avec propagation d'incertitude par intervalle (low x low, base x base, high x high). Calcul SOV, ESOV, et scenarios budget. Coefficient ESOV (0.025) non calibre pour le secteur education.

**Fiabilite ads :** Conversions Meta decomposees par action_type. Google agrege toutes les conversion actions — verifier la config agence. LinkedIn oneClickLeads = Lead Gen Forms hors WordPress. Lookback 7j pour l'attribution retroactive.

---

## 4. Dictionnaire des metriques

### Acquisition

| Metrique | Definition |
|----------|-----------|
| Leads Total | Soumissions formulaire (candidature + brochure + exit-intent) |
| Leads Qualifies | Leads score >= 60 |
| Phantom Gap | (Leads Plateforme - Leads WP) / Leads Plateforme x 100. > 25% = probleme |

### Cout

| Metrique | Definition |
|----------|-----------|
| CPL Plateforme | Spend / Leads Plateforme — ce que l'agence presente |
| CPL WordPress | Spend / Leads WP reels |
| CPL Qualifie | Spend / Leads WP score >= 60 — le vrai cout par lead utile |
| Full CAC | (Spend + Couts fixes) / Inscrits — cout complet par etudiant |

### Financier (necessite outcomes DSI)

| Metrique | Definition |
|----------|-----------|
| LTV | Frais annuels x Duree programme (pondere par programme) |
| ROAS | (Inscrits x LTV) / Full Cost |
| Payback | Full CAC / Revenue mensuel par etudiant |
| Cout / Inscrit | Spend total / Inscrits confirmes |

### Dimensionnement marche (Fermi)

| Metrique | Definition | Note |
|----------|-----------|------|
| TAM | Marche total — population cible (bacheliers sante Maroc + Afrique) | Estimation avec fourchette low/base/high |
| SAM | Marche adressable — TAM x % solvables x % marche prive | Estimation avec fourchette low/base/high |
| SOM | Part capturable — SAM x part de marche UM6SS, plafonnee par la capacite | Estimation avec fourchette low/base/high |
| Taux de penetration SOM | Inscrits reels / SOM base x 100 | Conditionnel aux outcomes |
| Headroom | SOM base - Inscrits reels — places theoriques restantes a capter | Conditionnel aux outcomes |
| SOV (Share of Voice) | Spend UM6SS / Spend total marche estime x 100 | Le spend total marche est une estimation |
| ESOV (Excess SOV) | SOV - SOM — ecart entre part de voix et part de marche | Positif = croissance attendue |

### Qualite

| Metrique | Definition | Note |
|----------|-----------|------|
| Engagement | Composite 0-100 : attention + scroll + micro-conv | Heuristique — ponderations non validees |
| Delai 1er Contact | outcome_updated_at - created_at | Necessite outcomes DSI |
| Data Quality | 3 niveaux : OK / Verifier / Probleme | Base sur champs manquants, bots, doublons, fraicheur |

---

## 5. Limites et honnetete des donnees

**Ce qui est fiable :** le nombre de leads WordPress (source de verite), le score comportemental (calcule cote PHP avec des signaux objectifs), le spend par plateforme (APIs officielles), le phantom gap (difference factuelle entre deux sources).

**Ce qui est une heuristique :** le score d'engagement (composite avec ponderations arbitraires — a valider avec les outcomes), les quadrants du scatter (dependent de la correlation score/engagement qui n'est pas mesuree).

**Ce qui est conditionnel :** les KPIs financiers (ROAS, payback, LTV/CAC) n'apparaissent que si des inscriptions reelles sont importees. La projection d'inscrits n'apparait que si le taux de conversion est calculable a partir de donnees reelles, pas d'estimation par defaut.

**Ce qui n'est pas redistribue :** en mode first-touch, les leads sont reattribues au canal de decouverte mais le spend reste sur le last-touch. Les CPL en first-touch sont informatifs, pas comparatifs.

**Ce qui est un modele, pas un fait :** les estimations Fermi (TAM/SAM/SOM) sont des calculs sur des hypotheses configurables, pas des donnees observees. Elles sont signalees visuellement par une bordure dashed et un badge "~ MODELE". Le coefficient ESOV (0.025) est emprunte au cadre Binet & Field et n'est pas calibre pour le secteur de l'enseignement superieur au Maroc — a valider apres 2 saisons de donnees.

**Ce qui est un exemple :** les fichiers JSON dans `public/data/` (`outcomes-sample.json`, `scolarite-sample.json`, `alumni-sample.json`) sont des donnees d'exemple pour le developpement et la demonstration. Ils ne representent pas des donnees reelles de l'UM6SS.

**Ce qui peut creer de la confusion :** le phantom gap LinkedIn sera structurellement eleve si l'agence utilise des Lead Gen Forms natifs (ils ne transitent pas par WordPress). Les conversions Google Ads agregent toutes les conversion actions — si le download brochure est configure comme conversion, le gap sera surevalue.

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
                              ┌─────────────┴─────────────┐
                              │   Dashboard React (Vite)   │
                              │                            │
                              │  Config ──→ Data ──→ Processing ──→ Views
                              │                            │
                              │  useWordPressData          │
                              │  useAdSpendData            │
                              │  useOutcomesData (live + fallback JSON)
                              │  useStaticData             │
                              │                            │
                              │  11 processing modules     │
                              │  105 tests (Vitest)        │
                              └────────────────────────────┘
```

4 vues actives : Strategie, Acquisition, Qualite Leads, Budget. 11 modules processing. 105 tests.

### Principes de design

**Dashboard, pas CRM.** Montre des metriques et des tendances pour informer des decisions. Ne gere pas de workflows, ne distribue pas de taches, ne fait pas de file d'attente.

**Degradation gracieuse.** Pattern `dataLayers` : chaque source de donnees (ads, outcomes, static) a un flag `available`. Le composant `ConditionalSection` affiche un etat vide explicite et actionnable quand une donnee est absente. Sans ads : Strategie et Qualite Leads fonctionnent. Budget est conditionnelle. Sans outcomes DSI : les KPIs financiers renvoient `null`, pas `0`. Sans form_field_times : le waterfall est vide avec un message explicite.

**Honnetete des donnees.** Les heuristiques sont labelisees comme telles. Les projections sans donnees suffisantes ne sont pas affichees. Les modeles Fermi sont signales visuellement. Les limites du matching d'attribution sont documentees dans l'UI.

Voir `docs/ARCHITECTURE.md` pour le detail complet de l'architecture, les schemas de donnees et les decisions techniques.

---

## 7. Installation

### Prerequis

- Node.js >= 18
- Theme lp-template v2.11.0+ (inc/ad-spend-sync.php)
- Plugin um6ss-rest-api v1.1.0+ (endpoints-ad-spend.php)
- wp-config.php : `define('UM6SS_REST_API_KEY', '...');`

### Demarrage

```bash
git clone https://github.com/votre-org/um6ss-dashboard.git
cd um6ss-dashboard
npm install
npm test
npm run dev
```

Ouvrir http://localhost:5173, renseigner URL et cle API dans le panneau Settings.

### Build production

```bash
npm run build
```

Deploye automatiquement via GitHub Actions sur push `main` (pipeline : `npm test` puis `npm run build` puis deploiement GitHub Pages).

---

## 8. Maintenance

### Parametres (src/config/defaults.js)

| Parametre | Defaut | Effet |
|-----------|--------|-------|
| QUALIFIED_SCORE_MIN | 60 | Seuil lead qualifie |
| cpl_qualifie_max | 500 MAD | Seuil alerte CPL |
| Campaign timeline | Dec 2025 → Aug 2026 | Progression et projections |

### Parametres Fermi (src/config/marketSizing.js)

| Parametre | Defaut | Description |
|-----------|--------|-------------|
| targetPopulation | 55 000 | Bacheliers sciences Maroc + Afrique visant sante |
| pctSolvable | 24% | Capacite a payer >= 65K MAD/an |
| pctPrivateMarket | 45% | Preferent ou n'ont pas acces au public |
| marketSharePct | 35% | Part de marche cible UM6SS |
| capacityMax | 2 500 | Capacite physique max (places/an) |
| totalMarketSpend | 5 000 000 MAD | Spend total marche estime (toutes ecoles privees sante) |

Chaque parametre a une fourchette low/high configurable via le panneau MarketSizingPanel.

### Roadmap

**Phase B — Donnees reelles :**
- Connexion outcomes DSI en production (endpoint `/outcomes-extended`)
- Frais de scolarite par programme depuis wp-admin (remplace les defaults)
- Calibration du coefficient ESOV avec les donnees de la premiere saison

**Phase C — Intelligence :**
- Fenetre d'attribution configurable (7/14/30j)
- Projection saisonniere (courbe Y1 pour modeliser les pics bac/resultats)
- Validation engagement vs outcomes (correlation score/engagement vers ajustement ponderations)

**Phase D — Reporting :**
- Export PDF one-pager direction
- Compteur form_field_times parsable vs non-parsable dans data quality
- Comparaison Y/Y automatique en Y2

**Phase E — Consolidation :**
- Migration vers un data hub centralise (WordPress ne doit plus etre la source de verite)
- Tests end-to-end sur les vues
- Securisation API : proxy backend pour les tokens (pas de secrets cote client)

---

Departement Communication Strategique, Institutionnelle et Digitale · UM6SS
