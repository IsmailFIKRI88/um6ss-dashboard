> **Note (mars 2026)** : Vision V2. Le code actuel implémente 2 filtres sur 6 (Entité + Période).

# Filtres & Périodes

## Dimensions transverses

| Dimension | Champ source | Valeurs | Implémentation |
|-----------|-------------|---------|----------------|
| **Entité** | `lp_entite` → `extractEntityCode()` | FM6SIPS, FM6MD, FM6P, FM6MV, ESM6ISS, FM6M, FM6M-EN, EIMSP, ISMBB | Dropdown + changement accent color |
| **Filière** | `programme_id` / `programme_label` | 54 programmes | Dropdown filtré par entité sélectionnée |
| **Campus** | `campus_label` | Casablanca, Rabat, Tanger, Marrakech, Dakhla, Agadir, Benguerir | Dropdown multi-select |
| **Canal** | `channel_group` | 14 canaux (voir channels.md) | Dropdown multi-select |
| **Origine géo** | `geo_country_code` → zone | Maroc, Burkina Faso, Bénin, Côte d'Ivoire, Gabon, Nigeria, Sénégal, Autre Afrique, Autre International | Dropdown avec regroupement par zone |
| **Période** | `created_at` | Presets + sur mesure | Voir ci-dessous |
| **Cohorte** | Année académique d'entrée | 2024, 2025, 2026… | Dropdown (quand historique disponible) |

## Sélecteur de période

### Presets

| Preset | Période active | Période comparaison N-1 |
|--------|---------------|------------------------|
| Aujourd'hui | aujourd'hui | même jour N-1 |
| 7 derniers jours | J-7 → J | même 7 jours N-1 |
| 30 derniers jours | J-30 → J | même 30 jours N-1 |
| Mois en cours | 1er → aujourd'hui | même jours même mois N-1 |
| Mois dernier | mois M-1 complet | même mois N-1 |
| Trimestre en cours | 1er jour trimestre → aujourd'hui | même période trimestre N-1 |
| Campagne en cours | 2025-12-01 → aujourd'hui | 2024-12-01 → même jour relatif |
| **Sur mesure** | date picker début ↔ fin | même durée, décalée de 1 an |

### Comparaison N-1 sur chaque KPI

```
┌──────────────────────┐
│ LEADS TOTAL          │
│ 1,234          ▲ +18%│
│ vs. 1,045 (N-1)      │
└──────────────────────┘
```

- Vert ▲ si positif pour métriques "plus = mieux" (leads, inscrits, ROAS)
- Rouge ▲ si positif pour métriques "moins = mieux" (CPL, CPA, délai contact)
- `—` avec tooltip si pas de données N-1

### Regroupement géographique

| Zone | Pays inclus |
|------|------------|
| Maroc | MA |
| Afrique de l'Ouest | BF, BJ, CI, GH, ML, NE, NG, SN, TG |
| Afrique Centrale | GA, CM, CD, CG |
| Autre Afrique | Tous les autres codes africains |
| Autre International | Tout le reste |
