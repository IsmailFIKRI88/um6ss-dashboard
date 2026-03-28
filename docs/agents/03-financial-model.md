# Agent : Modélisateur Financier — Formules complètes

> Session 1 · Mars 2026 · Mission : construire le modèle financier avec toutes les formules

## 1. Unit Economics par étudiant

### CAC Digital (Couche 1+2)
`CAC_digital = total_spend_digital / nombre_inscrits`

### CAC Complet (Couche 2+5)
`CAC_complet = (spend_digital + couts_mktg_fixes × mois_campagne + couts_admissions + couts_non_digital) / inscrits_payants`

### LTV Brute (Couche 3)
`LTV_brute = frais_inscription + (frais_annuels × durée_programme)`

### LTV Ajustée au Churn (Couche 3+5)
`LTV_ajustée = frais_inscription + frais_annuels × [1 + r1 × (1 - r2^(N-1)) / (1 - r2)]`
où r1 = taux rétention A1, r2 = taux rétention A2+, N = durée programme.
Déjà implémenté dans `computeProgramLTV()` (programs.js).

### LTV Nette (Couche 4)
`LTV_nette = LTV_ajustée - coût_formation_cumulé_ajusté`
À créer dans financial.js.

### Payback Period (Couche 2+3)
`payback_mois = CAC_complet / (frais_annuels / 12)`
Déjà implémenté.

### Ratio LTV/CAC (Couche 2+3)
`ratio = LTV_ajustée / CAC_complet`
Bon : ≥ 3x. Critique : < 1x.

## 2. P&L Campagne

- Revenue brut Y1 = inscrits_payants × (frais_inscription + frais_annuels_Y1)
- Revenue lifetime = inscrits × LTV_ajustée
- Marge de contribution = revenue_lifetime - coût_formation_cumulé - coût_campagne
- ROI campagne = (revenue_lifetime - coûts_totaux) / coûts_totaux
- **Break-even** = coût_campagne / LTV_ajustée (nombre min d'inscrits)

## 3. Métriques par filière

- Marge de contribution par programme = inscrits_p × (LTV_ajustée_p - coût_formation_cumulé_p) - spend_p
- **Margin-weighted ROAS** = Σ(inscrits_p × marge_nette_p) / Σ(spend_p)
- Taux de remplissage = inscrits_p / capacité_max_p × 100
- **Manque à gagner** = (capacité_p - inscrits_p) × LTV_ajustée_p
- Coût marginal = CPL_qualifié / taux_conv_qualifié_inscrit + coût_formation_marginal

## 4. Métriques prédictives

- Projection inscrits = (leads_actuels + daily_rate × jours_restants) × taux_conv
- Revenue projeté = inscrits_projetés × LTV_ajustée_pondérée
- **3 Scénarios** : pessimiste (daily_rate × 0.7), base (×1.0), optimiste (×1.3)

## 5. Métriques santé long terme

- Churn par cohorte : `churn_c_k = 1 - (inscrits_année_k / inscrits_année_(k-1))`
- Corrélation canal → rétention : `retention_canal_c = inscrits_A2_canal / inscrits_A1_canal`
- Coût de remplacement = CAC + revenue_perdu_restant
- NRR adapté éducation = revenue_cohorte_k / revenue_cohorte_(k-1) × 100 (toujours < 100%)

## 6. Activation par couches

| Couche | Données | Métriques débloquées |
|---|---|---|
| 1 | Leads + Spend | CPL, burn rate, projection leads, concentration |
| 2 | + Outcomes | CAC digital, yield rate, break-even, projection inscrits |
| 3 | + Frais/Capacités | LTV, ROAS, payback, LTV/CAC, remplissage, manque à gagner |
| 4 | + Coûts formation | LTV nette, marge contribution, margin-weighted ROAS |
| 5 | + Churn réel + No-show | Inscrits payants nets, CAC complet, cash flow |
| 6 | + Multi-cohortes | NRR, corrélation canal→rétention, saisonnalité |
