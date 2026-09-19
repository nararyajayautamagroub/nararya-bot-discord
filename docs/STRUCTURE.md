# Repository Structure

## Runtime

- `src/index.js` — entrypoint bot Discord.
- `src/deploy-commands.js` — registrasi slash commands.
- `src/config/` — configuration and feature registry.
- `src/security/` — security services, verification sessions, server-bound code, and rate limits.
- `src/web/verification/` — verification HTTP server and static website.
- `src/media/` — media database, download, service, and transforms.
- `src/jkt48/` — JKT48 source synchronization, feed, live monitoring, and command service.
- `src/services/indonesia/` — Indonesia news, stock, fuel, electricity, food, prayer, and Ramadan data adapters.
- `src/services/games/jkt48/` — quiz, gacha, cards, rarity, and reveal subsystems.
- `tools/media/` — Python helpers for media transforms.

## Data

- `data/nararya.db` — main guild, moderation, economy, levels, ticket, and tycoon database.
- `data/jkt48/` — separate JKT48 game databases.
- `data/media/` — separate media job database and temporary files.
- `data/**/*.db*` and media job output are ignored by Git.

## Documentation

- `README.md` — project overview.
- `SECURITY.md` — security policy and vulnerability reporting.
- `docs/COMMANDS.md` — command reference.
- `docs/FEATURES-100.md` — implemented feature catalog entrypoint.
- `docs/FEATURE-REGISTRY.md` — detailed feature registry.
- `docs/VERIFICATION.md` — verification deployment and flow.
- `docs/MEDIA.md` — media subsystem requirements.
- `docs/INDONESIA-DATA.md` — Indonesia data sources, cache policies, and Ramadan behavior.
- `docs/JKT48-SOURCES.md` — JKT48 source mapping.

## Quality

- `test/` — automated Node test files.
- `.github/workflows/ci.yml` — install and test workflow.

## Security rules

Secrets belong in environment variables or a secret manager. Never commit `.env`, Discord tokens, API keys, verification tickets, production databases, or user-uploaded verification evidence.
