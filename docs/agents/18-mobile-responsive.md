# Agent 18 — Mobile & Responsive : Audit et Plan d'Implementation

## Constat : 0 media queries

Le codebase ne contient aucune media query, aucun breakpoint, aucune adaptation responsive.
Tous les styles sont inline avec des valeurs fixes en pixels. Le dashboard est strictement
desktop (>1200px). Sur mobile, l'experience est cassee.

## Simulation 375px (iPhone SE) — 6 problemes

### 1. Header casse
Le header affiche titre + navigation + boutons sur une seule ligne.
A 375px : le texte deborde, les boutons sont hors ecran ou se superposent.

### 2. Navigation deborde
Les 4 onglets + Parametres ne tiennent pas en largeur. Le dernier onglet est coupe.
Pas de scroll horizontal ni de menu hamburger.

### 3. DataTable illisible
Les tableaux ont 5-8 colonnes avec des largeurs fixes. A 375px : scroll horizontal
obligatoire, headers invisibles, impossible de croiser ligne et colonne.

### 4. FinancialSettings inutilisable
Les champs de saisie et les selects sont trop petits pour le tactile.
Les labels sont tronques. Les boutons d'action sont hors viewport.

### 5. KPICards empilees sans hierarchie
Les cards KPI s'empilent verticalement sans distinction de priorite.
L'utilisateur doit scroller 10+ ecrans pour voir toutes les metriques.

### 6. Charts non responsifs
Les graphiques Recharts ont des dimensions fixes. A 375px : axes tronques,
legendes superposees, tooltips hors ecran.

## Plan d'implementation

### Phase 1 — Fondations (2 jours)

**useBreakpoint hook** dans `src/utils/useBreakpoint.js` :
```
Breakpoints : mobile (<768), tablet (768-1024), desktop (>1024)
Retourne : { isMobile, isTablet, isDesktop, breakpoint }
Ecoute resize avec debounce 150ms
```

**Viewport meta tag** dans index.html :
```
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

### Phase 2 — Layout adaptatif (3 jours)

**Bottom navigation mobile** :
- Remplacer les onglets horizontaux par une bottom nav fixe (4 icones + labels)
- Icones : Strategie (target), Acquisition (megaphone), Qualite (users), Budget (wallet)
- L'onglet Parametres accessible via icone engrenage dans le header

**Grid responsive** :
- Desktop : grilles 2-3 colonnes pour les KPIs et charts
- Tablet : grille 2 colonnes
- Mobile : 1 colonne, full width

### Phase 3 — Composants adaptes (3 jours)

**KPI carrousel mobile** :
- Les 3-4 KPIs hero deviennent un carrousel swipeable
- Dots indicateurs en bas, swipe gauche/droite

**DataTable colonnes prioritaires** :
- Definir 2-3 colonnes prioritaires par table
- Mobile : afficher uniquement les prioritaires + bouton "Voir tout"
- Alternative : transformation en cards empilees (1 card = 1 ligne)

**Charts adaptatifs** :
- ResponsiveContainer de Recharts (deja disponible dans la lib)
- Legendes en dessous (pas a droite) sur mobile
- Simplifier les axes (moins de ticks)

### Phase 4 — Polish (1 jour)

- Touch targets minimum 44x44px (guidelines Apple)
- Safe areas pour iPhone avec notch (env(safe-area-inset-*))
- Taille de police minimum 16px pour eviter le zoom iOS sur les inputs
- Desactiver le double-tap zoom sur les elements interactifs

## Estimation totale : 9 jours de dev

| Phase | Contenu | Effort |
|-------|---------|--------|
| 1 | Fondations (hook + viewport) | 2 jours |
| 2 | Layout adaptatif (nav + grid) | 3 jours |
| 3 | Composants (carrousel, table, charts) | 3 jours |
| 4 | Polish (touch, safe areas) | 1 jour |

## Note importante
Le responsive n'est pas un "nice to have". Le DG et les admissions consultent souvent
depuis leur telephone. Sans adaptation mobile, le dashboard perd 2 de ses 4 profils cibles.
