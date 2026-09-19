# Security Policy

## Supported Versions

Security fixes are applied to the current default branch. Deployment environments should use the latest tagged or documented project version.

## Reporting a Vulnerability

Jangan mempublikasikan kredensial, token Discord, session ticket, kode verifikasi, database, atau proof-of-concept yang berisi rahasia di issue publik.

Laporkan kerentanan secara privat melalui repository owner atau kanal keamanan internal yang digunakan maintainer.

Sertakan:
- deskripsi masalah
- langkah reproduksi
- dampak yang dapat diverifikasi
- versi/commit yang terdampak
- bukti minimal yang tidak membocorkan secret

## Secrets

Jangan commit:
- `.env`
- `DISCORD_TOKEN`
- API key
- session secret
- database produksi
- verification ticket
- verification code

Gunakan environment variable dan secret manager pada deployment.

## Verification Security

Sistem verifikasi menggunakan:
- session ticket acak
- secret unik per server Discord
- kode 4 karakter yang diturunkan dari HMAC secret server + nonce sesi
- penyimpanan hash kode, bukan kode plaintext
- expiry sesi
- batas percobaan kode
- one-time redemption
- role assignment hanya setelah kode valid
- honeypot dan minimum interaction delay pada website

Checkbox “I’m not a robot” pada website adalah lapisan verifikasi aplikasi, bukan pengganti layanan CAPTCHA pihak ketiga. Untuk deployment publik berisiko tinggi, gunakan Cloudflare Turnstile atau hCaptcha dan simpan secret validasi hanya di server.

## Reporting Abuse

Untuk spam, scraping agresif, token leakage, impersonation, atau penggunaan bot yang melanggar aturan platform, kirimkan bukti dan timestamp kepada maintainer tanpa menyertakan secret.

## Data Retention

Session verifikasi sebaiknya dibersihkan secara berkala. Database produksi harus memiliki backup, permission file yang ketat, dan akses minimum.

## Dependency Security

Jalankan audit dependency dan pertahankan yt-dlp, FFmpeg, Python packages, Node.js, dan dependency aplikasi pada versi yang masih didukung.


## API Keys

Treat `GOOGLE_MAPS_API_KEY` and any future market/data provider API keys as secrets. Restrict Google Maps keys to the APIs and applications required by the deployment, and never expose them in frontend source, Discord messages, logs, or public repository files.
