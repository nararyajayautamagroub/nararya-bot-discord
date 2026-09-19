# Nararya Bot Discord

Bot Discord modular untuk komunitas Nararya dan notifikasi JKT48.

## JKT48 Feed Engine

Integrasi sekarang memakai adapter internal untuk:
- JKT48 Website: official, Events, News, Theater
- IDN
- SHOWROOM
- YouTube
- Instagram
- TikTok
- X/Twitter
- Threads
- Tokopedia
- Shopee
- Costume YouTube / Instagram / TikTok melalui URL yang dikonfigurasi

Fitur feed:
- scraper publik berbasis HTML metadata
- JKT48 Website parser khusus
- YouTube RSS bila URL memakai `channel_id`
- deduplikasi berbasis SHA-256
- polling otomatis
- embed Discord
- konfigurasi feed per server
- `/feed list`, `/feed add`, `/feed remove`, `/feed test`

## Discord

- moderation anti-spam dan anti-invite
- timeout otomatis
- warning dan ban
- welcome / goodbye
- ticket privat dengan staff-role support
- leveling
- economy + daily cooldown
- server/user info
- slash commands

## Referensi proyek

Implementasi ini terinspirasi dari pola dan fitur proyek publik berikut, tetapi source code tidak disalin:
- sendyarf/jkt48-archiver
- ayouree/live-notification-bot
- ojixzzz/twitterbot48
- pranendraa/piobot-live
- FrenzY8/JKT48Guessr
- crstlnz/jkt48showroom-api
- FrenzY8/JKT48Member
- Synxx12/idn-api-live-jkt48
- faruuhan/scraping-jkt48-website

Detail integrasi ada di `docs/JKT48-SOURCES.md`.

## Setup

1. Salin `.env.example` menjadi `.env`.
2. Isi `DISCORD_TOKEN` dan `CLIENT_ID`.
3. Jalankan `npm install`.
4. Jalankan `npm run deploy`.
5. Jalankan `npm start`.

Scraper hanya menggunakan sumber publik dan tidak melakukan bypass CAPTCHA, login, paywall, rate limit, atau sistem anti-bot. Gunakan URL/API yang sesuai dengan ketentuan layanan masing-masing platform.

## Documentation

Project/legal documentation:
- [CHANGELOG](./CHANGELOG.md)
- [CONTRIBUTING](./CONTRIBUTING.md)
- [COPYRIGHT](./COPYRIGHT.md)
- [LICENSE](./LICENSE)
- [LICENSE NOTICE](./LICENSE-NOTICE.md)
- [TRADEMARK NOTICE](./TRADEMARK.md)
- [VERSION](./VERSION.md)
- [SECURITY](./SECURITY.md)
- [FEATURE REGISTRY](./docs/FEATURE-REGISTRY.md)
- [VERIFICATION](./docs/VERIFICATION.md)
- [STRUCTURE](./docs/STRUCTURE.md)
- [INDONESIA DATA](./docs/INDONESIA-DATA.md)

## Current version

**v2.1.2** — 2026-09-20

### Modern command layout

General commands are grouped under namespaces such as `/utility`, `/economy`, `/moderation`, and `/support`. JKT48 features use `/jkt48` and `/jkt48game`, while the simulation system uses `/sim`.

General bot data remains in the main database. The JKT48 game/card subsystem uses separate feature databases for quiz, gacha, and cards.


## Media Subsystem

The project provides a dedicated `/media` command namespace for:

- public video, audio, and image downloads
- selectable video resolution
- vocal separation and instrumental generation
- image and video background removal
- image and video watermark removal
- per-user media settings

See [docs/MEDIA.md](./docs/MEDIA.md) for installation requirements and operational details.

## Security and Verification

The bot now includes a server-bound web verification flow:

- `/verify start` generates a private verification URL.
- Website checkbox “I’m not a robot” completes the application challenge.
- Website returns a temporary 4-character code.
- `/verify code` redeems the code for the same Discord user and server.
- Optional verified role can be configured with `/verify role`.
- Verification sessions expire and have a maximum number of attempts.

Developer diagnostics are available through `/bot info`, `/bot features`, and `/bot health`.
See [SECURITY.md](./SECURITY.md), [docs/VERIFICATION.md](./docs/VERIFICATION.md), and [docs/FEATURE-REGISTRY.md](./docs/FEATURE-REGISTRY.md).


## Game Guessing

The JKT48 game system now supports a Google Street View photo mode in addition to the existing quiz modes.

Game rules:
- 10-second cooldown per user/server for quiz and gacha.
- 1-minute answer window for every active guessing session.
- Unanswered sessions fail automatically and are stored as failed quiz results.
- Google Street View mode requires `GOOGLE_MAPS_API_KEY`.

## Indonesia Information

New slash-command namespaces provide:
- Indonesian news by category.
- IDX stock quotes and IHSG.
- Fuel prices.
- Electricity tariffs.
- Strategic food prices.
- Ramadan dates and imsakiyah schedules.
- Automated sahur and iftar notifications.

See [docs/INDONESIA-DATA.md](./docs/INDONESIA-DATA.md) for sources, refresh behavior, and limitations.


## Data Integrity and Scrapers

The repository now uses a centralized scraper registry for external data.

The background integrity pipeline runs every 10 seconds:
1. checks registered scraper URLs;
2. scans all bot databases;
3. re-checks stored URLs;
4. compares each URL against the scraper registry;
5. exempts configured JKT48 repository URLs;
6. marks unknown sources as `missing_scraper`;
7. suggests the appropriate scraper/API method.

Use:
- `/status system`
- `/status scrapers`
- `/status data`
- `/status disasters`
- `/status sources`

News has a 24-hour background full refresh. Slash commands may refresh their own short-lived cache sooner.

See [docs/SCRAPER-MATRIX.md](./docs/SCRAPER-MATRIX.md).


## Guild Invite Welcome

Saat bot berhasil diundang ke server baru, bot otomatis mengirim satu pesan onboarding ke system channel server. Bila system channel tidak dapat digunakan, bot memilih text channel pertama yang bisa ditulis bot.

Pesan mencakup ringkasan fitur utama dan command awal seperti `/bot info`, `/bot features`, `/status system`, dan `/support ticket`.

Pengiriman dicatat pada `guild_config.welcome_sent_at`, sehingga pesan onboarding tidak dikirim ulang hanya karena bot restart.


## Help, Setup, and Electronics

- `/help` shows the full feature catalog in embedded pages, with category filtering and pagination.
- `/setup overview` shows current server feature configuration.
- `/setup welcome channel:<channel>` configures the welcome channel.
- `/setup log channel:<channel>` configures the scraper/data audit log channel.
- `/electronics` scrapes Indonesian public electronics catalog prices with category and keyword filters.
- Supported electronics categories include smartphone, laptop, tablet, TV, monitor, audio, camera, printer, router, storage, gaming, keyboard, mouse, smartwatch, and other electronics.
- Electronics source refresh is registered at 30 minutes, while URL health remains part of the 10-second data integrity checks.


## Reliability & Tooling Cleanup

- Runtime dependencies were trimmed to packages actually used by the application.
- Media downloads use Node's built-in `fetch` API rather than a separate HTTP client dependency.
- The deprecated `whatwg-encoding` dependency chain is overridden through `encoding-sniffer` 1.0.2.
- CI uses a pinned Node 22 container and runs JavaScript syntax checks plus the complete test suite.

## Restaurant Menu & Price Search\n\n- `/restaurantprices search` mencari restoran berdasarkan kota, kata kunci, kategori, dan rentang harga.\n- `/restaurantprices menu url:<url>` membaca menu dan harga dari halaman restoran publik.\n- `/restaurantprices prices` menggabungkan harga menu dari beberapa restoran dalam satu kota.\n- `/restaurantprices city` menelusuri direktori kota.\n- `/restaurantprices refresh` memperbarui cache direktori/menu.\n- `/restaurantprices status` memeriksa kesehatan sumber.\n\nSumber harga restoran: MenuKuliner.net. Harga bersifat informasional dan dapat berbeda menurut cabang, lokasi, platform delivery, pajak, promo, atau perubahan menu.\n\n## Shared Tools\n\n`src/tools/toolbox.js` menjadi utilitas bersama untuk parsing, pagination, cache, validation, date/time, formatting, redaction, dan helper harga. `src/tools/http-client.js` menangani timeout, retry, rate-aware fetching, JSON/text/buffer requests, dan probe URL.\n\n## Owner Controls

`/setup` is now **owner-only**. Configure `BOT_OWNER_IDS` with comma-separated Discord user IDs, while the Discord application owner is also recognized at runtime.

Owner-only commands:
- `/setup`
- `/settingbot`
- `/blacklistserver`
- `/blacklistusers`

`/settingbot` controls global maintenance mode, activity, and Playing-status rotation. The bot can rotate multiple Playing activities automatically. Blacklists persist in the main database, block normal bot activity, and allow bot owners to bypass restrictions for recovery.
