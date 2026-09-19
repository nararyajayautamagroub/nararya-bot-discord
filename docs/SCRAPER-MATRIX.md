# Scraper Matrix

## Policy

Every external non-JKT48 source must have a registered source contract and adapter.

JKT48 remains on the dedicated JKT48 integration and is exempt from the generic scraper requirement.

## Source classes

| Group | Source | Adapter | Health |
| --- | --- | --- | --- |
| JKT48 | Configured repository or API | JKT48-specific | Dedicated integration |
| News | Public RSS | RSS adapter | Registry |
| Stocks | Public market data | JSON adapter | Registry |
| Fuel | Public price source | HTML or JSON adapter | Registry |
| Electricity | Public tariff source | HTML or JSON adapter | Registry |
| Food | Public food price source | JSON or HTML adapter | Registry |
| Electronics | Public catalog | HTML parser | Registry |
| Restaurant | MenuKuliner.net | Directory and menu parser | Registry |
| Disaster | BMKG, BNPB, MAGMA | JSON or XML adapters | Registry |
| Feed | Configured public URLs | Source-specific adapters | Feed health |

## Ten-second audit

1. Scan configured databases.
2. Identify fields that contain URLs.
3. Check URL availability.
4. Match URL to the scraper registry.
5. Record source health.
6. Detect missing adapters.
7. Suggest a scraper method.
8. Send configured log alerts.

## Scraper method suggestions

When no adapter exists, the audit can recommend:

- JSON API
- RSS/XML
- direct media
- HTML and Cheerio
- official/public API

## Adapter requirements

Each adapter should implement:

- timeout
- retry
- response validation
- normalization
- deduplication
- cache or refresh policy
- error reporting
- test coverage
