# AUTH-REFACTOR-TODO — Bible Challenge

Product philosophy: reading-first, zero-friction, rewards/leaderboard as optional upgrade.
Source of truth: docs/cahierdecharge.md, docs/copilot-project-context.md

---

## Phase 1 — Audit and alignment ✅ (done)

### 1.1 — Auth mismatch report
- Priority: P0
- Status: ✅ done (see last Copilot session)
- Files: docs/copilot-project-context.md, docs/database-current-state.md
- Description: Identified all mismatches between current OTP-only flow and target
  email+password basic account with optional verification upgrade.
  Key finding: OTP must be kept only as the email verification step (Phase C),
  not as the primary login mechanism.

### 1.2 — Additive DB migration for verification fields
- Priority: P0
- Status: ✅ done
- Files: supabase/migrations/0005_profile_verification_fields.sql
- Description: Added location, email_verified, leaderboard_eligible, reward_eligible,
  verification_completed_at to profiles. All nullable/default false, no behavioral change.

### 1.3 — Profile API extended with new fields
- Priority: P0
- Status: ✅ done
- Files: app/api/profile/route.ts, app/api/profile/route.test.ts, src/lib/openapi.ts
- Description: ProfilePayload now returns location and emailVerified. Select query updated.
  Eligibility logic (username+phone) unchanged for now.

---

## Phase 2 — Basic account: email + password flow

Auth model for this phase:
- Credential: email + password (Supabase signUp / signInWithPassword)
- Username: captured at signup, stored in profiles table only (not used as auth credential)
- OTP: removed from primary login. Reserved exclusively for email verification (Phase 3).
- Guest flow: untouched.

### 2.1 — Replace OTP login with email+password signup form
- Priority: P1
- Depends on: nothing
- Status: ✅ done
- Files:
  - app/login/page.tsx
- Description: Replace the current signInWithOtp form with two distinct sections:
  "Créer un compte" — fields: username, email, password → supabase.auth.signUp({ email, password }).
  After successful signUp, save username via PUT /api/profile (task 2.3).
  Email verification is NOT required to complete signup — it unlocks challenger tier later.
- Note: Remove signInWithOtp entirely from this page. OTP link is only surfaced in profile page
  once the user is logged in (task 3.2).

### 2.2 — Add email+password login section
- Priority: P1
- Depends on: 2.1
- Status: ✅ done
- Files:
  - app/login/page.tsx
- Description: Add "Se connecter" section below signup with email + password fields.
  Call supabase.auth.signInWithPassword({ email, password }).
  On success redirect to /app/home (or ?next= param if present).
  On error show inline message (wrong credentials, email not confirmed, etc.).

### 2.3 — Persist username to profile on first signup
- Priority: P1
- Depends on: 2.1, 2.4
- Status: ✅ done
- Files:
  - app/login/page.tsx (signup submit handler)
  - app/api/profile/route.ts (PUT)
- Description: Immediately after supabase.auth.signUp() succeeds, call PUT /api/profile
  with { username } to store it. The handle_new_user trigger (task 2.4) creates the empty
  profile row; this PUT patches username onto it.
  Username is a display name only — it is not an auth credential.
- Note: do not persist username through the callback page; do it inline in the signup handler
  while the new session is active.

### 2.4 — Add handle_new_user trigger to migrations
- Priority: P1
- Depends on: nothing
- Status: ✅ done
- Files:
  - supabase/migrations/0006_handle_new_user_trigger.sql (new)
- Description: Create trigger on auth.users INSERT that inserts a row into public.profiles
  with id = new.id. Referenced in docs/database-current-state.md but missing from repo.
  Ensures profile row always exists after auth user creation.

### 2.5 — Update auth callback routing for email confirmation
- Priority: P1
- Depends on: 2.1
- Status: ✅ done (no code change required)
- Files:
  - app/auth/callback/page.tsx
- Description: Current callback handles OTP token_hash and code exchange. After switching
  to email+password, the callback will receive the email confirmation link from Supabase
  (sent automatically on signUp). It already handles exchangeCodeForSession — this still works.
  Ensure routing logic holds: missing active challenge → /app/onboarding, else → /app/home.
  Remove any OTP signInWithOtp reference from callback; keep verifyOtp only for the
  email verification upgrade path (task 3.3).

---

## Phase 3 — Optional email verification (OTP upgrade)

Scope: OTP is used ONLY in this phase, as an opt-in verification step after login.
It is NOT used for primary authentication.

### 3.1 — Add email verification prompt in profile page
- Priority: P2
- Depends on: 2.1, 2.3
- Status: ✅ done
- Files:
  - app/app/profile/page.tsx
- Description: If emailVerified === false, show a non-blocking banner:
  "Vérifie ton email pour débloquer le classement → Renvoyer le lien".
  Must not block reading or any other action. Banner only visible when authenticated.

### 3.2 — Send email verification link from profile
- Priority: P2
- Depends on: 3.1
- Status: ✅ done
- Files:
  - app/app/profile/page.tsx
- Description: When user clicks "Renvoyer le lien", call
  supabase.auth.resend({ type: 'signup', email: session.user.email }).
  This sends a confirmation link (not an OTP code). On click, Supabase redirects
  to /auth/callback with a code param → exchangeCodeForSession handles it.
  Do NOT use signInWithOtp here — that would replace the session mechanism.

### 3.3 — Sync email_verified flag after confirmation
- Priority: P2
- Depends on: 3.2
- Status: ✅ done
- Files:
  - app/auth/callback/page.tsx
  - app/api/profile/route.ts (PUT)
- Description: After exchangeCodeForSession succeeds, check session.user.email_confirmed_at.
  If non-null, call PUT /api/profile with { emailVerified: true } — or better, set it
  server-side by reading auth metadata. Update profile.email_verified = true.
  This bridges Supabase auth state into the profiles table.

---

## Phase 4 — Optional phone + location completion

### 4.1 — Add phone input to profile form
- Priority: P2
- Depends on: 1.2 (column exists)
- Status: ✅ done
- Files:
  - app/app/profile/page.tsx
- Description: Phone field already exists in the form. Verify it saves correctly via
  PUT /api/profile. Add a hint: "Requis pour recevoir les récompenses Mobile Money".

### 4.2 — Add location input to profile form
- Priority: P2
- Depends on: 1.2 (column exists)
- Status: ✅ done
- Files:
  - app/app/profile/page.tsx
  - app/api/profile/route.ts (PUT)
- Description: Add location field to the form. Update PUT handler to accept and save location.
  Currently location is read-only in the API (not writable via PUT).
  Files: app/api/profile/route.ts — add location to updateData, add validation (max 100 chars).

### 4.3 — Update profile API PUT to accept location
- Priority: P2
- Depends on: 4.2
- Status: ✅ done
- Files:
  - app/api/profile/route.ts
  - app/api/profile/route.test.ts
- Description: Extend PUT body validation to accept optional location string. Save to DB.
  Add test: PUT with location value → response includes location.

---

## Phase 5 — Reward/leaderboard eligibility logic

### 5.1 — Centralize eligibility function
- Priority: P2
- Depends on: 4.3, 3.3
- Status: ✅ done
- Files:
  - app/api/profile/route.ts
  - app/api/leaderboard/route.ts
  - app/api/rewards/winners/route.ts
- Description: All three files currently duplicate username+phone eligibility check.
  Extract to lib/challenger/eligibility.ts with a single isVerifiedChallenger() function.
  New rule: eligible = email_verified AND phone present AND location present.

### 5.2 — Switch eligibility in leaderboard route
- Priority: P2
- Depends on: 5.1
- Status: ✅ done
- Files:
  - app/api/leaderboard/route.ts
  - app/api/leaderboard/route.test.ts
- Description: Replace isEligibleProfile() call with isVerifiedChallenger() from shared lib.
  Update tests to use the new verified challenger fixture (email_verified=true, phone, location).

### 5.3 — Switch eligibility in rewards/winners route
- Priority: P2
- Depends on: 5.1
- Status: ✅ done
- Files:
  - app/api/rewards/winners/route.ts
  - app/api/rewards/winners/route.test.ts
- Description: Replace isIdentityComplete() call with isVerifiedChallenger() from shared lib.
  Update tests accordingly. Verified challenger badge now gates reward distribution.

### 5.4 — Surface eligibility status in profile UI
- Priority: P3
- Depends on: 5.1, 5.3
- Status: ✅ done
- Files:
  - app/app/profile/page.tsx
- Description: Replace binary "Eligible classement: Oui/Non" with a checklist showing
  which steps remain (email verified / phone added / location added). Each uncompleted
  step links to the relevant action. No access restriction added.

### 5.5 — Wire leaderboard_eligible / reward_eligible DB columns
- Priority: P3
- Depends on: 5.1
- Status: ✅ done
- Files:
  - app/api/profile/route.ts (PUT)
  - supabase/migrations/ (new migration or RPC)
- Description: After verification is complete, update leaderboard_eligible and reward_eligible
  columns to true. Currently these columns exist but are not written by app logic.
  Approach: update in PUT /api/profile whenever all conditions are met, or via DB trigger.

---

## Phase 6 — Tests and cleanup

### 6.1 — Add tests for signup and login
- Priority: P3
- Depends on: 2.1, 2.2
- Status: ✅ done
- Files:
  - app/login/page.test.ts (new)
- Description: Test signup form (username+email+password), login form (email+password),
  error states (wrong credentials, missing fields). Mock supabase.auth.signUp and
  supabase.auth.signInWithPassword. No OTP mock needed in this test file.

### 6.2 — Add test for auth callback with email_verified sync
- Priority: P3
- Depends on: 3.3
- Status: ✅ done
- Files:
  - app/auth/callback/page.test.ts (new)
- Description: Test callback behavior after exchangeCodeForSession.
  Case A: email_confirmed_at present → profile email_verified set to true, routed to home.
  Case B: email_confirmed_at absent → routed correctly without setting verification flag.
  Mock supabase.auth.exchangeCodeForSession and PUT /api/profile.

### 6.3 — Update OpenAPI schema for profile PUT (location)
- Priority: P3
- Depends on: 4.3
- Status: ✅ done
- Files:
  - src/lib/openapi.ts
- Description: Add location to UpdateProfileRequest properties.

### 6.4 — Remove legacy app/home/page.tsx redirect
- Priority: P3
- Depends on: nothing
- Status: ✅ kept as harmless permanent redirect
- Files:
  - app/home/page.tsx
- Description: Current file just redirects to /app/home. Either remove or keep as permanent
  redirect. Currently harmless but dead code.

### 6.5 — Remove test-supabase debug page
- Priority: P3
- Depends on: nothing
- Status: ✅ done — app/test-supabase/ supprimé
- Files:
  - app/test-supabase/page.tsx
- Description: Debug page exposing session state. Should be removed before any public release.

### 6.6 — Full vitest run after each phase
- Priority: P0 (ongoing)
- Depends on: each phase completion
- Status: ✅ done — 65 passed, 0 failed, 13 fichiers
- Files: all test files
- Description: Run npx vitest run after every phase. Target: 0 failed at all times.
  Current baseline: 38 passed (post phase 1).
