# Contributing

## Principles

Keep the repository modular, testable, source-driven, and explicit about external dependencies.

## New feature checklist

A feature should include:

- implementation
- command registration when required
- database migration when required
- source contract when external data is used
- tests
- documentation
- feature registry entry

## External data

Do not place scraper logic inside the Discord interaction router.

Use a dedicated service and register the source in the scraper registry.

## Media

Keep media process execution inside src/media and tools/media.

Never concatenate untrusted input into a shell command.

## Testing

Run:

~~~
npm test
find src test -type f -name '*.js' -print0 | xargs -0 -n1 node --check
~~~

## Pull requests

Document:

- purpose
- implementation
- database changes
- external sources
- environment variables
- test results
- known limitations
