# Verification System

## Discord commands

- /verify start
- /verify code
- /verify status
- /verify role

## Session lifecycle

A verification session stores:

- session identifier
- guild identifier
- user identifier
- challenge hash
- code hash
- issue time
- expiry time
- attempt counter
- status

Only the code hash is stored.

## Code generation

Each Discord guild receives a unique random secret.

The code is derived with HMAC-SHA-256 from the guild secret and the current session identifier.

This makes a code server-bound and session-specific.

## Website flow

1. User runs /verify start.
2. Bot returns a private verification URL.
3. Website loads the ticket.
4. Website displays the server and user identifiers.
5. User completes the "I'm not a robot" interaction.
6. Website submits the ticket and challenge.
7. Verification service returns the short-lived code.
8. User runs /verify code.
9. Bot validates the code and optionally assigns the configured role.

## Endpoints

- GET /health
- GET /api/verify/session
- POST /api/verify/complete
- GET /api/features
- GET /verify
- GET /verify/app.js
- GET /verify/style.css

## Security controls

- Expiration.
- Attempt limit.
- Ticket-bound challenge.
- Honeypot input.
- Request rate limiting.
- No-store responses.
- Optional role assignment after code validation.

The human-interaction control is an in-house check and is not a third-party CAPTCHA service.

## Configuration

~~~
VERIFY_WEB_HOST=0.0.0.0
VERIFY_WEB_PORT=3000
VERIFY_WEB_BASE_URL=http://localhost:3000
VERIFY_CODE_LENGTH=4
VERIFY_TTL_SECONDS=600
VERIFY_MAX_ATTEMPTS=5
~~~
