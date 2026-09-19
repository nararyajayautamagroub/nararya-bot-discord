# Version

Current version: 2.2.0

Release date: 2026-09-20

## Release scope

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
