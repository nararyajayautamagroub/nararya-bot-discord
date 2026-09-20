# Changelog

## 3.2.0 - 2026-09-20

- Added shared web gateway controls for request IDs, rate limiting, origin validation, body limits, and security headers.
- Added versioned /api/v1 routes with backward-compatible /api routes.
- Added modular frontend API and responsive device runtime modules.
- Added readiness health endpoint and graceful shutdown handling.
- Hardened CI so clean npm install runs without a lockfile-dependent cache requirement.
- Added gateway, web-server, scraper, package-contract, and responsive frontend regression tests.

## 3.1.0 - 2026-09-20

- Added unified responsive website runtime.
- Added local registration and login with scrypt password hashing.
- Added Google OAuth 2.0 login with PKCE and state validation.
- Added secure web sessions, logout, password change, language, theme, and timezone settings.
- Added ten-language website localization foundation.
- Unified the verification web flow under the website runtime.


## 3.0.0 - 2026-09-20

- Hardened scraper HTTP handling and removed an undeclared runtime dependency.
- Added repository integrity validation for required files, versions, imports, and token patterns.
- Strengthened CI and JKT48 website build validation.
- Aligned package and release metadata.


## 2.2.0 - 2026-09-20

- Enforced a date-keyed limit of 10 JKT48 gacha pulls per user per day.
- Added a date-keyed limit of 10 JKT48 and Street View quiz sessions per user per day.
- Added generation 14 seed data and official SHOWROOM and IDN Live profile references.
- Added scraper-backed live detection for configured IDN, SHOWROOM, YouTube, Instagram, and TikTok sources.
- Added database fallbacks for JKT48 upcoming/latest commands when JKT48Connect is unavailable.
- Kept the Ticket Bot as a separate runtime and database.


## 2.1.2 - 2026-09-20

### Tooling

- Added centralized shared tooling in src/tools/toolbox.js.
- Added resilient HTTP tooling in src/tools/http-client.js.
- Added source-health helpers and retry handling.
- Added repository structure and security documentation updates.

### Restaurant price system

- Added /restaurantprices.
- Added city restaurant discovery.
- Added menu parsing.
- Added category and price filtering.
- Added pagination and cache handling.
- Added restaurant source health.
- Registered MenuKuliner.net in the scraper registry.
- Added parser tests.

### Media

- Standardized video, audio, and image download handling.
- Documented broad public URL support through yt-dlp.
- Documented vocal separation, background removal, watermark removal, and resolution selection.
- Added isolated job storage and size limits.

### Verification

- Added verification web rate limiting.
- Maintained server-bound HMAC code generation.
- Documented the verification website and API lifecycle.

### Registry

- Synchronized the canonical active feature count to 150.

## 2.0.0 - 2026-09-20

- Added owner controls.
- Added server and user blacklists.
- Added maintenance mode and emergency lockdown.
- Added security incident tracking.
- Added EXP profile cards.
- Added Discord Playing status rotation.
- Added extended community and game features.

## 1.9.0 - 2026-09-19

- Added persistent bot settings.
- Added owner-only setup.
- Added server and user blacklist enforcement.

## 1.8.0 - 2026-09-19

- Added help, setup, and electronics price features.

## 1.7.0 - 2026-09-19

- Added scraper registry and database audit.
- Added disaster monitoring.
- Added disaster notifications.
