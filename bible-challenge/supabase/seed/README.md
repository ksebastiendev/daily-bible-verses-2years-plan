# Seeds Supabase

Ce dossier contient les seeds SQL pour la lecture "Bible Challenge - 2 ans".

## Comment exécuter dans le Supabase SQL Editor
1. Ouvre ton projet sur https://app.supabase.com
2. Va dans **SQL Editor** → **New Query**
3. Copie/colle le contenu de `2026-01-jan-year1.sql`
4. Clique sur **Run** (Cmd/Ctrl + Enter)

## Vérifier que 31 lignes ont été créées
```sql
-- ID du plan janvier année 1
WITH plan AS (
  SELECT id FROM public.reading_plans WHERE year = 1 AND month = 1 LIMIT 1
)
SELECT COUNT(*) AS total_jours
FROM public.plan_days
WHERE plan_id = (SELECT id FROM plan);
```

Résultat attendu: `total_jours = 31`.

## Notes
- Les seeds sont idempotents grâce à `ON CONFLICT (plan_id, day_index)`.
- Les références matin/soir sont stockées dans `morning_reference` et `evening_reference`.
- `reference` concatène les deux pour compat: `"M | S"`.
- Les champs de texte (`passage_text`, `morning_text`, `evening_text`, `main_verse`) sont mis à `NULL` pour l'instant (seront remplis plus tard avec Louis Segond 1910).
- Fuseau horaire utilisé: `Africa/Porto-Novo` (si indisponible, basculer sur `Africa/Lagos`).
