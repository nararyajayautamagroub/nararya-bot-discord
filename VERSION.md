# Version

Current version: 2.1.2

Release date: 2026-09-20

## Release scope

This version standardizes the shared tool layer, adds restaurant menu price aggregation, strengthens verification rate limiting, documents the media system, and synchronizes the active feature registry to 150 features.

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
