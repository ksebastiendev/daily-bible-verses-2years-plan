# Bible Challenge Project Audit

Date: 2026-03-14

Scope note: this audit is repository-based only (no live database introspection). Findings below are derived from code, tests, OpenAPI spec, and SQL seed files.

## 1) Database assumptions found in code

### Tables referenced in repository
- reading_plans
- user_challenges
- plan_days
- checkins
- profiles: no direct reference found in repository code/tests/SQL

### Expected columns by table (from usage evidence)

#### reading_plans
Expected columns from seed SQL:
- id (returned from insert)
- name
- year
- month
- timezone
- is_active

Evidence:
- [supabase/seed/2026-01-jan-year1.sql](supabase/seed/2026-01-jan-year1.sql#L12)
- [supabase/seed/2026-01-jan-year1.sql](supabase/seed/2026-01-jan-year1.sql#L14)

Expected columns from API route:
- id
- active

Evidence:
- [app/api/challenge/start/route.ts](app/api/challenge/start/route.ts#L45)
- [app/api/challenge/start/route.ts](app/api/challenge/start/route.ts#L47)
- [app/api/challenge/start/route.test.ts](app/api/challenge/start/route.test.ts#L87)

#### user_challenges
Expected columns from API route:
- id
- user_id
- plan_id
- start_day_index
- active
- started_at

Evidence:
- [app/api/challenge/start/route.ts](app/api/challenge/start/route.ts#L63)
- [app/api/challenge/start/route.ts](app/api/challenge/start/route.ts#L65)
- [app/api/challenge/start/route.ts](app/api/challenge/start/route.ts#L68)
- [app/api/challenge/start/route.ts](app/api/challenge/start/route.ts#L69)
- [app/api/challenge/start/route.ts](app/api/challenge/start/route.ts#L79)
- [app/api/challenge/start/route.ts](app/api/challenge/start/route.ts#L83)

#### plan_days
Expected columns from seed SQL:
- plan_id
- day_index
- morning_reference
- evening_reference
- reference
- passage_text
- morning_text
- evening_text
- main_verse

Evidence:
- [supabase/seed/2026-01-jan-year1.sql](supabase/seed/2026-01-jan-year1.sql#L54)

Additional API/RPC output assumptions (not direct table query in app code):
- plan_day_id
- day_index
- reference

Evidence:
- [src/lib/openapi.ts](src/lib/openapi.ts#L88)
- [src/lib/openapi.ts](src/lib/openapi.ts#L89)
- [src/lib/openapi.ts](src/lib/openapi.ts#L90)

#### checkins
Expected columns from SQL migration block in seed file:
- verses_done (not null, default 0)
- total_verses
- current_step (not null, default 0)
- total_steps

Evidence:
- [supabase/seed/2026-01-jan-year1.sql](supabase/seed/2026-01-jan-year1.sql#L5)

Additional inferred check-in data assumptions (from RPC contract):
- plan_day relationship via p_plan_day_id
- reflection field via p_reflection
- possible points/day fields in response payload

Evidence:
- [app/api/challenge/checkin/route.ts](app/api/challenge/checkin/route.ts#L39)
- [app/api/challenge/checkin/route.ts](app/api/challenge/checkin/route.ts#L40)
- [app/api/challenge/checkin/route.ts](app/api/challenge/checkin/route.ts#L41)
- [src/lib/openapi.ts](src/lib/openapi.ts#L118)
- [src/lib/openapi.ts](src/lib/openapi.ts#L119)
- [src/lib/openapi.ts](src/lib/openapi.ts#L120)

#### profiles
- No direct table reference in routes/tests/SQL searched.

### Schema mismatches / inconsistencies
- reading_plans active flag mismatch:
  - Seed uses is_active in insert/update: [supabase/seed/2026-01-jan-year1.sql](supabase/seed/2026-01-jan-year1.sql#L12), [supabase/seed/2026-01-jan-year1.sql](supabase/seed/2026-01-jan-year1.sql#L17)
  - API reads active: [app/api/challenge/start/route.ts](app/api/challenge/start/route.ts#L47)
- OpenAPI response shape mismatch with real handlers:
  - Handlers return wrapped object { data: ... }: [app/api/challenge/today/route.ts](app/api/challenge/today/route.ts#L22), [app/api/challenge/checkin/route.ts](app/api/challenge/checkin/route.ts#L52)
  - OpenAPI 200 schemas describe unwrapped payload objects: [src/lib/openapi.ts](src/lib/openapi.ts#L84), [src/lib/openapi.ts](src/lib/openapi.ts#L115)
- Error schema mismatch:
  - ErrorResponse defines error as string: [src/lib/openapi.ts](src/lib/openapi.ts#L74)
  - Routes often return error objects from Supabase RPC: [app/api/challenge/today/route.ts](app/api/challenge/today/route.ts#L19), [app/api/challenge/checkin/route.ts](app/api/challenge/checkin/route.ts#L49)
- There is no repository definition for profiles or explicit schema contract for it.

## 2) API routes status

### Existing App Router API endpoints
- GET /api/challenge/today
- POST /api/challenge/checkin
- POST /api/challenge/start
- GET /api/docs

Evidence:
- [app/api/challenge/today/route.ts](app/api/challenge/today/route.ts)
- [app/api/challenge/checkin/route.ts](app/api/challenge/checkin/route.ts)
- [app/api/challenge/start/route.ts](app/api/challenge/start/route.ts)
- [app/api/docs/route.ts](app/api/docs/route.ts)

### Endpoint details

#### GET /api/challenge/today
- Request body / params: none
- Auth requirement: yes, session required
- Tables or RPCs used: RPC get_challenge_today
- Expected response shape in code: { data: any } on success; { error: ... } on failure

Evidence:
- [app/api/challenge/today/route.ts](app/api/challenge/today/route.ts#L13)
- [app/api/challenge/today/route.ts](app/api/challenge/today/route.ts#L16)
- [app/api/challenge/today/route.ts](app/api/challenge/today/route.ts#L22)
- [app/api/challenge/today/route.test.ts](app/api/challenge/today/route.test.ts#L61)

#### POST /api/challenge/checkin
- Request body / params: planDayId (required string), reflection (optional string)
- Auth requirement: yes, session required
- Tables or RPCs used: RPC complete_day with p_plan_day_id and p_reflection
- Expected response shape in code: { data: any } on success; { error: ... } on failure

Evidence:
- [app/api/challenge/checkin/route.ts](app/api/challenge/checkin/route.ts#L29)
- [app/api/challenge/checkin/route.ts](app/api/challenge/checkin/route.ts#L36)
- [app/api/challenge/checkin/route.ts](app/api/challenge/checkin/route.ts#L39)
- [app/api/challenge/checkin/route.ts](app/api/challenge/checkin/route.ts#L52)
- [app/api/challenge/checkin/route.test.ts](app/api/challenge/checkin/route.test.ts#L121)

#### POST /api/challenge/start
- Request body / params: startDayIndex (required integer 1..730), planId (optional string)
- Auth requirement: yes, session required
- Tables or RPCs used:
  - reading_plans (lookup active plan id)
  - user_challenges (update, fallback insert)
- Expected response shape in code: { success, planId, startDayIndex }

Evidence:
- [app/api/challenge/start/route.ts](app/api/challenge/start/route.ts#L29)
- [app/api/challenge/start/route.ts](app/api/challenge/start/route.ts#L45)
- [app/api/challenge/start/route.ts](app/api/challenge/start/route.ts#L63)
- [app/api/challenge/start/route.ts](app/api/challenge/start/route.ts#L78)
- [app/api/challenge/start/route.test.ts](app/api/challenge/start/route.test.ts#L105)

#### GET /api/docs
- Request body / params: none
- Auth requirement: no route-level auth check
- Tables or RPCs used: none; returns generated OpenAPI spec
- Expected response shape: OpenAPI JSON document

Evidence:
- [app/api/docs/route.ts](app/api/docs/route.ts#L1)

## 3) RPC / SQL dependencies

### RPC functions assumed by app
- get_challenge_today
  - Called in: [app/api/challenge/today/route.ts](app/api/challenge/today/route.ts#L16)
- complete_day
  - Called in: [app/api/challenge/checkin/route.ts](app/api/challenge/checkin/route.ts#L39)

### SQL definitions found in repo for these RPCs
- No function definitions found in repository SQL files for either RPC.
- Current SQL in repo is seed-focused and does not define RPC functions.

Evidence:
- [supabase/seed/2026-01-jan-year1.sql](supabase/seed/2026-01-jan-year1.sql)

### Functions potentially existing in DB but not represented in repo
- get_challenge_today (called, not defined in repo)
- complete_day (called, not defined in repo)

## 4) Seed and SQL files

### SQL files inspected
- [supabase/seed/2026-01-jan-year1.sql](supabase/seed/2026-01-jan-year1.sql)
- [supabase/seed/README.md](supabase/seed/README.md)

### Match vs backend assumptions
- Partially aligned:
  - Seed aligns with reading_plans year/month model and plan_days structure.
  - Seed now includes checkins immersive progression columns.
- Not aligned:
  - reading_plans active flag name mismatch (is_active in seed vs active in API route).
  - No SQL for user_challenges table, profiles table, or required RPC function definitions used by API.

### Outdated/conflicting indicators
- Seed file includes schema alteration plus data seed in one file; this can blur migration vs seed responsibilities.
- Only January Year 1 plan data is seeded; no evidence of broader plan seed coverage.

## 5) Frontend status

### Pages currently implemented
- [app/page.tsx](app/page.tsx): static landing page with links; no data/API integration.
- [app/login/page.tsx](app/login/page.tsx): partially connected; Supabase OTP login flow client-side.
- [app/auth/callback/page.tsx](app/auth/callback/page.tsx): partially connected; checks current session and redirects, but no explicit server-side callback exchange logic in repo.
- [app/home/page.tsx](app/home/page.tsx): partially connected; reads session and logout only, no challenge/today/checkin integration.
- [app/docs/page.tsx](app/docs/page.tsx): functional docs shell page.
- [app/docs/SwaggerClient.tsx](app/docs/SwaggerClient.tsx): functional Swagger UI rendering /api/docs.
- [app/test-supabase/page.tsx](app/test-supabase/page.tsx): diagnostic/dev page for auth session status.

## 6) Risks (top 10)

1. High: reading_plans active flag drift (active vs is_active) can break start flow plan resolution.
2. High: required RPCs are called but not versioned/defined in repo SQL, making environments non-reproducible.
3. High: OpenAPI success schemas are unwrapped while handlers return wrapped data, causing client generation/runtime mismatch.
4. High: OpenAPI error schema expects string error, while handlers may return structured error objects.
5. Medium: missing explicit schema contract for checkins core columns beyond immersive fields can break complete_day assumptions.
6. Medium: profiles table is requested in product scope but has no repository usage/contract, creating hidden dependency risk.
7. Medium: user_challenges uniqueness/constraints are assumed by update-then-insert logic but not documented in SQL.
8. Medium: seed file mixes DDL and data seeding, increasing accidental drift across environments.
9. Medium: API docs omit common 500 responses that are implemented and tested, reducing observability for consumers.
10. Low: frontend pages are mostly auth/doc shells, so backend contract issues may remain unnoticed until feature rollout.

## 7) Recommended next action

Safest next step before immersive reading: establish a minimal, explicit schema contract and parity check first, then implement feature logic.

Recommended minimal sequence:
1. Freeze canonical column names for reading_plans active flag and align API + seed to one name.
2. Add repository SQL migrations for RPC definitions and any required tables/constraints already assumed by routes.
3. Align OpenAPI schemas with actual route payload wrappers and error object reality.
4. Re-run route tests and keep behavior stable before adding immersive-reading route changes.

This path is low-risk because it resolves contract drift first without changing route intent or test expectations.
