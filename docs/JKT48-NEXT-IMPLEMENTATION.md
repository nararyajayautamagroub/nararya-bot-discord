# JKT48 Website & Bot — Feature Completion Plan

This plan applies to **Nararya Bot Discord + JKT48 Center**. It does not apply to APKForge or an APK editor.

## Verified project scope
- Website: website/jkt48/
- Discord runtime: src/
- Member website source: public AllMember.json and ActiveMember.json from FrenzY8/JKT48-Member
- Existing automated checks: npm run test:all, npm run check:website
- README documents local registration/login, HTTP-only sessions, Google OAuth PKCE, account settings, theme/timezone, and 10 languages.
- Existing feature registry documents member generations 1–14, upcoming/latest, feed health, event/birthday/graduation/theater reminders, live notifications, quiz, gacha, cards, and leaderboards.

## Completion checklist

### P0 — Correctness, security, reliability
- [ ] Run the complete test suite and record the actual CI result before calling a release complete.
- [ ] Verify every website form has loading, success, failure, and retry states.
- [ ] Verify auth/session cookies, CSRF protection for state-changing requests, rate limits, password reset, and account deletion behavior.
- [ ] Verify authorization for owner-only bot commands and all account-specific API endpoints.
- [ ] Ensure external feed failures show stale/unavailable status instead of fabricated or silently outdated data.
- [ ] Add tests for malformed API responses, timeouts, rate limits, duplicate notifications, and unavailable upstream sources.
- [ ] Ensure logs redact credentials, session tokens, email addresses, and other sensitive values.

### P1 — JKT48 data experience
- [ ] Add a visible last-updated timestamp per data source and a clear stale-data indicator.
- [ ] Add filters for member generation/status and robust search by name/nickname.
- [ ] Verify event/theater/news/live feeds use source timestamps, deduplicate reposts, and display original source links.
- [ ] Add timezone-aware reminders with user/server preferences and duplicate-reminder prevention.
- [ ] Add a source status page showing availability, last successful sync, and last error without exposing secrets.
- [ ] Test empty states and mobile layout for all feed and member sections.

### P1 — Bot and website parity
- [ ] Ensure website command documentation is generated from or tested against registered Discord commands.
- [ ] Add examples, required permissions, cooldowns, and usage errors to command help.
- [ ] Verify /feed health, /feed list, /feed test, and feed setup permissions end-to-end.
- [ ] Verify notification destination configuration survives restart and supports a safe test message.
- [ ] Add regression tests for member synchronization, event reminders, live start/end transitions, quiz timeout, and gacha limits.

### P2 — Account and accessibility
- [ ] Verify keyboard navigation, visible focus, contrast, reduced-motion support, semantic headings, and accessible dialog labels.
- [ ] Test all 10 interface languages for missing translation keys and layout overflow.
- [ ] Add session/device management and clear account security notices if supported by the backend.
- [ ] Ensure privacy notice explains what account data is stored and how users can request deletion.

### P2 — Optional commerce (only if explicitly part of the product)
- [ ] Define the products and legal seller/operator before implementing checkout.
- [ ] Use a legitimate payment gateway with server-side webhook signature verification; never mark an order paid from a browser redirect alone.
- [ ] Generate unique order/transaction IDs, store order status durably, and expire unpaid orders after at least 10 minutes.
- [ ] Send WhatsApp confirmations only after verified payment state changes, using configured provider credentials.
- [ ] Do not collect or store raw payment credentials or expose gateway secrets in frontend code.

## Release acceptance
A feature is complete only when its implementation, automated tests, responsive UI, failure states, and required configuration are verified. A successful build alone does not prove upstream feeds, Discord interactions, OAuth, or payment integrations work in production.

## Configuration-dependent integrations
Live Discord behavior requires valid Discord credentials and a running bot. Google OAuth requires matching Google OAuth client configuration. Third-party data availability depends on upstream services and their access policies. Payment and WhatsApp integrations must not be shown as active until their providers and server-side verification are configured.
