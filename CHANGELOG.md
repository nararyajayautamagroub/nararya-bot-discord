# Changelog

All notable changes to this project are documented here.

## [1.6.0] - 2026-09-19

### Game
- Added Google Street View photo guessing mode.
- Added a 10-second per-user/server cooldown shared by guessing games and gacha.
- Added automatic one-minute timeout for unanswered guesses.
- Timed-out guesses are recorded as failed attempts and reset the quiz streak.

### Indonesia
- Added `/news` for Indonesian news categories.
- Added `/market stock` and `/market ihsg`.
- Added `/prices fuel`, `/prices electricity`, `/prices food`, and `/prices all`.
- Added 15-minute background refresh for public Indonesia data with longer per-source caches.
- Added city-based imsakiyah retrieval for Ramadan.

### Ramadan
- Added `/ramadan upcoming`.
- Added `/ramadan today city:<city>`.
- Added `/ramadan setup`, `/ramadan disable`, and `/ramadan test`.
- Added scheduled sahur reminders 30 minutes before imsak.
- Added scheduled iftar reminders at Maghrib.
- Added environment overrides for official Ramadan date announcements.

### Configuration
- Added `GOOGLE_MAPS_API_KEY`.
- Added `BOT_TIMEZONE`.
- Added data-source and Ramadan override environment variables.

## [1.5.0] - 2026-09-19

### Added
- Web verification flow with an “I’m not a robot” checkbox.
- 4-character server-bound verification codes with one-time redemption and expiry.
- Optional automatic verified role assignment.
- `/verify` commands for start, code, status, and role configuration.
- `/bot` commands for info, feature registry, and health.
- `src/config/features.js` centralized feature registry.
- `SECURITY.md` and verification documentation.
- Developer HTTP endpoints for verification health and feature discovery.

### Security
- Verification codes are stored only as hashes.
- Each Discord server receives its own random secret.
- Verification sessions have attempt limits and expiry.
- Verification tickets are random and user/server bound.

## [1.4.0] - 2026-09-19

### Added
- Dedicated media subsystem for video, audio, image, vocal separation, background removal, watermark removal, resolution controls, and per-user media settings.

## [1.3.0] - 2026-09-19

### Added
- Modern Discord slash-command namespaces.
- JKT48 member synchronization for generations 1-14.
- Separate JKT48 game databases for quiz, gacha, and cards.
- JKT48 card collection system.
- Seven card rarities from Common through Secret.
- Persistent quiz sessions, attempts, streaks, and leaderboard data.

## [1.2.0]
- Previous JKT48 feed/live integration baseline.

## [1.0.0]
- Initial modular Discord bot foundation.

[1.6.0]: https://github.com/nararyajayautamagroub/nararya-bot-discord/releases/tag/v1.6.0
[1.5.0]: https://github.com/nararyajayautamagroub/nararya-bot-discord/releases/tag/v1.5.0
[1.4.0]: https://github.com/nararyajayautamagroub/nararya-bot-discord/releases/tag/v1.4.0
[1.3.0]: https://github.com/nararyajayautamagroub/nararya-bot-discord/releases/tag/v1.3.0
