# Version

Current project version: **2.1.2**

Release date: **2026-09-20**


This release adds:
- owner-only /setup command enforcement
- owner-only /settingbot global bot controls
- owner-only /blacklistserver and /blacklistusers commands
- global maintenance mode and blacklist enforcement across commands and messages
- /help feature catalog with category filters and pagination
- /setup server configuration overview and channel setup
- /electronics public marketplace price scraper for Indonesia
- automatic one-time guild invite welcome message on bot join
- safe system-channel/text-channel fallback for welcome delivery
- migration support for existing guild configuration databases
- central scraper registry for external data
- 10-second URL health and database audit pipeline
- automatic detection of data URLs without a scraper adapter
- scraper method suggestions for unknown sources
- general Google Street View game
- disaster monitoring for earthquakes, tsunami, volcanoes, and general disasters
- disaster location reporting and optional server notifications
- system/status/data audit slash commands
- 24-hour background news source refresh
- `/restaurantprices` restaurant menu price aggregator for Indonesia
- centralized shared toolbox and resilient HTTP client modules
- parser/cache/refresh support for MenuKuliner public restaurant data
- 151-feature registry with restaurant pricing
- dedicated red-and-white JKT48 Center website with responsive hamburger navigation
- GitHub Pages workflow and frontend regression tests
- core dependency cleanup and deprecated-package override
- CI migrated to pinned Node 22 container for cleaner toolchain diagnostics

JKT48 remains on its existing repository/source URL integration and is exempt from the generic scraper requirement.

For release details, see [CHANGELOG.md](./CHANGELOG.md).
