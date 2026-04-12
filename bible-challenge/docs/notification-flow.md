# Notification Flow (MVP)

## Objective
Provide a minimal, safe flow for writing notification events with basic idempotency.

## Route
- POST /api/notifications/log

## Supported notification types
- reminder
- encouragement
- reconnect

## Request body
- type: string (required)
- userId: string (optional, defaults to current session user)
- sentAt: ISO date string (optional, defaults to now)
- idempotencyKey: string (optional)
- meta: object (optional)

## Idempotency behavior
When idempotencyKey is provided, the API checks for an existing log with:
- same user_id
- same type
- meta.idempotency_key matching the provided key

If found, it returns the existing log id with deduplicated=true.

## Typical trigger timing
- reminder: once per day if user has not checked in by evening
- encouragement: after 2-3 consecutive successful check-ins
- reconnect: after a configurable inactivity window (for MVP: 3 days)

## Message template examples
- reminder: "Ton passage du jour t'attend. Prends 5 minutes maintenant."
- encouragement: "Super constance! Continue, tu es sur une bonne serie."
- reconnect: "On est heureux de te revoir. Reprends ou tu t'etais arrete."

## Operational notes
- Keep writes lightweight and asynchronous when possible.
- Keep metadata small (channel, campaign key, delivery context).
- Avoid hard failure in user journeys if log writing fails.
