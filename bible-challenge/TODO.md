# Bible Challenge — MVP TODO (Product-Priority Plan)

Aligned with:
- `docs/database-current-state.md`
- `docs/copilot-project-context.md`
- `docs/cahierdecharge.md`

Rule of execution:
- Keep changes incremental and safe.
- Preserve working routes/tests whenever possible.
- Prefer repo SQL/migrations over ad hoc SQL Editor updates.

## Phase 1 — Core user flow (P0)

### 1.1 Minimal repository alignment (only what blocks flow)
- [x] Replace `reading_plans.active` usage with `reading_plans.is_active` in app/API queries.
- [x] Keep/confirm `user_challenges.active` assumption consistently across app/API/tests.
- [x] Ensure `/api/challenge/today` keeps one stable response shape used by home + reading.

### 1.2 Anonymous start
- [x] Add guest identity helper (`device_id`) stored client-side.
- [x] Add server utility to resolve guest context from request.
- [x] Make start flow usable without mandatory login.

### 1.3 Onboarding
- [x] Ensure `/app/onboarding` works for guest and authenticated users.
- [x] Keep choices: start day 1 or resume from chosen day.
- [x] Keep failures friendly and recoverable.

### 1.4 Home
- [x] Ensure `/app/home` loads challenge summary in guest mode and auth mode.
- [x] Show clear CTA to reading/challenge/profile.
- [x] Keep fallback if no challenge exists yet.

### 1.5 Reading entry
- [x] Keep one canonical route for reading (`/app/reading`).
- [x] Mark duplicate reading route as temporary compatibility path.

### 1.6 Profile
- [x] Keep profile page accessible without forcing identity completion.
- [x] Show guest status + optional completion CTA.

## Phase 2 — Immersive reading engine (P0)

### 2.1 Verse blocks
- [x] Render passage as progressive blocks (default 3 verses/step).
- [x] Ensure no hardcoded Bible text in frontend.

### 2.2 Step progression
- [x] Track and display step progress (`current_step`, `total_steps`).
- [x] Show `verses_done / total_verses` and progress bar.
- [x] Resume reading from last saved step when available.

### 2.3 Checkin integration
- [x] Integrate reading progression with `POST /api/challenge/checkin` incrementally.
- [x] Keep existing checkin route behavior stable where already working.
- [x] Add/adjust tests for progression + checkin compatibility.

## Phase 3 — Daily verse (P0)

### 3.1 API route
- [x] Create `GET /api/daily-verse` returning `{ data: ... }`.

### 3.2 UI page
- [x] Add minimal daily verse UI (home block or dedicated page).
- [x] Keep mobile-first and simple.

### 3.3 DB fallback
- [x] Read from `daily_verse` table first; provide safe fallback when empty.
- [x] Add route tests for success/fallback/error.

## Phase 4 — Bible content integration (P1)

### 4.1 Backend adapter for `bible_available_api`
- [x] Add backend adapter/service for passage retrieval.
- [x] Normalize returned reference/verses format for app APIs.
- [x] Add timeout/retry/error handling.

### 4.2 Caching
- [x] Cache useful passage data in DB to reduce repeated external calls.
- [x] Keep cache strategy simple for MVP (daily/plan-day level).

## Phase 5 — Leaderboard (P1)

### 5.1 Leaderboard API
- [x] Add minimal monthly/global leaderboard endpoints.
- [x] Exclude users without optional identity from ranking visibility.

### 5.2 Leaderboard UI
- [x] Add simple leaderboard page (mobile-first list, no advanced filters).

## Phase 6 — Optional identity (username + phone) (P1)

### 6.1 Profile completion
- [ ] Add optional `username` + `phone` fields on profile.
- [ ] Save without blocking reading progression.

### 6.2 Eligibility flagging
- [ ] Expose whether user is eligible for leaderboard/rewards.

## Phase 7 — Rewards (P2)

### 7.1 Eligibility logic
- [ ] Add minimal reward eligibility rules (identity complete + ranking criteria).

### 7.2 Reward ops support
- [ ] Add admin-oriented query/export path for monthly winners.

## Phase 8 — Notifications (P2)

### 8.1 Notification logs
- [ ] Add writer for reminder/encouragement/reconnect events.
- [ ] Ensure `notification_logs` writes are safe and idempotent enough for MVP.

### 8.2 Notification flow
- [ ] Add basic docs for trigger timing and message templates.

## Minimal testing checklist by phase
- [x] Phase 1: update only impacted API tests (no broad rewrite).
- [x] Phase 2: add reading progression tests for step/checkin flow.
- [x] Phase 3: add `/api/daily-verse` tests.
- [x] Phases 4-8: add focused tests per new route/feature only.
