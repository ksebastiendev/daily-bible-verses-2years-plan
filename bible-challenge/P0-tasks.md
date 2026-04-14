# P0 — Tasks Bible Challenge (auto-exécution)

## Instructions pour Copilot
- Exécute les tâches dans l'ordre
- Après chaque tâche : mets à jour le statut [ ] → [x]
- Si une tâche échoue : note l'erreur et passe à la suivante
- À la fin : génère le fichier P0-report.md avec le résumé complet

---

## Tâches

### T1 — Supprimer lib/bible/adapter.ts [x]
- Trouver tous les fichiers qui importent bible/adapter
- Remplacer par lecture directe de plan_days.passage_text
- Supprimer lib/bible/adapter.ts et lib/bible/adapter.test.ts
- Vérifier : grep -r "bible/adapter" . --include="*.ts" --include="*.tsx" → 0 résultats
- Lancer : npx vitest run → 0 failed

### T2 — Corriger incohérence schéma DB [x]
- Lire supabase/migrations/0001_current_schema_baseline.sql
- Lire supabase/seed/*.sql
- Identifier toutes les colonnes présentes dans le seed mais absentes du schéma
- Créer supabase/migrations/0004_fix_schema_alignment.sql avec les ALTER TABLE nécessaires
- Vérifier cohérence : chaque colonne du seed doit exister dans le schéma

### T3 — Middleware protection routes /app/* [x]
- Créer middleware.ts à la racine du projet
- Protéger toutes les routes /app/* : rediriger vers /login si non authentifié
- Utiliser le client Supabase SSR (lib/supabase/server.ts)
- Laisser passer les routes publiques : /, /login, /auth/callback, /api/*, /docs
- Tester : accès /app/home sans session → redirect /login

### T4 — Nettoyer doublon route reading [x]
- Vérifier le contenu de app/challenge/reading/page.tsx
- Migrer tout contenu utile vers app/app/reading/page.tsx si manquant
- Supprimer le dossier app/challenge/
- Vérifier qu'aucun lien interne ne pointe encore vers /challenge/reading
- Lancer : npx vitest run → 0 failed

### T5 — Compléter page /app/challenge [x]
- Lire app/app/challenge/page.tsx
- Remplacer les placeholders par :
  * Progression réelle (% calculé depuis checkins de l'utilisateur)
  * Jour actuel du challenge (depuis user_challenges)
  * Calendrier des 30 derniers jours (jours lus ✓ vs manqués ✗)
  * Bouton "Lire aujourd'hui" → /app/reading
- Utiliser l'API existante GET /api/challenge/today pour les données
- Page doit fonctionner pour utilisateur authentifié ET invité

---

## Rapport final
Après toutes les tâches, créer P0-report.md avec :
- Statut de chaque tâche (✅ / ❌)
- Fichiers modifiés par tâche
- Erreurs rencontrées
- Tests : X passed, Y failed
- Recommandations pour la suite
