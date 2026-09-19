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
