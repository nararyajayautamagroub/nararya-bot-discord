# JKT48 live and schedule integration

The bot can optionally use JKT48Connect for structured schedule and live data.

Environment:
- JKT48CONNECT_API_KEY: API key from JKT48Connect
- JKT48CONNECT_BASE_URL: optional, defaults to https://v2.jkt48connect.com/api/jkt48
- JKT48_MONITOR_INTERVAL_MS: optional polling interval, default 30000

Slash commands:
- /jkt48 upcoming event
- /jkt48 upcoming theater
- /jkt48 upcoming setlist
- /jkt48 upcoming songs
- /jkt48 upcoming live
- /jkt48 upcoming birthday
- /jkt48 upcoming graduation
- /jkt48 latest event
- /jkt48 latest theater
- /jkt48 latest setlist
- /jkt48 latest songs
- /jkt48 latest live
- /jkt48 latest birthday
- /jkt48 latest graduation
- /jkt48 latest live_showroom
- /jkt48 latest live_idn

Live monitoring has no per-event cooldown. Duplicate notifications are prevented by persistent state in SQLite. End-live requires two consecutive missing polls to reduce false END LIVE notifications during temporary source glitches.

YouTube membership-only status is displayed when the upstream source exposes a membership-only/visibility field. The bot does not bypass private content, DRM, login, CAPTCHA, or anti-bot controls.

Instagram and TikTok live detection is not claimed from generic HTML scraping. These platforms require a supported public/API data source for reliable start/end status. The existing feed adapters can still monitor public profile metadata where available.
