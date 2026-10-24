# JKT48 Website & Bot — Feature Completion Plan

This plan applies to **Nararya Bot Discord + JKT48 Center**. The target is a JKT48 community assistant inspired by the usefulness and breadth of community tools such as Teras48, while keeping original branding, implementation, and content. It does not apply to APKForge or an APK editor.

## Verified project scope
- Website: website/jkt48/
- Discord runtime: src/
- Member website source: public AllMember.json and ActiveMember.json from FrenzY8/JKT48-Member
- Existing automated checks: npm run test:all, npm run check:website
- README documents local registration/login, HTTP-only sessions, Google OAuth PKCE, account settings, theme/timezone, and 10 languages.
- Existing feature registry documents member generations 1–14, upcoming/latest, feed health, event/birthday/graduation/theater reminders, live notifications, quiz, gacha, cards, and leaderboards.

## Teras48-inspired product direction
Build toward a reliable, information-rich JKT48 Discord bot and companion website. This is a feature direction, not a claim that every item already exists or that Teras48's private implementation is known.

- **Member directory:** member profiles, generations, active/former status, search, birthdays, anniversaries, graduation history when reliably sourced.
- **News and activity feeds:** official announcements, theater/event schedules, live streams, social posts and video updates, each with source links and source timestamps.
- **Personal notifications:** opt-in reminders for birthdays, theater/events, livestreams and new announcements; user/server timezone settings; per-channel preferences; deduplication and cooldowns.
- **Community interactions:** useful slash-command help, quizzes, member cards, gacha/collection and leaderboards with abuse limits and transparent rules.
- **Website companion:** mobile-first member pages, latest feed, source-health indicators, accessible controls, language support and consistent command documentation.
- **AI assistant:** answer questions from retrieved, attributable JKT48 sources; show source links and retrieval time; say when data is unavailable or stale; never invent schedules, members, prices or event status. Use a server-side provider/API key, rate limits, usage limits and privacy-safe logging. AI must not be advertised as live until the provider and retrieval pipeline are configured and tested.
- **Official commerce only if needed:** if a legitimate shop is in scope, use a configured payment provider, verified server-side webhooks, durable transaction IDs, expiry of at least 10 minutes, and WhatsApp notifications only after payment verification. Never pretend QRIS or WhatsApp payment confirmation is active without credentials and end-to-end tests.

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
- [ ] Compare user-facing capabilities against the Teras48-inspired direction above; implement incrementally and do not copy proprietary code, branding, or assets.

### P2 — AI, account and accessibility
- [ ] Implement AI only behind a server-side provider integration, source retrieval, rate limits, and clear unavailable/stale responses.
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

## Automated update and release flow
- Existing GitHub Actions workflows run validation/tests on pushes and pull requests; the JKT48 website workflow builds and uploads a static artifact when relevant website files change.
- A new feature is included in deployment only after its code is committed and pushed. CI can test/build commits, but it cannot safely invent and commit unspecified features on its own.
- For each feature: make a focused change, add regression tests, commit it, wait for CI, fix failures, and deploy only after success. Use scheduled refresh jobs or webhooks for data freshness where upstream services permit; a new Git commit is not a substitute for live data synchronization.
- [ ] Verify CI workflow coverage includes bot runtime changes, website changes, and tests.
- [ ] Verify deployment target and public URL, then capture a real screenshot from the deployed build before reporting visual QA complete.

## Release acceptance
A feature is complete only when its implementation, automated tests, responsive UI, failure states, and required configuration are verified. A successful build alone does not prove upstream feeds, Discord interactions, OAuth, AI, or payment integrations work in production.

## Configuration-dependent integrations
Live Discord behavior requires valid Discord credentials and a running bot. Google OAuth requires matching Google OAuth client configuration. AI requires an active server-side model provider and retrieval pipeline. Third-party data availability depends on upstream services and their access policies. Payment and WhatsApp integrations must not be shown as active until their providers and server-side verification are configured.
