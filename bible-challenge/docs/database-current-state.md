# Bible Challenge — Current Database Structure

Source: Supabase production database  
Generated via SQL introspection queries.

---

# Tables

- profiles
- reading_plans
- plan_days
- user_challenges
- checkins
- daily_verse
- notification_logs

---

# reading_plans

| column | type |
|------|------|
id | uuid
title | text
description | text
duration_days | integer
is_active | boolean
created_by | uuid
created_at | timestamptz

Notes:
- Only one plan should have `is_active = true`.

---

# plan_days

Represents each reading day of a plan.

Key constraint:

(plan_id, day_index) UNIQUE


Each day belongs to exactly one reading plan.

---

# user_challenges

Tracks which challenge a user started.

Important constraint:



(user_id, plan_id) UNIQUE


A user can only have one challenge progress per plan.

---

# checkins

Represents completion of a day.

Important constraint:



(user_id, plan_day_id) UNIQUE


A user can only complete a given day once.

---

# RPC Functions

## get_challenge_today()

Returns today's challenge data.

Used by:



GET /api/challenge/today


---

## complete_day()

Marks a challenge day as completed.

Used by:



POST /api/challenge/checkin


---

# Triggers

## handle_new_user()

Creates a profile when a new Supabase auth user is created.

---

## set_updated_at()

Automatically updates timestamp fields.