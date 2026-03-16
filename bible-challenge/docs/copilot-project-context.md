# Bible Challenge — Project Context for Copilot

## Product vision

Bible Challenge is a mobile-first web app designed to help users read the Bible consistently over 2 years.

The app must reduce reading friction and improve retention compared to:
- PDF reading plans
- WhatsApp-only reminders
- classic Bible apps with no guided flow

The app focuses on:
- guided daily reading
- progressive immersive reading
- visible progression
- simple gamification
- daily verse
- low-friction onboarding

---

## Current product direction

### Anonymous-first experience
Users must be able to start the challenge immediately without mandatory login.

There is no mandatory email magic-link authentication in the new product direction.

Instead:
- users can use the app as guests
- identity is optional
- leaderboard and rewards require user info later

### Identity model
The app should support:
- guest mode first
- optional profile completion later

Optional user info:
- username
- phone number

Why phone number:
- monthly Mobile Money reward for top users
- potential WhatsApp challenger community onboarding

Users who do not provide identity can still:
- start the challenge
- read
- progress locally / with lightweight identification

But they should not:
- appear in leaderboard
- receive rewards

---

## Core UX principles

### 1. Reading must start fast
The user should be able to start reading in less than 5 seconds.

### 2. Long passages must not feel heavy
Do not show 40–60 verses at once.
Use progressive reading blocks.

### 3. Reading should feel guided
The product should feel closer to Duolingo / guided reading than a classic Bible app.

### 4. Friction must be low
No mandatory auth wall before first reading.

---

## Immersive reading model

Immersive reading is the core of the product.

Do NOT assume one full passage is shown at once.

Use progressive verse blocks:
- a reading step displays a small group of verses
- recommended block size: 3 verses per step by default
- step size may be configurable later

Example:
- step 1 = verses 1–3
- step 2 = verses 4–6
- step 3 = verses 7–9

UI expectations:
- calm reading screen
- verse block only
- progress indicator
- progress bar
- continue button
- end-of-day reflection optional

Gamification:
- +1 point per verse block read
- +5 points per completed day
- +3 points per reflection

---

## Daily verse direction

The daily verse is independent from the challenge.

It should be implemented as:
- a dedicated daily verse flow
- fetched from external Bible content API if needed
- stored locally in DB for consistency/caching

---

## Bible text source

Bible text should not be hardcoded into the frontend.

The project must use an external API:
- bible_available_api

This API is the source of Bible passage content.

The app should consume it to retrieve:
- verse text
- passage text
- references

The app may cache/store selected data in Supabase tables where useful.

---

## Current technical stack

Frontend:
- Next.js App Router
- TailwindCSS
- mobile-first
- PWA

Backend:
- Supabase
- PostgreSQL
- RPC functions
- Next.js route handlers

API docs:
- Swagger / OpenAPI available at /docs

---

## Current real database state

The repository may not fully reflect the live Supabase schema.
When in doubt, prefer the documented current DB state.

Known public tables:
- profiles
- reading_plans
- plan_days
- user_challenges
- checkins
- daily_verse
- notification_logs

### reading_plans
Known real columns:
- id
- title
- description
- duration_days
- is_active
- created_by
- created_at

Important:
Use `is_active`, not `active`, unless explicitly refactored later.

### plan_days
Known concept:
- linked to reading plan
- one row per day in the challenge
- includes day_index and references

### user_challenges
Used to track:
- user challenge start
- resume day
- challenge activation

### checkins
Used to track:
- challenge day completion
- reading progression
- immersive reading progression

Known or expected fields include:
- user_id
- plan_day_id
- reflection
- completed_at
- points_earned
- verses_done
- total_verses
- current_step
- total_steps

### daily_verse
Stores the verse of the day.

---

## Current RPC functions already used by the app

The app already depends on:
- get_challenge_today()
- complete_day()

Do not invent replacement logic if these functions are already used.

---

## Current API direction

Known internal routes:
- GET /api/challenge/today
- POST /api/challenge/checkin
- POST /api/challenge/start
- GET /api/daily-verse
- GET /api/docs

Success responses should generally use:
```json
{ "data": ... }