# Seeds Supabase

Ce dossier contient les seeds SQL pour la lecture "Bible Challenge - 2 ans".

## Workflow recommandé (repo-first)
Le schéma et les RPC doivent être versionnés dans le repo, puis exécutés dans l'ordre:

1. `supabase/migrations/0001_current_schema_baseline.sql`
2. `supabase/migrations/0002_rpc_get_challenge_today.sql`
3. `supabase/migrations/0003_rpc_complete_day.sql`

Ensuite seulement, appliquer les seeds de ce dossier si nécessaire pour les données de plan.

## Exécution SQL (sans dépendre du SQL Editor en routine)
Exemple via `psql`:

```bash
psql "$DATABASE_URL" -f supabase/migrations/0001_current_schema_baseline.sql
psql "$DATABASE_URL" -f supabase/migrations/0002_rpc_get_challenge_today.sql
psql "$DATABASE_URL" -f supabase/migrations/0003_rpc_complete_day.sql
psql "$DATABASE_URL" -f supabase/seed/2026-01-jan-year1.sql
```

## Vérifier que 31 lignes ont été créées
```sql
-- ID du plan janvier année 1
WITH plan AS (
  SELECT id FROM public.reading_plans WHERE is_active = true LIMIT 1
)
SELECT COUNT(*) AS total_jours
FROM public.plan_days
WHERE plan_id = (SELECT id FROM plan);
```

Résultat attendu: `total_jours = 31`.

## Notes
- Les migrations SQL sous `supabase/migrations/` sont la source de vérité du schéma.
- Les seeds restent des données d'initialisation, pas la source de vérité du schéma.
- Les seeds sont idempotents grâce à `ON CONFLICT (plan_id, day_index)`.
- Les références matin/soir sont stockées dans `morning_reference` et `evening_reference`.
- `reference` concatène les deux pour compat: `"M | S"`.
- Les champs de texte longs ne doivent pas être hardcodés dans le frontend; le contenu biblique vient d'une API externe puis est cacheable en base.
- Fuseau horaire utilisé: `Africa/Porto-Novo` (si indisponible, basculer sur `Africa/Lagos`).
