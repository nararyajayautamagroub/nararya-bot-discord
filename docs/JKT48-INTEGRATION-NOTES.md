# JKT48 Integration Notes

## Purpose

This document records the upstream projects and public sources used as architectural references for the JKT48 subsystem. The bot does not vendor upstream repositories wholesale. Integration code is implemented through local adapters, normalized records, database state, retry handling, and Discord notification services.

## Upstream references

- sendyarf/jkt48-archiver
  - Reference concepts: IDN HLS health checks, persistent member stream records, reconnect handling, segment/archive state, and FFmpeg processing.
- ayouree/live-notification-bot
  - Reference concept: live notification workflow.
- ojixzzz/twitterbot48
  - Reference concept: JKT48 X/Twitter notification workflow.
- pranendraa/piobot-live
  - Reference concepts: multi-platform live monitoring for SHOWROOM, IDN Live, and TikTok.
- FrenzY8/JKT48Guessr
  - Reference concepts: JKT48 guessing modes, difficulty, and leaderboard flow.
- crstlnz/jkt48showroom-api
  - Reference concept: SHOWROOM data access.
- FrenzY8/JKT48Member
  - Reference data source: historical and active member records.
- Synxx12/idn-api-live-jkt48
  - Reference concept: IDN Live data endpoint.
- faruuhan/scraping-jkt48-website
  - Reference concept: public JKT48 website scraping.

## JKT48 data sources

The bot supports the following public sources:

- JKT48 official website
- JKT48 events
- JKT48 news
- JKT48 theater
- IDN Live
- SHOWROOM
- YouTube JKT48
- YouTube JKT48 TV
- Instagram JKT48
- TikTok JKT48
- X/Twitter JKT48
- Threads JKT48
- Tokopedia JKT48
- Shopee JKT48
- Configurable member social feeds
- Configurable costume-channel feeds

## Adapter architecture

The notification pipeline is:

1. Source registry.
2. Public fetcher.
3. Parser.
4. Normalizer.
5. Stable URL hash.
6. Database deduplication.
7. Notification queue.
8. Discord embed.
9. Source health and audit telemetry.

The scraper layer uses bounded timeouts and retries. It does not bypass authentication, CAPTCHA, paywalls, login walls, or anti-bot controls.

## Live detection

Live detection has two paths:

1. JKT48Connect when configured.
2. Public scraper-backed detection for configured IDN, SHOWROOM, YouTube, Instagram, and TikTok sources.

The public path is best-effort because platform page structures can change without notice. The monitor uses persistent state to detect START and END transitions and avoids duplicate notifications.

## Member database

The historical and active member source is merged into the main member table. Generation 14 is supplemented by a seed based on the official JKT48 announcement published on 18 May 2026.

Generation 14 seed members:

- Afera Thalia
- Carissa Dini
- Christabella Bonita
- Fahira Putri
- Fatimah Azzahra
- Heidi Suyangga
- Maxine Faye Lee
- Putry Jazyta
- Ralyne Van Irwan
- Sona Kalyana

The seed is intentionally additive so future source updates can replace or enrich the records.

## Game database separation

JKT48 quiz, gacha, and card systems use separate SQLite databases under the JKT48 game data directory.

General Discord features, economy, moderation, tycoon, ticket configuration, and other bot-wide systems continue using the main database. The Ticket Bot remains a separate runtime and database.

## Daily limits

Gacha pulls and guessing games are limited to 10 uses per user per day.

The day key is generated in the configured bot timezone. There is no timer-based midnight reset. A new calendar day automatically creates a new daily row, so the counter resets even if the process stays online continuously.

## Animation

Card reveal duration increases with rarity. Common cards use a short reveal sequence, while Mythic and Secret cards use longer multi-frame sequences.

## Operational limits

A source may fail because a platform changes its HTML, requires authentication, rate-limits requests, or removes a public endpoint. Such failures are stored in feed health and scraper audit state instead of being treated as successful data.

## Licensing

Upstream projects remain subject to their own licenses and attribution requirements. This repository only records architectural references and does not claim ownership of upstream code, trademarks, member data, or platform content.
