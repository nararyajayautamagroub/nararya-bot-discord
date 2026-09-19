# JKT48 Game Service

This directory contains the JKT48 quiz, gacha, card, rarity, reveal, and game-session services.

## Database isolation

The JKT48 game system uses separate SQLite databases:

- quiz.db
- gacha.db
- cards.db

## Game rules

Quiz and gacha actions use a shared 10-second cooldown per guild and user.

Each active quiz session expires after 1 minute.

A timeout is recorded as a failed attempt and does not grant points.

## Card system

Cards support rarity levels from Common through Secret.

Card data is stored separately from the quiz and gacha state.

## General Street View

Google Street View is implemented as a general location game under the generic game service. It is not part of the JKT48 mode registry.

## Asset policy

Quiz media must use public HTTP or HTTPS URLs that the bot can access without authentication bypass.

## Error handling

Game sessions are persistent enough to recover from process restarts. Active sessions are re-scheduled when the bot starts.
