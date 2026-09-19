# Changelog

All notable changes to this project are documented here.

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
- JKT48 member data synchronization for generations 1-14.
- Separate JKT48 game databases for quiz, gacha, and cards.
- JKT48 card collection system.
- Seven card rarities from Common through Secret.
- Persistent quiz sessions, attempts, streaks, and leaderboard data.
- Gacha pull history and daily pull tracking.
- Quiz asset administration commands.
- Animated card reveal embeds for quiz rewards and gacha results.

### Changed
- General bot features continue using the main application database.
- JKT48 game/card persistence is isolated from ticket, economy, moderation, level, and tycoon data.
- Slash commands are organized into modern namespaces.

### Fixed
- JKT48 member generation range updated from 1-13 to 1-14.
- Legacy quiz assets are migrated into the dedicated quiz database.
- Gacha daily limits use a dedicated gacha database counter.

## [1.2.0]
- Previous bot release and JKT48 feed/live integration baseline.

## [1.0.0]
- Initial modular Discord bot foundation.

[1.5.0]: https://github.com/nararyajayautamagroub/nararya-bot-discord/releases/tag/v1.5.0
[1.4.0]: https://github.com/nararyajayautamagroub/nararya-bot-discord/releases/tag/v1.4.0
[1.3.0]: https://github.com/nararyajayautamagroub/nararya-bot-discord/releases/tag/v1.3.0
