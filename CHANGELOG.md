## 1.5.0 — 2026-09-19\n\n### Added\n- Web verification flow with an “I’m not a robot” checkbox.\n- 4-character server-bound verification codes with one-time redemption and expiry.\n- Optional automatic verified role assignment.\n- `/verify` commands for start, code, status, and role configuration.\n- `/bot` commands for info, feature registry, and health.\n- `src/config/features.js` centralized feature registry.\n- `SECURITY.md` and verification documentation.\n\n### Security\n- Verification codes are stored only as hashes.\n- Each Discord server receives its own random secret.\n- Verification sessions have attempt limits and expiry.\n\n# Changelog

All notable changes to this project are documented here.

The format follows a practical Keep a Changelog-style structure. Version numbers follow Semantic Versioning where applicable.

## [1.3.0] - 2026-09-19

### Added
- Modern Discord slash-command namespaces:
  - `/jkt48`
  - `/jkt48game`
  - `/sim`
  - `/utility`
  - `/economy`
  - `/moderation`
  - `/support`
  - `/feed`
- JKT48 member data synchronization for generations 1-14.
- AllMember and ActiveMember dataset integration.
- Separate JKT48 game databases:
  - `quiz.db`
  - `gacha.db`
  - `cards.db`
- JKT48 card collection system.
- Seven card rarities:
  - Common: 50%
  - Uncommon: 25%
  - Rare: 13%
  - Epic: 7%
  - Legendary: 3.5%
  - Mythic: 1.4%
  - Secret: 0.1%
- Rarity-based quiz scoring multipliers.
- Rarity-based card reveal animations with longer sequences for higher rarities.
- Persistent quiz sessions, attempts, streaks, and leaderboard data.
- Gacha pull history and daily pull tracking.
- Quiz asset administration commands.
- Animated card reveal embeds for quiz rewards and gacha results.

### Changed
- General bot features continue using the main application database.
- JKT48 game/card persistence is isolated from ticket, economy, moderation, level, and tycoon data.
- Tycoon and general bot responses are standardized around branded Discord embeds.
- Slash commands are organized into modern namespaces.
- JKT48 game inventory now represents a card collection rather than a simple gacha list.

### Fixed
- JKT48 member generation range updated from 1-13 to 1-14.
- Legacy quiz assets are migrated into the dedicated quiz database.
- Gacha daily limits use a dedicated gacha database counter.
- Card reveal embeds consistently include branded author/footer metadata.

## [1.2.0]
- Previous bot release and JKT48 feed/live integration baseline.

## [1.0.0]
- Initial modular Discord bot foundation.

[1.3.0]: https://github.com/nararyajayautamagroub/nararya-bot-discord/releases/tag/v1.3.0
