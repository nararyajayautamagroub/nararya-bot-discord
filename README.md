# Nararya Bot Discord 🤖

Bot Discord modular untuk komunitas JKT48 dan server komunitas.

## Arsitektur
```
src/
├── commands/       # Slash Commands, satu fitur satu modul
├── events/         # event Discord
├── config/         # konfigurasi
├── database/       # schema & repository SQLite
├── services/       # logic moderation, ticket, economy, music, dll
├── utils/          # helper
└── jobs/           # pekerjaan terjadwal
docs/               # dokumentasi
tests/              # pengujian
.github/            # CI
```

**Semua fitur interaktif menggunakan Slash Command, Button, Select Menu, atau Modal.** Notifikasi JKT48/platform berjalan otomatis sebagai background feed, jadi tidak perlu command untuk menunggu berita turun dari langit.

## Notification
JKT48 News, Events/Schedule, Theater, YouTube JKT48, YouTube JKT48 TV, Instagram, TikTok, X, Threads, SHOWROOM, IDN, Tokopedia, Shopee, member feeds, costume channels, keyword alert, filter, per-channel subscription, dan deduplication.

Scraper hanya memproses sumber publik. Tidak ada mekanisme untuk melewati CAPTCHA, login wall, rate limit, atau anti-bot.

## Command
Command dikelompokkan ke admin, moderation, security, ticket, community, economy, utility, roles, music, dan info. File command tidak dibiarkan sebagai README kosong: masing-masing berisi SlashCommandBuilder dan validasi opsi.

## Development
```bash
npm install
cp .env.example .env
npm run deploy
npm start
```

100 fitur tercatat di `src/utils/featureCatalog.js`. Roadmap dan struktur ada di `docs/FEATURES-100.md`.
