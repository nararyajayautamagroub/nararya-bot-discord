# Verification System

## Commands

- `/verify start`
- `/verify code code:<4-char-code>`
- `/verify status`
- `/verify role role:<role>`

## Environment

```env
VERIFY_WEB_HOST=0.0.0.0
VERIFY_WEB_PORT=3000
VERIFY_WEB_BASE_URL=http://localhost:3000
VERIFY_WEB_DISABLED=false
VERIFY_CODE_LENGTH=4
VERIFY_TTL_SECONDS=600
VERIFY_MAX_ATTEMPTS=5
```

Set `VERIFY_WEB_BASE_URL` ke domain publik saat deployment, misalnya `https://verify.example.com`.

## Important

Sistem ini tidak dapat membuktikan secara absolut bahwa pengunjung adalah manusia. Checkbox adalah UX verification step. Anti-bot yang lebih kuat memerlukan provider CAPTCHA/Turnstile dengan verifikasi server-side.

Jangan taruh secret provider CAPTCHA di frontend.
