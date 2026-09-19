# Scraper Matrix

Semua fitur yang mengambil data eksternal wajib mempunyai scraper/API adapter atau source contract. JKT48 adalah pengecualian yang memakai URL repository/sumber JKT48 yang sudah ditetapkan di modul `src/jkt48/`.

| Area | Method | Source / Adapter | Refresh |
|---|---|---|---|
| Indonesia news | RSS/XML parser | ANTARA RSS | background full refresh 24 jam, command cache 15 menit |
| Indonesia stocks | JSON API adapter | Yahoo Finance IDX symbols | 10 menit |
| Fuel | HTML adapter + configured baseline | MyPertamina | 24 jam |
| Electricity | source probe + configured tariff table | PLN | 24 jam |
| Food | HTML adapter | Bank Indonesia PIHPS | 24 jam |
| Prayer / Ramadan | JSON API | MyQuran + Kemenag source contract | 24 jam |
| Earthquake | HTML scraper | BMKG | 60 detik |
| Tsunami | HTML scraper | BMKG | 60 detik |
| Disaster general | ArcGIS JSON adapter | BNPB GIS | 5 menit |
| Volcano | HTML scraper | MAGMA / ESDM source contract | 5 menit |
| Street View | Google Maps API adapter | Google Street View | on demand + source health check |
| Public media | external media adapter | yt-dlp/direct HTTP | on demand |
| Verification website | local service | own web server | local health |
| Discord economy/levels/tickets | local database | SQLite | local integrity audit |
| JKT48 | repository/source URLs | existing JKT48 modules | exempt from generic scraper requirement |

## 10-second audit pipeline

The background pipeline runs in this order:

1. Check registered scraper source URLs.
2. Scan all bot databases.
3. Find URL-like fields in every table.
4. Probe URLs that are stored in data.
5. Compare the URL with the scraper registry.
6. Exempt configured JKT48 repository URLs.
7. Mark unknown external URLs as `missing_scraper`.
8. Generate a suggested adapter method:
   - JSON API
   - RSS/XML
   - Direct media
   - HTML + Cheerio
   - Official/public API
9. Expose the result through `/status data`.

The audit does not invent a source. A data record without a verifiable scraper contract remains flagged until an adapter is added.

## News

News is refreshed continuously on demand while the background source contract is fully refreshed every 24 hours. URL health is checked independently every 10 seconds, so a reachable feed and fresh data are treated as two separate conditions.
