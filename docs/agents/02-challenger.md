# Agent : Devil's Advocate — Critique du projet

> Session 1 · Mars 2026 · Mission : challenger impitoyablement le projet d'extension

## Bug identifié (corrigé depuis)

**reconciliation.js lignes 39-41** : Un lead avec `fbclid` était matché à TOUTES les campagnes Meta. Logique de matching cassée — gonflait artificiellement les `wordpress_leads` de chaque campagne et faussait tous les CPL.

## Risques organisationnels

- La DSI n'a aucune incitation à fournir les données. Le dashboard est un projet du Département Communication, pas de la DSI. L'estimation "T+1 mois, 1j config" oublie les 6 mois de négociation politique.
- Le CFO ne migrera pas son tableur Excel vers un panel de settings React stocké en localStorage.
- HubSpot à "T+4 mois, 3j dev" est une sous-estimation grotesque (50-100K MAD/an licence + 3-6 mois intégration).

## Risques de données

- Le scoring met 77% des leads en zone "tiède" → ne discrimine rien en pratique.
- Les benchmarks par défaut (`cpl_sector_avg: 350`, `conversion_rate_enrolled: 12`) sont des bombes à retardement — estimations hardcodées présentées comme des constantes.
- Les retention rates dans `programs.js` (88% Y1, 95% ongoing) ne viennent d'aucune donnée réelle de l'UM6SS.

## Risques d'over-engineering

- Module financier sophistiqué (160 lignes financial.js + 138 lignes programs.js) pour afficher "Aucune donnée d'inscription" — 0 inscrits dans la BDD.
- FinancialSettingsPanel = tableur local déguisé en application collaborative (localStorage pas partagé entre utilisateurs).
- 4 vues → 10+ vues pour le cycle complet = explosion combinatoire sans TypeScript, sans tests (corrigé depuis), sans state manager.

## Questions inconfortables

1. Si la DSI met 6 mois à fournir un CSV, tout le projet est bloqué ? **Oui.**
2. Un dashboard peut-il couvrir 6 phases avec des temporalités si différentes (jours vs années) ? **Non dans le même paradigme.**
3. WordPress comme source de vérité pour un cycle de 7 ans ? **C'est un formulaire de contact, pas un SIS.**
4. Le coût de maintenance est-il justifié ? Le "~3 USD/mois" omet le temps humain.

## Anti-patterns identifiés

1. Dashboard de tout (6 phases, des publics différents, des données différentes)
2. Build it and they will share (construire les vues en espérant que la DSI coopère)
3. Mock data optimism (retention rates inventés utilisés dans les calculs)
4. localStorage as database (pas partagé entre utilisateurs)
5. Feature creep by roadmap (10 extensions en 18 mois avec efforts "1-5j")
6. Absence de tests (corrigé : 105 tests maintenant)

## Plan B recommandé

Si l'extension full-cycle échoue : consolider l'acquisition (corriger bugs, ajouter tests, recalibrer scoring) + obtenir UN CSV mensuel de la DSI (email, programme, statut, date).
