# Agent 19 — Naive User Test : Test Utilisateur Non-Expert

## Profil du testeur simule
Responsable admissions, 45 ans, a l'aise avec Excel mais pas avec les dashboards web.
Premiere connexion au dashboard, sans formation prealable. Tache : "Combien de leads
chauds avons-nous cette semaine pour la faculte de medecine ?"

## Score global : 3/10

Le dashboard est fonctionnellement riche mais hostile a un utilisateur non-initie.
Il ressemble a un outil de growth marketer, pas a un outil pour decideurs universitaires.

## Les 10 moments de frustration

### 1. Mur de connexion (BLOQUANT)
Premier ecran : un formulaire API URL + cle API. L'utilisateur ne sait pas ce que c'est,
ni ou trouver les valeurs. Abandon immediat pour ~60% des utilisateurs non-techniques.
**Fix** : preconfigurer l'URL par defaut, masquer derriere Parametres, onboarding guide.

### 2. KPIs sans contexte (CRITIQUE)
Les KPICards affichent "CPL: 127 MAD" sans dire si c'est bien ou mal. Aucun benchmark,
aucune comparaison temporelle visible, aucune fleche de tendance.
**Fix** : ajouter tendance (fleche + %), seuils colores, comparaison periode precedente.

### 3. Acronymes non expliques (CRITIQUE)
CPL, CAC, ROAS, LTV, ESOV, CTR — l'utilisateur ne connait pas ces termes.
Aucun glossaire, aucun tooltip explicatif.
**Fix** : tooltips sur chaque acronyme, glossaire accessible depuis le header.

### 4. Filtre entite introuvable (HAUT)
L'utilisateur cherche a filtrer par "Faculte de medecine" mais ne trouve pas le filtre.
Il est dans le header, sans label explicite, ressemble a un element decoratif.
**Fix** : label "Filtrer par entite", position proeminente, etat actif visible.

### 5. Panels config = usine a gaz (HAUT)
Les panels de configuration (API, financial, Fermi) sont affiches dans les vues metier.
L'utilisateur pense que c'est du contenu a lire, pas des parametres a configurer.
**Fix** : deplacer dans onglet Parametres dedie (cf. Agents 14-15).

### 6. Estimations Fermi intimidantes (MOYEN)
Le panel Fermi demande des intervalles de confiance et des estimations TAM/SAM/SOM.
Un responsable admissions ne sait pas ce que c'est et ne devrait pas avoir a le remplir.
**Fix** : cacher Fermi par defaut, le rendre accessible uniquement aux profils Marketing/DG.

### 7. Fraicheur des donnees invisible (HAUT)
L'utilisateur ne sait pas si les donnees sont d'aujourd'hui, d'hier ou de la semaine derniere.
Pas de timestamp "Derniere mise a jour", pas d'indicateur de chargement.
**Fix** : timestamp visible dans le header, indicateur de fraicheur colore.

### 8. Alertes sans action (MOYEN)
Les AlertBadges signalent des problemes mais ne proposent aucune action.
"Data quality: Warning" — que dois-je faire ? Ou cliquer ?
**Fix** : rendre les alertes cliquables, lier a une action ou une explication.

### 9. Aucun onboarding (CRITIQUE)
Pas de tour guide, pas de page d'accueil, pas d'aide contextuelle.
L'utilisateur est lache dans un dashboard complexe sans repere.
**Fix** : tour guide au premier lancement (3-4 etapes), aide "?" par section.

### 10. Langue mixte francais/anglais (MOYEN)
Les labels melangent francais ("Remplissage") et anglais ("ROAS", "Payback", "Pacing").
Desorientant pour un utilisateur francophone non-technique.
**Fix** : tout en francais, acronymes anglais en tooltip seulement.

## Verdict

> "C'est un outil marketing deguise en outil academique."

Le dashboard a ete concu par et pour des growth marketers. Les 3 autres profils
(DG, Admissions, Finance) sont des utilisateurs secondaires dans l'experience actuelle,
alors qu'ils sont les decideurs principaux.

## Recommandations prioritaires

1. **Onboarding first-run** : 4 etapes, 30 secondes, skippable
2. **Preconfigurer l'API** : eliminer le mur de connexion
3. **Tooltips partout** : acronymes, KPIs, seuils
4. **Timestamp fraicheur** : visible, colore, dans le header
5. **Vocabulaire francais** : harmoniser, acronymes en tooltip
