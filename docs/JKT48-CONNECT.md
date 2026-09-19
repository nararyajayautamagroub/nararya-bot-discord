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


## Member datasets

The member database also syncs these public datasets:
- All members (used for generations 1-14): `https://raw.githubusercontent.com/FrenzY8/JKT48-Member/refs/heads/main/AllMember.json`
- Active members: `https://raw.githubusercontent.com/FrenzY8/JKT48-Member/refs/heads/main/ActiveMember.json`

Optional overrides:
- `JKT48_ALL_MEMBER_URL`
- `JKT48_ACTIVE_MEMBER_URL`
- `JKT48_MEMBER_SYNC_INTERVAL_SECONDS` (default 21600)

The bot stores normalized records in SQLite and uses the same member table for member lookup, generation listings, and JKT48 gacha data. The importer only accepts generations 1-14 for this dataset and marks members found in ActiveMember.json as active.


## JKT48 game card architecture

The JKT48 game subsystem now uses separate SQLite databases under `JKT48_GAME_DATA_DIR` (default `./data/jkt48`):

- `quiz.db`: quiz assets, active quiz sessions, attempts, scores, streaks.
- `gacha.db`: gacha pull history and daily pull counters.
- `cards.db`: card definitions, user card inventory, and card acquisition events.

Each quiz challenge receives a rarity. Correct answers award a card using the challenge rarity, while gacha pulls independently roll a rarity and award member cards. Supported rarities are Common, Uncommon, Rare, Epic, Legendary, Mythic, and Secret.

The Discord reveal flow uses staged embed edits for CARD SEALED → CARD SCANNING → RARITY DETECTED → final card. This is a Discord-native animation effect rather than a third-party animation service.

Additional settings:
- `JKT48_GAME_DATA_DIR`: root directory for the three feature databases.
- `JKT48_QUIZ_TIMEOUT_MS`: quiz answer timeout, default 60000 ms.

Quiz asset management:
- `/jkt48game asset_add`: add an asset, answer aliases, public media URL, and rarity.
- `/jkt48game asset_list`: inspect asset counts by mode or rarity.
- `/jkt48game inventory`: view the combined card collection.


## Modern Discord command layout

General bot commands are grouped into namespaces:
- `/utility ping|server|user|level`
- `/economy balance|daily`
- `/moderation warn|ban`
- `/support ticket`
- `/feed list|add|remove|test`
- `/sim profile|daily|bank|fish|build|gacha`
- `/jkt48 member|members`
- `/jkt48 upcoming ...`
- `/jkt48 latest ...`
- `/jkt48game play|gacha|inventory|leaderboard|asset_add|asset_list`

The main application database remains responsible for general bot data: tickets, economy, moderation warnings, levels, guild configuration, and tycoon/simulation state. The separate JKT48 game databases are dedicated to quiz sessions/assets, gacha history, and card collections.

After changing `src/deploy-commands.js`, run `npm run deploy` so Discord receives the current command tree.
