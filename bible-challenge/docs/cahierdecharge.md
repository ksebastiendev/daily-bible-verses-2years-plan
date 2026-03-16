📘 CAHIER DES CHARGES – Bible Challenge (V1.2)
1. Contexte et vision

Dans la communauté de cours biblique, plusieurs activités existent déjà :

jeux bibliques

résumés de passages

discussions

échanges dans les groupes WhatsApp

Cependant, la lecture personnelle quotidienne de la Bible reste irrégulière.
Les outils actuels (PDF, messages WhatsApp, applications bibliques classiques) présentent plusieurs limites :

lecture non guidée

passages longs et décourageants

absence de progression visible

faible motivation sur la durée

Le projet Bible Challenge vise à créer une plateforme web mobile-first qui :

propose un challenge de lecture complète de la Bible sur 2 ans

rend la lecture simple, guidée et progressive

transforme la lecture en expérience immersive

introduit une gamification légère

encourage la régularité quotidienne

propose un verset du jour indépendant

relance les membres inactifs

récompense les participants les plus réguliers

L’application complète les activités existantes du groupe WhatsApp, sans les remplacer.

2. Objectifs du projet (V1)
Objectif principal

Permettre aux membres de lire la Bible de manière régulière pendant 2 ans, avec un taux de rétention élevé.

Objectifs secondaires

Créer une habitude quotidienne de lecture

Permettre une lecture immersive et guidée

Motiver les participants grâce à un classement mensuel

Permettre la récompense des meilleurs lecteurs

Créer une communauté active de challengers

Centraliser la progression en dehors de WhatsApp

Proposer un verset du jour inspirant

3. Philosophie produit

L’application adopte une approche :

Anonymous First

Les utilisateurs peuvent commencer le challenge immédiatement, sans créer de compte.

L’identité est facultative.

Les informations personnelles sont demandées uniquement pour :

participer au classement

recevoir les récompenses mensuelles

rejoindre la communauté WhatsApp

4. Périmètre fonctionnel (MVP V1)

Le produit doit rester :

simple

rapide à utiliser

mobile-first

orienté lecture quotidienne

4.1 Challenge Bible – 2 ans

Le challenge propose un plan de lecture structuré sur :

Jour 1 → Jour 730

Chaque jour contient :

une ou plusieurs références bibliques

des versets récupérés via une API externe

une lecture guidée

Fonctionnalités :

commencer depuis le début

reprendre à un jour précis

marquer un jour comme terminé

enregistrer la progression

4.2 Lecture immersive

La lecture immersive est le cœur de l’application.

Pour éviter la fatigue liée aux passages longs, la lecture utilise un système de révélation progressive des versets.

Principe :

Les versets sont affichés par petits blocs.

Exemple :

Versets 1–3
→ continuer

Versets 4–6
→ continuer

Fonctionnalités :

affichage progressif des versets

bouton continuer

indicateur de progression

barre de progression

message de fin de lecture

possibilité d’ajouter une réflexion

4.3 Verset du jour

Flux indépendant du challenge.

Chaque jour un verset est proposé.

Contenu :

référence biblique

texte du verset

message inspirant

Deux modes :

automatique

verset généré automatiquement

manuel

verset défini par l’admin

4.4 Gamification

Le système de gamification vise à encourager la régularité.

Points
+1 point → bloc de versets lu
+5 points → jour terminé
+3 points → réflexion
Niveaux

Exemple :

Débutant
Fidèle
Disciple
Maître
Classement

Classements :

mensuel

global

Les 10 premiers du classement mensuel peuvent recevoir une récompense.

4.5 Récompenses

Les récompenses sont distribuées mensuellement.

Les gagnants peuvent recevoir :

un dépôt Mobile Money (MoMo)

d’autres récompenses communautaires

Pour recevoir une récompense, l’utilisateur doit fournir :

pseudo
numéro de téléphone

Ces informations permettent :

de l’identifier

de lui envoyer la récompense

de l’inviter à rejoindre la communauté WhatsApp

4.6 Suivi personnel

Chaque utilisateur peut voir :

son jour actuel

sa progression

son streak

ses points

son historique de lecture

4.7 Profil utilisateur

Le profil est facultatif.

Un utilisateur peut entrer :

pseudo
numéro de téléphone

Cela permet :

d’apparaître dans le classement

de recevoir les récompenses

de rejoindre la communauté

5. Notifications intelligentes (V1)

Les notifications sont envoyées par email.

Exemples :

rappel
Petit rappel 🙏
Le passage du jour est prêt.
encouragement
🔥 3 jours de suite !
Continue, tu es régulier.
reconnexion
On t’a moins vu ces jours-ci.
Reviens doucement.
6. Utilisateurs et rôles
Utilisateur invité

Peut :

commencer la lecture immédiatement

progresser dans le challenge

lire les versets

Mais ne peut pas :

apparaître dans le classement

recevoir des récompenses

Utilisateur enregistré

Peut :

participer au classement

recevoir les récompenses

rejoindre la communauté

Admin

Peut :

créer un plan de lecture

importer les jours J1 → J730

définir le verset du jour

voir les statistiques

7. Stack technique
Frontend
Next.js (App Router)
TailwindCSS
Mobile-first
PWA installable
Backend
Supabase
PostgreSQL
RPC functions
Next.js API routes
Authentification

Pas de login obligatoire.

Identification par :

device_id

stocké dans le navigateur.

Source biblique

Les versets sont récupérés via :

bible_available_api

API externe qui fournit les passages bibliques.

8. Modèle de données (simplifié)
profiles
id
username
phone
device_id
points
streak
created_at
reading_plans
id
title
duration_days
is_active
created_at
plan_days
id
plan_id
day_index
reference
morning_reference
evening_reference
main_verse
user_challenges
id
user_id
plan_id
start_day_index
started_at
checkins
id
user_id
plan_day_id
verses_done
current_step
total_steps
reflection
created_at
daily_verse
id
date
reference
text
notification_logs
id
user_id
type
sent_at
meta
9. API interne
GET /api/challenge/today
POST /api/challenge/checkin
POST /api/challenge/start
GET /api/daily-verse
GET /api/docs
10. Contraintes

mobile-first

UX simple

démarrage rapide

friction minimale

indépendance WhatsApp

11. Hors périmètre V1
application mobile native
bot WhatsApp
commentaires entre membres
multilingue
bible offline
12. Indicateurs de succès
nombre d’utilisateurs actifs
jours lus par utilisateur
streak moyen
taux de retour
progression dans le challenge
feedback communauté