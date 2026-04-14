/**
 * Single source of truth for verified challenger eligibility.
 * Rule: email confirmed + phone present + location present.
 * Used by profile API, leaderboard, and rewards routes.
 */
export function isVerifiedChallenger(profile: {
  email_verified?: unknown;
  phone?: unknown;
  location?: unknown;
}): boolean {
  const phone = typeof profile.phone === "string" ? profile.phone.trim() : "";
  const location = typeof profile.location === "string" ? profile.location.trim() : "";
  return profile.email_verified === true && phone.length > 0 && location.length > 0;
}
