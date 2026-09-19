# Changelog

All notable changes to this project are documented here.

## [1.7.0] - 2026-09-19

### Scraper and Data Integrity
- Added a centralized scraper registry for external data sources.
- Added a database audit pipeline that runs every 10 seconds.
- Database audit scans the main DB, media DB, and separate JKT48 quiz/gacha/cards DBs.
- Stored URLs are revalidated and matched against the scraper registry.
- Unknown external URLs are marked `missing_scraper`.
- Invalid URLs and failed URL checks are recorded with error details.
- Unknown sources receive a suggested adapter method.
- JKT48 repository/source URLs remain exempt from the generic scraper requirement.
- Registered news feeds perform a full background refresh every 24 hours while command requests can refresh their own short-lived cache.

### General Game
- Moved Google Street View game into the generic game namespace.
- Street View is no longer a JKT48-specific mode.
- Street View questions are delivered as direct attachments so API keys are not exposed in Discord messages.
- Game status now reads the dedicated quiz database correctly.

### Disaster Monitoring
- Added BMKG earthquake and tsunami monitoring.
- Added BNPB GIS disaster-event monitoring.
- Added MAGMA/ESDM volcano-source monitoring.
- Added location-aware disaster records.
- Added optional per-server disaster notifications with a minimum earthquake magnitude filter.

### Developer and Status Commands
- Added `/game status`.
- Added `/status system`.
- Added `/status scrapers`.
- Added `/status data`.
- Added `/status disasters`.
- Added `/status sources`.
- Added `/disaster status`.
- Added `/disaster latest`.
- Added `/disaster earthquake`.
- Added `/disaster tsunami`.
- Added `/disaster volcano`.
- Added `/disaster general`.
- Added `/disaster setup` and `/disaster disable`.
- Added `/upcoming ramadan` and `/upcoming disasters`.

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
- Added city-based imsakiyah retrieval for Ramadan.

### Ramadan
- Added `/ramadan upcoming`.
- Added `/ramadan today city:<city>`.
- Added `/ramadan setup`, `/ramadan disable`, and `/ramadan test`.
- Added scheduled sahur and iftar notifications.

## [1.5.0] - 2026-09-19

### Added
- Web verification flow.
- 4-character server-bound verification codes.
- Verification role and attempt limits.
- Feature registry and developer diagnostics.

## [1.4.0] - 2026-09-19

### Added
- Dedicated media subsystem.

## [1.3.0] - 2026-09-19

### Added
- Modern command namespaces and separated JKT48 game databases.

## [1.2.0]
- Previous JKT48 feed/live integration baseline.

## [1.0.0]
- Initial modular Discord bot foundation.

[1.7.0]: https://github.com/nararyajayautamagroub/nararya-bot-discord/releases/tag/v1.7.0
