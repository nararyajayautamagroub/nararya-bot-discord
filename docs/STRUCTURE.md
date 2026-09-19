# Repository Structure

## Source tree

~~~
src/
  config/
  commands/
  jkt48/
  media/
  music/
  security/
  services/
  tools/
  web/
  index.js
  deploy-commands.js

tools/
  media/

test/
docs/
website/
~~~

## Responsibilities

### src/config

Feature definitions and application configuration.

### src/jkt48

JKT48 source connectors, member database, feed service, and JKT48 command services.

### src/media

Media download, transformations, vocal separation, background removal, watermark removal, media database, and Discord command handling.

### src/security

Owner control, blacklists, security functions, and verification security.

### src/services

Domain services for Indonesia data, disasters, games, leveling, notification feeds, restaurant prices, scraper orchestration, and audit.

### src/tools

Shared utilities and HTTP handling.

### src/web/verification

Verification HTTP server and public verification page.

### tools/media

Python transformation scripts.

### test

Automated tests.

## Runtime state

Runtime SQLite files and generated media directories are deployment state and must remain outside version control.
