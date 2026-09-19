# Architecture

## Runtime

The bot runs as a Node.js ES module application using discord.js and SQLite.

## Main domains

- Discord command registration and routing.
- JKT48 integrations.
- Indonesia data.
- Scraper and source orchestration.
- Disaster monitoring.
- Media processing.
- Verification.
- Security and owner controls.
- Shared tools.
- Web verification.
- Tests.

## Databases

Main database: data/nararya.db

JKT48 databases:

- data/jkt48/quiz.db
- data/jkt48/gacha.db
- data/jkt48/cards.db

Media database: data/media/media.db

## Interaction flow

1. Discord receives an interaction.
2. Owner, maintenance, lockdown, and blacklist guards run.
3. Specialized command handlers process the command.
4. Errors are converted to safe Discord responses.
5. Background services continue independently.

## Data pipeline

The data pipeline runs every 10 seconds.

Sequence:

1. Scraper source health check.
2. Database URL discovery.
3. URL health check.
4. Registry matching.
5. Adapter classification.
6. Data audit persistence.
7. Log-channel alert for unresolved findings.

JKT48 sources remain on dedicated integrations.

## External data refresh

Indonesia data uses a 24-hour baseline refresh.

Shorter source-specific intervals are allowed where required.

Restaurant menu data uses a dedicated cache and parser.

## Media flow

1. Validate source.
2. Create media job.
3. Create isolated job directory.
4. Download or read attachment.
5. Run transformation or transcode.
6. Enforce output size.
7. Store output metadata.
8. Attach output to Discord.
9. Clean temporary files.

## Verification flow

1. /verify start creates a server-bound session.
2. The bot returns a private verification URL.
3. The website validates the ticket.
4. The user completes the human-interaction step.
5. The website returns a short-lived code.
6. The user submits /verify code.
7. The bot validates server, user, expiry, and attempts.
8. The optional verification role is assigned.

## Presence rotation

The bot stores Playing activity values in bot_settings.

src/services/presence-rotation.js rotates activity values at the configured interval.

## Shared tools

src/tools/toolbox.js provides parsing, validation, price utilities, pagination, cache helpers, retry helpers, URL helpers, date helpers, logging, and error serialization.

src/tools/http-client.js provides timeout handling, retries, header management, JSON/text/buffer requests, and URL probes.

## Extension rule

New external data should include:

1. A source contract.
2. An adapter.
3. A health entry.
4. A cache policy.
5. Tests.
6. Documentation.
7. A feature registry entry.
