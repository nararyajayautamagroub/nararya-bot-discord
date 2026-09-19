# Feature Registry

Daftar fitur aktif bot berasal dari `src/config/features.js`.

## 50 fitur aktif

### Discord
1. Slash Command Registry

### JKT48
2. JKT48 Member Database
3. JKT48 Upcoming
4. JKT48 Latest

### Notification
5. JKT48 Platform Feed

### Game
6. JKT48 Quiz
7. JKT48 Gacha
8. JKT48 Card Collection
9. Google Street View Quiz
10. Game Cooldown
11. Quiz Timeout
12. Simulation Tycoon

### Community
13. Server Economy
14. Leveling
15. Welcome / Goodbye

### Security
16. Moderation
17. Web Verification
18. Server-bound Verification Code
19. Verification Role
20. Verification Rate Limit

### Support
21. Support Tickets

### Media
22. Media Downloader
23. Media Resolution
24. Vocal Separation
25. Background Removal
26. Watermark Removal
27. Media User Settings

### Developer
28. Security Policy
29. Feature Registry
30. Bot Info
31. Bot Feature Catalog
32. Bot Health
33. Verification Developer API
34. Indonesia Data Refresh

### Indonesia
35. Indonesia News
36. Indonesia Stock Quotes
37. Fuel Prices
38. Electricity Tariffs
39. Food Prices

### Ramadan
40. Upcoming Ramadan
41. Imsakiyah Schedule
42. Sahur Notification
43. Iftar Notification
44. Scraper Registry
45. URL Health Check
46. Database Data Audit
47. Scraper Method Suggestion
48. Disaster Monitor
49. Disaster Notification
50. System Status

## Game policy

All quiz and gacha actions share a 10-second per-user/server cooldown.

Every active guessing session has a 1-minute answer window. Timeout is recorded as a failed attempt and does not grant quiz points.

Google Street View mode requires `GOOGLE_MAPS_API_KEY`.

## Indonesia data

- News uses public ANTARA RSS feeds.
- Stock quotes use IDX `.JK` symbols through Yahoo Finance data endpoints.
- Fuel, electricity, and food sources are cached and refreshed on source-specific intervals.
- Ramadan prayer schedules use city-based prayer schedule data.
- Ramadan dates include environment overrides because official Indonesian dates are established through the relevant government process.

See [INDONESIA-DATA.md](./INDONESIA-DATA.md) for data-source details.
