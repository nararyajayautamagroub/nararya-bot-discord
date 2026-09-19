# Contributing

Thank you for contributing to Nararya Bot Discord.

## Before contributing

Please:
1. Read [LICENSE](./LICENSE).
2. Check [CHANGELOG.md](./CHANGELOG.md) for existing work.
3. Read the relevant documentation in `docs/`.
4. Make sure changes respect third-party platform terms and the rights of any media or datasets used.

## Development

Recommended setup:

```bash
npm install
npm test
npm run deploy
npm start
```

Do not commit:
- `.env`
- Discord tokens
- API keys
- database files containing private server data
- private credentials
- private or copyrighted media without permission

## Code guidelines

Keep features modular and avoid putting unrelated systems into a single database or module.

For JKT48 game/card development:
- quiz persistence belongs in `data/jkt48/quiz.db`
- gacha persistence belongs in `data/jkt48/gacha.db`
- card persistence belongs in `data/jkt48/cards.db`

General bot features such as tickets, economy, moderation, levels, guild configuration, and tycoon state continue using the main application database.

Use the existing branded embed helper and preserve consistent error handling.

## Pull requests

A pull request should include:
- a clear description of the change
- relevant tests or validation
- documentation updates when behavior or commands change
- migration notes when database schemas change

Do not include secrets in commits or issue reports.

## Scope

Contributions may be reviewed, modified, rejected, or merged at the project maintainer's discretion.
