# 100 Feature Roadmap

Nararya Bot Discord memakai registry fitur agar modul bisa dikembangkan tanpa membuat satu file raksasa yang nanti menangis sendiri.

## 100 fitur
- 1-30: notifikasi dan feed JKT48/platform
- 31-50: moderation & security
- 51-60: ticket automation
- 61-75: community, leveling, economy & mini game
- 76-85: utility
- 86-100: welcome, role, music, game, maintenance & health

## Notification
Sumber resmi JKT48 diprioritaskan untuk News, Schedule/Event, dan Theater. Untuk platform yang kontennya dinamis, adapter menerima URL publik yang dikonfigurasi admin. Bot tidak mencoba melewati CAPTCHA, login wall, rate limit, atau anti-bot.

## Struktur
`src/config` konfigurasi sumber.
`src/services/notifications` scraper, normalizer, dedupe, dispatcher, scheduler.
`src/services/moderation` moderation.
`src/services/security` anti-raid/security.
`src/services/community` leveling.
`src/services/economy` economy.
`src/services/games` mini games.
`src/services/tickets` ticket subsystem.
`src/utils` embed dan registry.

## Notifikasi
Gunakan subscription per guild/channel. Setiap item dideduplikasi dengan `source_key + item_key`. Embed memuat sumber, judul, URL, thumbnail jika tersedia, dan timestamp.
