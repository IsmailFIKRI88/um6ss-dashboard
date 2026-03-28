# Agent 17 — Visual Auditor : Audit Visuel & Corrections CSS

## Problemes critiques (3)

### 1. #6B85A8 hardcode — invisible en theme funky
Le gris-bleu `#6B85A8` est utilise en dur dans plusieurs composants (labels, bordures)
au lieu de passer par `COLORS` du theme. En theme funky (fond sombre), ce texte devient
illisible (ratio contraste < 2:1). Tous les usages doivent etre remplaces par
`COLORS.text.secondary` ou `COLORS.text.muted`.

**Fichiers concernes** : composants dans `views/`, `components/ui/index.jsx`

### 2. CampaignProgressBar invisible en theme clair
La barre de progression utilise une couleur de fond proche du blanc du theme clair.
Le fill et le track ont un contraste insuffisant. La barre semble absente.
Fix : utiliser `COLORS.primary` pour le fill, `COLORS.background.secondary` pour le track.

### 3. Couleur seule pour les status dots
Les points de statut (data quality, alertes) utilisent uniquement la couleur pour
differencier OK/Warning/Error. Inaccessible pour les daltoniens (~8% des hommes).
Fix : ajouter une icone ou un pattern en complement (check/triangle/croix).

## Problemes moyens (5)

### 4. 13 valeurs fontSize differentes
Le code utilise 13 tailles de police differentes (10px a 28px) sans echelle coherente.
Recommandation : definir une echelle dans theme.js (12, 14, 16, 20, 24, 32) et s'y tenir.

### 5. Labels P&L inconsistants
Dans la vue Budget, les labels du P&L melangent francais et anglais
("Revenus" vs "ROAS" vs "Payback"). Harmoniser en francais avec acronymes en tooltip.

### 6. AlertBadge non theme-aware
Le composant AlertBadge utilise des couleurs hardcodees (#f44336, #ff9800, #4caf50)
qui ne changent pas avec le theme. Migrer vers COLORS.status.error/warning/success.

### 7. SectionTitle duplique dans ConditionalSection
ConditionalSection re-implemente un titre de section au lieu d'utiliser SectionTitle.
Resultat : 2 styles differents pour la meme fonction. Unifier sur SectionTitle.

### 8. Espacement vertical inconsistant
Les gaps entre sections varient de 16px a 32px sans logique. Definir un spacing
system dans theme.js (8, 16, 24, 32) et appliquer uniformement.

## Corrections CSS recommandees

### Dans theme.js — ajouter :
```js
FONT_SIZES: { xs: 12, sm: 14, base: 16, lg: 20, xl: 24, xxl: 32 },
SPACING: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
```

### Remplacement couleurs hardcodees :
| Valeur hardcodee | Remplacer par |
|------------------|---------------|
| `#6B85A8` | `COLORS.text.secondary` |
| `#f44336` | `COLORS.status.error` |
| `#ff9800` | `COLORS.status.warning` |
| `#4caf50` | `COLORS.status.success` |
| `#ffffff` fond barre | `COLORS.background.secondary` |

### Status dots — ajouter icones :
```
OK      : cercle vert  + check (checkmark)
Warning : cercle orange + triangle (!)
Error   : cercle rouge + croix (x)
```

## Priorite d'execution

| # | Probleme | Impact | Effort | Priorite |
|---|----------|--------|--------|----------|
| 1 | #6B85A8 hardcode | A11y critique | Faible | P0 |
| 3 | Couleur seule status | A11y critique | Faible | P0 |
| 2 | ProgressBar invisible | Fonctionnel | Faible | P0 |
| 6 | AlertBadge theme | Coherence | Faible | P1 |
| 4 | fontSize echelle | Coherence | Moyen | P1 |
| 7 | SectionTitle doublon | Maintenance | Faible | P1 |
| 5 | Labels P&L | Coherence | Faible | P2 |
| 8 | Espacement | Polish | Moyen | P2 |
