# Agent : Stratège Business — Couverture cycle de vie étudiant

> Session 1 · Mars 2026 · Mission : concevoir les KPIs et vues pour les phases 2-6

## Phase 2 — Admission / Sélection

Question décideur : "Est-ce que notre processus de sélection est efficace et équitable ?"

### 6 KPIs

1. **Taux de convocation** : Leads qualifiés convoqués / Leads qualifiés totaux → Si < 80% : backlog admissions
2. **Taux d'admission** : Admis / Convoqués → Ajuster barème si < cible filière
3. **Délai lead-to-decision** : Médiane(date_decision - date_lead) → Si > 21j : candidat perdu
4. **Taux de présence concours** : Présents / Convoqués → Si < 70% : problème de communication
5. **Sélectivité par filière** : Admis / Candidats par programme
6. **Score moyen des admis vs recalés** : Si pas de différence → scoring à recalibrer

Données sources : DSI académique (export CSV hebdomadaire pendant campagne admission avril-juillet).
Vue proposée : **Nouvelle vue "Admissions"** + extension Qualité Leads.

## Phase 3 — Inscription / Conversion financière

Question : "Combien de revenue réel entre en caisse, et où perd-on des admis ?"

### 7 KPIs

1. **Yield rate** : Inscrits payants / Admis — LE KPI le plus stratégique
2. **No-show rate** : Admis non-inscrits / Admis — Segmenter par raison
3. **Taux de remplissage** : Inscrits / Capacité max → Si < 70% : manque à gagner direct
4. **Revenue réel vs objectif** : Somme frais / Objectif
5. **Délai admission-to-paiement** : Si > 30j : relancer
6. **Marge de contribution par filière** : (Frais - Coût formation) × Inscrits
7. **Désistement post-inscription** : Si > 5% : prévoir sur-admission

## Phase 4 — Scolarité

Question : "Nos étudiants réussissent-ils et sont-ils satisfaits ?"

5 KPIs : Taux de réussite académique, NPS étudiant, Taux de passage, Délai moyen de diplomation, Score satisfaction par dimension. Vue proposée : **Nouvelle vue "Scolarité"**.

## Phase 5 — Rétention

Question : "Combien d'étudiants perd-on chaque année, et combien cela coûte ?"

6 KPIs : Taux de rétention annuel, Churn rate par année d'étude, Revenue à risque, Motif de départ, Churn prédictif, Impact churn réel vs estimé. Vue proposée : **Nouvelle vue "Rétention"**.

## Phase 6 — Alumni

5 KPIs : Taux d'insertion professionnelle, NPS alumni, Taux de recommandation, Contribution contenu, Revenu alumni. Pas de vue dédiée — intégration dans Stratégie, Acquisition, Budget.

## Corrélations cross-phases (par priorité)

- **P0** : Canal acquisition → Yield rate (réallocation budget immédiate)
- **P0** : Score acquisition → Taux admission (validation du scoring)
- **P1** : Canal acquisition → Rétention année 1 (change le vrai ROAS)
- **P1** : NPS étudiant → Churn N+1 (prévention)
- **P1** : Alumni recommandation → Qualité lead (coût d'acquisition zéro)
- **P3** : Canal → Insertion pro (6+ ans de données nécessaires)

## Feuille de route

Couverture passe de ~51% à ~83% du cycle avec 3 nouvelles vues, 29 nouveaux KPIs, ~22j de développement étalés sur 18 mois. Goulot d'étranglement = obtention des données DSI et CFO, pas le développement.
