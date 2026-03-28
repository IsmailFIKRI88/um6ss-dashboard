# Agent 14 — UX Researcher : User Journeys & Priorites Sections

## User Journeys par profil

### DG (Vue Strategie)
Ouvre le dashboard 1-2x/semaine. Veut en 30 secondes : "on est a X% de l'objectif, Y alertes".
Frustration actuelle : doit scroller pour trouver le remplissage, les panels config polluent la vue.
Journey ideal : KPI remplissage en hero -> alertes -> tendance -> detail si besoin.

### Marketing (Vue Acquisition)
Usage quotidien, 10-15 min. Cherche : quel canal performe, ou reallouer le budget.
Frustration : pas de drill-down canal -> campagne -> crea fluide, ESOV absent de cette vue.
Journey ideal : CPL par canal en haut -> clic pour drill-down -> pacing budget en contexte.

### Admissions (Vue Qualite Leads)
Usage quotidien. Question : "combien de leads chauds a traiter aujourd'hui ?"
Frustration : les buckets froids sont affiches en premier, les chauds sont noyes.
Journey ideal : "Chauds en attente" en premier -> repartition buckets -> conversion par canal.

### CFO (Vue Budget)
Usage hebdomadaire. Question : "on depense bien ? c'est rentable ?"
Frustration : P&L et ROAS/CAC dupliques avec d'autres vues, manque de contexte temporel.
Journey ideal : spend vs budget -> cout/inscrit -> P&L -> projection fin campagne.

## Matrice d'importance des sections par vue

| Section | Strategie | Acquisition | Qualite | Budget |
|---------|-----------|-------------|---------|--------|
| Remplissage objectifs | CRITIQUE | moyen | moyen | moyen |
| Alertes | CRITIQUE | haut | haut | moyen |
| CPL par canal | bas | CRITIQUE | moyen | haut |
| Drill-down crea | - | CRITIQUE | - | moyen |
| Buckets scoring | moyen | moyen | CRITIQUE | - |
| Leads chauds en attente | moyen | moyen | CRITIQUE | - |
| Spend vs budget | moyen | haut | - | CRITIQUE |
| P&L campagne | bas | moyen | - | CRITIQUE |
| ESOV / part de voix | moyen | haut | - | moyen |
| Panels config | bas | bas | bas | bas |

## Recommandations prioritaires

1. **Panels config -> onglet Parametres** : les panels de configuration (API, financial settings,
   Fermi) encombrent les vues metier. Les deplacer dans un onglet dedie "Parametres" accessible
   depuis la navigation principale. Gain : chaque vue ne montre que du contenu actionnable.

2. **Remplissage en hero de Strategie** : la jauge de remplissage (leads vs objectif) doit etre
   le premier element visible, en grand, avec le % et la tendance. C'est LA reponse a la question
   du DG. Actuellement noyee dans le flux de sections.

3. **ESOV dans Acquisition** : le share of voice est une metrique marketing, pas strategie.
   Le deplacer dans Acquisition ou il sera actionnable (ajuster le budget par canal).

4. **"Chauds en attente" en premier dans QualiteLeads** : inverser l'ordre des buckets pour
   mettre les leads chauds/tres chauds en haut. Les admissions veulent agir sur les chauds
   d'abord, pas compter les froids.

5. **Eliminer les doublons cross-vues** : ROAS et CAC apparaissent dans Acquisition ET Budget.
   Chaque metrique doit avoir une "vue maitre" et etre en reference (lien) dans les autres.

## Impact attendu

- Reduction du temps de reponse a la question principale : de ~45s a ~10s par profil
- Reduction du scroll : -40% sur Strategie, -30% sur QualiteLeads
- Elimination de 3 panels de config des vues metier
