# JKT48 Sources

## Member database

The member database synchronizes from the configured public JKT48 member source.

The local database stores active and historical member records for command and game features.

## Public integrations

- JKT48 Website
- Events
- News
- Theater
- SHOWROOM
- IDN
- YouTube
- Instagram
- TikTok
- X/Twitter
- Threads
- Tokopedia
- Shopee
- Costume channels

## Handling

JKT48 source integrations use dedicated adapters and are intentionally outside the generic non-JKT48 scraper contract.

Adapters handle:

- parsing
- normalization
- deduplication
- polling
- error handling
- health reporting

## Configuration policy

Do not create guessed or placeholder social URLs for member or costume feeds. Only explicit public URLs should be registered.
