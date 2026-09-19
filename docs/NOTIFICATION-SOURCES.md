# Notification Sources

The bot uses an adapter-based public notification feed service.

## Supported feed groups

- JKT48 Website
- IDN
- SHOWROOM
- YouTube
- Instagram
- Instagram member feeds when explicitly configured
- TikTok
- TikTok member feeds when explicitly configured
- X/Twitter
- X/Twitter member feeds when explicitly configured
- Threads
- Tokopedia
- Shopee
- JKT48 TV
- Costume YouTube
- Costume Instagram
- Costume TikTok

## Feed lifecycle

1. Register the source.
2. Select an adapter.
3. Poll the source.
4. Normalize the result.
5. Remove duplicates.
6. Persist feed items.
7. Send a Discord notification.
8. Update source health.

## Commands

- /feed list
- /feed add
- /feed defaults
- /feed health
- /feed remove
- /feed test

## Restrictions

Only public sources should be configured.

Do not configure private account endpoints, credential pages, or protected source URLs.

## JKT48 rule

JKT48 integrations use their dedicated source logic and are exempt from the generic scraper requirement.
