# Analyses des agents — Mars 2026

Ce dossier contient les analyses détaillées produites par les agents spécialisés
lors de deux sessions de brainstorming multi-agents (18 agents au total).

Ces documents sont des **snapshots** — ils reflètent l'état du projet et du marché
au moment de leur génération. Les décisions qui en découlent sont implémentées
dans le code et documentées dans `docs/ARCHITECTURE.md`.

## Session 1 — Extension cycle de vie (4 agents)

| Fichier | Agent | Mission |
|---|---|---|
| [01-strategist.md](01-strategist.md) | Stratège Business | KPIs par phase du cycle étudiant, nouvelles vues, corrélations cross-phases |
| [02-challenger.md](02-challenger.md) | Devil's Advocate | Risques organisationnels, bugs identifiés, anti-patterns, Plan B |
| [03-financial-model.md](03-financial-model.md) | Modélisateur Financier | Formules complètes (6 couches), unit economics, P&L campagne |
| [04-architect.md](04-architect.md) | Architecte Technique | Hooks, vues, processing, migration, arbre de fichiers |

## Session 2 — Fermi TAM/SAM/SOM (9 agents)

| Fichier | Agent | Mission |
|---|---|---|
| [05-economist.md](05-economist.md) | Économiste Éducation | TAM/SAM/SOM chiffré avec sources |
| [06-sov-strategist.md](06-sov-strategist.md) | Stratège Média / SOV | Comment mesurer le SOV sans données concurrents |
| [07-challenger-fermi.md](07-challenger-fermi.md) | Challenger Fermi | Attaque des hypothèses TAM/SAM/SOM |
| [08-data-scientist.md](08-data-scientist.md) | Data Scientist | Formules Monte Carlo, Sobol, bayésien |
| [09-competitor-intel.md](09-competitor-intel.md) | Intelligence Concurrentielle | Cartographie concurrents, parts de marché |
| [10-cfo.md](10-cfo.md) | CFO | Du Fermi aux décisions budget, scénarios CODIR |
| [11-architect-fermi.md](11-architect-fermi.md) | Architecte Technique | Implémentation marketSizing.js, panel config |
| [12-ux.md](12-ux.md) | UX Designer | Visualisation de l'incertitude, estimations vs faits |
| [13-africa-expert.md](13-africa-expert.md) | Expert Afrique Francophone | Marché étudiant subsaharien, barrières, canaux |

## Session 2 — Phase A (9 agents supplémentaires)

Les analyses Phase A des agents (Stratège, Challenger, Architecte, Data Analyst,
UX, Security, Ops, Documentaliste, Financial) ont été intégrées directement
dans le code et la documentation. Les points clés sont dans les mémoires
(`.claude/projects/.../memory/`).
