# JKT48 Website

This website is a read-only frontend for JKT48 member data and bot feature documentation.

## Data source

The frontend reads the configured public member JSON sources:

- AllMember.json
- ActiveMember.json

The frontend does not invent fallback member data when the source fails.

## Features

- member search
- generation filter
- status filter
- pagination
- source status
- public feature reference
- command reference

## Runtime

The page can be served as static files.

The frontend uses browser-native APIs and does not require a backend session.

## Security

External images are rendered with restrictive referrer handling.

Source URLs must remain public and should be replaced in the frontend configuration when the upstream repository changes.
