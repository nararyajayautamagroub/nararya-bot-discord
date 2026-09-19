# Feature Registry

Daftar fitur aktif bot berasal dari `src/config/features.js`.

## Kategori

- Discord
- JKT48
- Notification
- Game
- Community
- Security
- Support
- Media
- Developer

## Developer-facing features

- Feature Registry
- Bot Info
- Bot Feature Catalog
- Bot Health
- Security Policy
- Web Verification API

## Verifikasi

Flow:
1. User menjalankan `/verify start`.
2. Bot memberikan URL dengan session ticket.
3. User membuka website.
4. User mencentang “I’m not a robot”.
5. Server memvalidasi session, challenge, honeypot, dan waktu interaksi.
6. Website menampilkan kode verifikasi 4 karakter.
7. User menjalankan `/verify code code:<kode>`.
8. Bot memvalidasi kode terhadap server Discord, session, expiry, dan attempt limit.
9. Jika role verifikasi dikonfigurasi, bot memberikan role tersebut.

Kode dibuat berdasarkan secret unik server + nonce sesi. Karena itu, kode tidak dirancang untuk dipakai lintas server.
