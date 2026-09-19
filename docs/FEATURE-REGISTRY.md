# Feature Registry

Daftar fitur aktif bot berasal dari `src/config/features.js` dan digunakan oleh command developer serta endpoint `/api/features`.

## 30 fitur aktif

### Discord
1. Slash Command Registry

### JKT48
2. JKT48 Member Database
3. JKT48 Upcoming
4. JKT48 Latest

### Notification
5. JKT48 Platform Feed

### Game
6. JKT48 Quiz
7. JKT48 Gacha
8. JKT48 Card Collection
9. Simulation Tycoon

### Community
10. Server Economy
11. Leveling
12. Welcome / Goodbye

### Security
13. Moderation
14. Web Verification
15. Server-bound Verification Code
16. Verification Role
17. Verification Rate Limit

### Support
18. Support Tickets

### Media
19. Media Downloader
20. Media Resolution
21. Vocal Separation
22. Background Removal
23. Watermark Removal
24. Media User Settings

### Developer
25. Security Policy
26. Feature Registry
27. Bot Info
28. Bot Feature Catalog
29. Bot Health
30. Verification Developer API

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

Kode diturunkan dari secret unik server Discord + ticket sesi. Karena itu, kode tidak dirancang untuk dipakai lintas server.

## Developer endpoints

- `GET /health`
- `GET /api/verify/session?ticket=...`
- `POST /api/verify/complete`
- `GET /api/features`

Endpoint hanya mengekspos data yang diperlukan untuk fungsi developer dan verification flow. Secret server serta hash kode tidak dikirim ke browser.
