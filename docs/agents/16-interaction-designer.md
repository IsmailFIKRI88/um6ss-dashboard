# Agent 16 — Interaction Designer : Audit des 12 elements interactifs

## Audit detaille

### 1. Navigation (CRITIQUE)
- Pas d'etat hover ni focus visible sur les onglets
- Pas de support clavier (Tab/Enter)
- Fix : ajouter outline focus, hover background, role="tablist" + aria-selected

### 2. Date Presets (HAUT)
- Zone cliquable trop petite (texte seul, pas de padding)
- Pas de feedback visuel sur le preset actif
- Fix : boutons avec padding 8px 16px, etat actif avec background contraste

### 3. EntityFilter (HAUT)
- Le dropdown ne se ferme pas au clic exterieur
- Pas de recherche quand >5 entites
- Fix : useClickOutside hook, champ recherche si >5 options, Escape pour fermer

### 4. SettingsPanel (CRITIQUE)
- Discoverability quasi-nulle : icone engrenage sans label, position ambigue
- L'utilisateur ne sait pas que la connexion API se configure ici
- Fix : deplacer vers onglet Parametres dedie (cf. Agent 15), label explicite

### 5. FinancialSettings (HAUT)
- Pas de recherche dans les listes de programmes
- Validation par alert() natif (bloquant, non theme)
- Valeurs par defaut pas expliquees
- Fix : combobox avec recherche, toast notification, tooltips sur les valeurs

### 6. DataTable (MOYEN)
- Pas d'affordance de tri (headers sans indicateur fleche)
- Pas de pagination pour les grands jeux de donnees
- Fix : icones fleche haut/bas sur headers triables, pagination si >20 lignes

### 7. AlertBadge (HAUT)
- Non cliquable — affiche un status mais ne permet pas d'action
- Pas de lien vers la section concernee
- Fix : rendre cliquable avec navigation vers la section/vue pertinente

### 8. KPICard (MOYEN)
- Tooltip natif (title attribute) — lent, non style, tronque
- Pas de tendance visuelle (fleche haut/bas)
- Fix : tooltip custom au hover avec detail, indicateur tendance

### 9. ConditionalSection (BAS)
- Pas de bouton d'action contextuel (ex: "Voir detail", "Exporter")
- Fix : slot pour action secondaire dans le header de section

### 10. Bouton IA "Analyser" (CRITIQUE)
- Absent de l'implementation actuelle alors que prevu dans CLAUDE.md
- Fix : implementer le bouton par section avec etat loading/resultat/dismiss

### 11. Refresh donnees (HAUT)
- Cache dans le SettingsPanel, pas accessible directement
- L'utilisateur ne sait pas quand les donnees ont ete rafraichies
- Fix : bouton refresh visible dans le header + timestamp "Derniere MAJ: il y a 5 min"

### 12. Export CSV (BAS)
- Fonctionne mais pas de feedback visuel pendant l'export
- Fix : loading spinner + toast "Export termine"

## Tableau de priorites

| # | Element | Severite | Effort | Priorite |
|---|---------|----------|--------|----------|
| 1 | Navigation (a11y) | Critique | Faible | P0 |
| 4 | SettingsPanel -> Parametres | Critique | Moyen | P0 |
| 10 | Bouton IA absent | Critique | Moyen | P0 |
| 3 | EntityFilter fermeture | Haut | Faible | P1 |
| 7 | AlertBadge cliquable | Haut | Faible | P1 |
| 11 | Refresh visible | Haut | Faible | P1 |
| 2 | Date presets zone | Haut | Faible | P1 |
| 5 | FinancialSettings UX | Haut | Moyen | P1 |
| 6 | DataTable tri/pagination | Moyen | Moyen | P2 |
| 8 | KPICard tooltip | Moyen | Faible | P2 |
| 9 | ConditionalSection action | Bas | Faible | P3 |
| 12 | Export feedback | Bas | Faible | P3 |

## Estimation globale
- P0 (3 items) : ~3 jours de dev
- P1 (5 items) : ~4 jours de dev
- P2-P3 (4 items) : ~2 jours de dev
