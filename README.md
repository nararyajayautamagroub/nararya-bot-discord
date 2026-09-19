# Nararya Bot Discord

Nararya Bot Discord adalah bot Discord modular untuk komunitas, JKT48, game, data Indonesia, notifikasi, media processing, moderation, verification, dan developer operations.

## Current release

Version: 2.1.0
Release date: 2026-09-20
Active feature registry: 150 features

## Core capabilities

- JKT48 member database, upcoming and latest information, platform feed, quiz, gacha, card collection, dan EXP profile card.
- General Google Street View quiz. Fitur ini adalah game lokasi dan tidak berfokus pada JKT48.
- Indonesia news, stock quotes, fuel prices, electricity tariffs, food prices, Ramadan schedules, dan disaster monitoring.
- Restaurant menu and price aggregation melalui sumber publik MenuKuliner.net.
- Media download dan processing melalui yt-dlp, FFmpeg, Demucs, dan rembg jika dependency terkait tersedia.
- Web verification dengan server-bound one-time codes.
- Owner-only setup, global bot settings, server blacklist, user blacklist, security controls, dan audit tooling.
- Scraper registry dan database audit pipeline dengan pemeriksaan URL setiap 10 detik.
- Leveling dengan visual EXP profile card.
- Rotating Discord Playing status.

## Project structure

~~~
src/
  config/
  commands/
  jkt48/
  media/
  music/
  security/
  services/
  tools/
  web/
  index.js
  deploy-commands.js

tools/
  media/

test/
docs/
website/
~~~

## Installation

1. Copy .env.example to .env.
2. Configure DISCORD_TOKEN, CLIENT_ID, database paths, dan optional service credentials.
3. Install Node dependencies with npm install.
4. Install optional system dependencies for media processing:
   - FFmpeg
   - yt-dlp
   - Python
   - Python packages from tools/media/requirements.txt
   - Demucs for vocal separation
5. Deploy slash commands with npm run deploy.
6. Start with npm start.

## Verification

Use /verify start to create a server-bound verification session. The bot returns a private website URL. The website validates the session, performs the "I'm not a robot" interaction, and returns a temporary four-character code. The user submits the code with /verify code.

The code is derived from a per-server secret and the current session identifier.

## Media

The media subsystem provides:

- Video download with selectable resolution and format.
- Audio download for public media URLs.
- Image download from direct image URLs, Open Graph image metadata, or supported yt-dlp sources.
- Vocal removal and instrumental generation.
- Background removal for images and videos.
- Watermark removal for images and videos using an explicitly provided rectangle.
- Per-user default media resolution and format settings.

## Data and scraper policy

External non-JKT48 data must have a source contract and scraper or API adapter. JKT48 sources use the configured repository or source URLs and remain exempt from the generic scraper requirement.

The data audit pipeline:

1. Checks database contents.
2. Finds URL fields.
3. Checks URL health.
4. Matches URLs against the scraper registry.
5. Detects missing or unhealthy adapters.
6. Stores findings.
7. Reports suggested scraper methods for unresolved URLs.

The pipeline runs every 10 seconds.

Indonesia source caches use a 24-hour refresh policy unless a source-specific policy requires a shorter interval.

## Security

Secrets must be stored in environment variables and never committed to the repository. See SECURITY.md for reporting and operational guidance.

The bot includes owner controls, maintenance mode, blacklists, verification sessions, rate limiting, security incidents, moderation case IDs, and scraper audit logging.

## Development

Run the test suite with:

~~~
npm test
~~~

Run JavaScript syntax validation locally:

~~~
find src test -type f -name '*.js' -print0 | xargs -0 -n1 node --check
~~~

## Documentation

- CHANGELOG.md
- VERSION.md
- SECURITY.md
- docs/ARCHITECTURE.md
- docs/COMMANDS.md
- docs/FEATURE-REGISTRY.md
- docs/INDONESIA-DATA.md
- docs/JKT48-SOURCES.md
- docs/JKT48-CONNECT.md
- docs/MEDIA.md
- docs/NOTIFICATION-SOURCES.md
- docs/SCRAPER-MATRIX.md
- docs/STRUCTURE.md
- docs/VERIFICATION.md
