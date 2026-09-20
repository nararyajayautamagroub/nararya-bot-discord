# Version

Current version: 3.2.1

Release date: 2026-09-20

## Release scope

Version 3.2.1 aligns the website and Discord bot footer branding to PT. NARARYA JAYA UTAMA GROUB - All Right Reserved and keeps the full-stack runtime validation green.

Version 3.2.0 adds the modular web gateway, versioned /api/v1 routes, responsive device runtime modules, graceful shutdown, install-ready CI validation, and expanded scraper/frontend regression coverage.

Version 3.0.0 hardens the scraper/runtime pipeline, adds repository integrity validation, aligns package and release metadata, and strengthens CI checks for the Discord bot and JKT48 website.

This version adds date-keyed daily game limits, generation 14 member seed data, scraper-backed live detection, and database fallbacks for JKT48 schedule commands while retaining the separate Ticket Bot runtime.

## Runtime requirements

- Node.js
- Discord application credentials
- SQLite-compatible local storage

Optional media dependencies:

- FFmpeg
- yt-dlp
- Python
- Demucs
- rembg
- Pillow
- OpenCV

## Release validation

Before deployment:

1. Install dependencies.
2. Run JavaScript syntax validation.
3. Run tests.
4. Deploy slash commands.
5. Verify the web verification flow.
6. Check scraper health.
7. Check data audit status.
8. Check disaster source status.
