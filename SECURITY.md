# Security Policy

## Scope

Security-sensitive areas include Discord permissions, owner controls, blacklist enforcement, verification sessions, external URL fetching, scraper execution, media processing, SQLite state, environment variables, and the verification website.

## Reporting a vulnerability

Do not publish exploit details in a public issue.

Provide:

1. A concise description.
2. Reproduction steps.
3. Affected file or component.
4. Impact assessment.
5. Minimal proof of concept when safe.
6. Suggested mitigation when known.

Never include tokens, passwords, identity documents, or other secrets in the report.

## Secrets

Keep these outside Git:

- DISCORD_TOKEN
- BOT_OWNER_IDS
- CLIENT_ID
- GOOGLE_MAPS_API_KEY
- JKT48CONNECT_API_KEY
- Verification and infrastructure credentials
- External API credentials

Use .env.example only as a template.

## Owner controls

/setup, /settingbot, /blacklistserver, /blacklistusers, and /owner are owner-only at runtime.

Owners may be identified through BOT_OWNER_IDS or the Discord application owner returned by Discord.

Maintenance and emergency lockdown do not block owner recovery commands.

## Verification security model

Verification sessions contain a server identifier, user identifier, random session identifier, challenge hash, code hash, timestamps, attempt counter, and status.

The code is derived through HMAC-SHA-256 and is never stored in plaintext.

Verification codes expire and have an attempt limit. The website uses a honeypot field, request limits, no-store headers, and ticket-bound sessions.

The web human-interaction control is an in-house check and is not a third-party CAPTCHA provider.

## External URL security

Only HTTP and HTTPS URLs are accepted by media and scraper subsystems.

External requests use explicit timeouts, bounded retries, response validation, and size limits.

Do not add support for bypassing login walls, CAPTCHA challenges, paywalls, or anti-bot systems.

## Media execution

Media features can invoke yt-dlp, FFmpeg, Python, Demucs, rembg, Pillow, and OpenCV.

Command arguments must remain arrays. Do not build shell fragments from untrusted input.

## Database security

Use parameterized SQL for user input.

Do not commit production SQLite files containing user data.

## Audit and monitoring

The data audit pipeline checks configured databases every 10 seconds.

When a database field contains a URL, the system checks URL health, matches the URL against the scraper registry, records status, and suggests an adapter method when no scraper is configured.

## Incident response

1. Enable bot maintenance mode.
2. Enable emergency lockdown when public commands must stop.
3. Review owner audit logs and security incidents.
4. Disable or blacklist affected users or servers.
5. Rotate exposed secrets.
6. Re-run tests and scraper audits.
7. Record the incident and mitigation.

## Non-goals

The bot is not designed to bypass authentication, CAPTCHA, paywalls, platform anti-bot controls, or credential protections.
