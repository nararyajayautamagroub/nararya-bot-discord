# JKT48 Center Website

Frontend khusus fitur JKT48 untuk Nararya Bot Discord.

## Fitur

- Header merah dengan background putih.
- Tombol hamburger = untuk navigasi mobile.
- Member database generasi 1–14.
- Pencarian nama/nickname.
- Filter generasi.
- Filter status aktif, graduated, dan historical.
- Status kesehatan sumber data.
- Kartu fitur JKT48.
- Ringkasan game quiz dan gacha.
- Ringkasan feed JKT48.
- Daftar slash command JKT48.
- Informasi sumber data dan transparansi.
- Responsive desktop, tablet, dan mobile.
- Read-only, tanpa token/API key rahasia.
- Graceful error saat source publik tidak tersedia.

## Sumber Member

Website memakai sumber publik yang sama dengan service JKT48 member database bot.

All members:
https://raw.githubusercontent.com/FrenzY8/JKT48-Member/refs/heads/main/AllMember.json

Active members:
https://raw.githubusercontent.com/FrenzY8/JKT48-Member/refs/heads/main/ActiveMember.json

Frontend melakukan fetch langsung ke sumber publik dari browser.

## Struktur

website/jkt48/
  index.html
  style.css
  app.js
  README.md

## Local Preview

Gunakan static HTTP server dari root repository, contoh:

npx serve website/jkt48

Membuka index.html langsung dengan file:// dapat terkena pembatasan browser terhadap fetch(), sehingga HTTP server lebih disarankan.

## GitHub Pages

Workflow deploy tersedia pada:

.github/workflows/jkt48-pages.yml

GitHub Pages tetap harus diaktifkan pada pengaturan repository.

## Catatan

Website ini merupakan dashboard informasi read-only untuk fitur JKT48. Data eksternal dapat berubah ketika struktur sumber publik berubah.
