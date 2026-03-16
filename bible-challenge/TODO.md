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
- [ ] Replace `reading_plans.active` usage with `reading_plans.is_active` in app/API queries.
- [ ] Keep/confirm `user_challenges.active` assumption consistently across app/API/tests.
- [ ] Ensure `/api/challenge/today` keeps one stable response shape used by home + reading.

### 1.2 Anonymous start
- [ ] Add guest identity helper (`device_id`) stored client-side.
- [ ] Add server utility to resolve guest context from request.
- [ ] Make start flow usable without mandatory login.

### 1.3 Onboarding
- [ ] Ensure `/app/onboarding` works for guest and authenticated users.
- [ ] Keep choices: start day 1 or resume from chosen day.
- [ ] Keep failures friendly and recoverable.

### 1.4 Home
- [ ] Ensure `/app/home` loads challenge summary in guest mode and auth mode.
- [ ] Show clear CTA to reading/challenge/profile.
- [ ] Keep fallback if no challenge exists yet.

### 1.5 Reading entry
- [ ] Keep one canonical route for reading (`/app/reading`).
- [ ] Mark duplicate reading route as temporary compatibility path.

### 1.6 Profile
- [ ] Keep profile page accessible without forcing identity completion.
- [ ] Show guest status + optional completion CTA.

## Phase 2 — Immersive reading engine (P0)

### 2.1 Verse blocks
- [ ] Render passage as progressive blocks (default 3 verses/step).
- [ ] Ensure no hardcoded Bible text in frontend.

### 2.2 Step progression
- [ ] Track and display step progress (`current_step`, `total_steps`).
- [ ] Show `verses_done / total_verses` and progress bar.
- [ ] Resume reading from last saved step when available.

### 2.3 Checkin integration
- [ ] Integrate reading progression with `POST /api/challenge/checkin` incrementally.
- [ ] Keep existing checkin route behavior stable where already working.
- [ ] Add/adjust tests for progression + checkin compatibility.

## Phase 3 — Daily verse (P0)

### 3.1 API route
- [ ] Create `GET /api/daily-verse` returning `{ data: ... }`.

### 3.2 UI page
- [ ] Add minimal daily verse UI (home block or dedicated page).
- [ ] Keep mobile-first and simple.

### 3.3 DB fallback
- [ ] Read from `daily_verse` table first; provide safe fallback when empty.
- [ ] Add route tests for success/fallback/error.

## Phase 4 — Bible content integration (P1)

### 4.1 Backend adapter for `bible_available_api`
- [ ] Add backend adapter/service for passage retrieval.
- [ ] Normalize returned reference/verses format for app APIs.
- [ ] Add timeout/retry/error handling.

### 4.2 Caching
- [ ] Cache useful passage data in DB to reduce repeated external calls.
- [ ] Keep cache strategy simple for MVP (daily/plan-day level).

## Phase 5 — Leaderboard (P1)

### 5.1 Leaderboard API
- [ ] Add minimal monthly/global leaderboard endpoints.
- [ ] Exclude users without optional identity from ranking visibility.

### 5.2 Leaderboard UI
- [ ] Add simple leaderboard page (mobile-first list, no advanced filters).

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
- [ ] Phase 1: update only impacted API tests (no broad rewrite).
- [ ] Phase 2: add reading progression tests for step/checkin flow.
- [ ] Phase 3: add `/api/daily-verse` tests.
- [ ] Phases 4-8: add focused tests per new route/feature only.
