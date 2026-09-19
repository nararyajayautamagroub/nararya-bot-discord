# Feature Registry

Canonical registry source: src/config/features.js.

Active feature count: **150**.

## Notification

1. **JKT48 Public Scraper Matrix** (`jkt48-public-scraper-matrix`) — Scraper publik dengan timeout, retry, dedup, health state, dan adapter JKT48 Website, YouTube, Instagram, TikTok, X/Twitter, Threads, Tokopedia, Shopee, serta channel costume/member yang dikonfigurasi.
2. **JKT48 Feed Health** (`jkt48-feed-health`) — Status per feed, jumlah item, last success, dan error terakhir melalui /feed health.
3. **JKT48 Platform Feed** (`jkt48-feed`) — Feed publik untuk JKT48 Website, IDN, SHOWROOM, YouTube, Instagram, TikTok, X/Twitter, Threads, Tokopedia, Shopee, dan kanal costume.

## Support

4. **Separate Ticket Bot** (`separate-ticket-bot`) — Runtime bot ticket terpisah dengan database, panel, setup, claim, add/remove user, close, dan log.
5. **Support Tickets** (`tickets`) — Ticket privat dengan role staff dan tombol close.
6. **Appeal Ticket** (`appeal-ticket`) — Moderation appeal workflow.

## Discord

7. **Slash Command Registry** (`discord-commands`) — Namespace slash command terdaftar untuk JKT48, game, simulasi, utility, economy, moderation, support, feed, media, verification, dan developer tools.
8. **Help Command** (`help-command`) — Katalog semua fitur dan command dalam embed dengan filter kategori dan pagination.
9. **Setup Command** (`setup-command`) — Ringkasan dan konfigurasi welcome, log, scraper, Ramadan, disaster, dan fitur server lainnya. Owner bot only.

## JKT48

10. **JKT48 Member Database** (`jkt48-members`) — Sinkronisasi member generasi 1-14 dari sumber JSON publik.
11. **JKT48 Upcoming** (`jkt48-upcoming`) — Event, theater, setlist, songs, live, birthday, dan graduation.
12. **JKT48 Latest** (`jkt48-latest`) — Data terbaru event, theater, setlist, songs, live, birthday, graduation, SHOWROOM, dan IDN.
13. **JKT48 Birthday Notification** (`jkt48-birthday-notification`) — Birthday notification support.
14. **JKT48 Graduation Notification** (`jkt48-graduation-notification`) — Graduation notification support.
15. **JKT48 Theater Reminder** (`jkt48-theater-reminder`) — Theater reminder support.
16. **JKT48 Event Reminder** (`jkt48-event-reminder`) — Event reminder support.
17. **JKT48 Live Start Notification** (`jkt48-live-start-notification`) — Live notification support.
18. **SHOWROOM Notification Enhancement** (`showroom-notification-enhancement`) — Improved SHOWROOM feed metadata.
19. **IDN Live Notification Enhancement** (`idn-live-notification-enhancement`) — Improved IDN Live feed metadata.
20. **YouTube Upload Notification** (`youtube-upload-notification`) — YouTube upload notification.
21. **JKT48 News Digest** (`jkt48-news-digest`) — Periodic JKT48 news digest.
22. **Member Activity Digest** (`member-activity-digest`) — Member activity digest.

## Game

23. **JKT48 Quiz** (`jkt48-quiz`) — Mode quiz suara, foto member, setlist, lagu, dan random member.
24. **JKT48 Gacha** (`jkt48-gacha`) — Gacha kartu dengan rarity Common hingga Secret dan database terpisah.
25. **JKT48 Card Collection** (`jkt48-cards`) — Inventory dan statistik koleksi kartu.
26. **Google Street View Quiz** (`streetview-quiz`) — Tebak lokasi dari foto Google Street View dengan rotasi heading dan FOV acak.
27. **Game Cooldown** (`game-cooldown`) — Cooldown pemakaian game/gacha 10 detik per user dan server.
28. **Quiz Timeout** (`quiz-timeout`) — Setiap tebak-tebakan memiliki batas jawaban 1 menit dan gagal otomatis bila timeout.
29. **Simulation Tycoon** (`simulation`) — Profil kota, daily, bank, fishing, build, dan gacha.
30. **Guess Number** (`guess-number`) — Guess the number.
31. **Trivia** (`trivia`) — Trivia game.
32. **Word Chain** (`word-chain`) — Word chain game.
33. **Hangman** (`hangman`) — Hangman game.
34. **Rock Paper Scissors** (`rock-paper-scissors`) — Rock paper scissors.
35. **Dice Game** (`dice-game`) — Dice guessing game.
36. **Daily Challenge** (`daily-challenge`) — Daily game challenge.
37. **Game Leaderboard Expansion** (`game-leaderboard`) — Extended game leaderboard.

## Community

38. **Server Economy** (`economy`) — Saldo, daily reward, dan penyimpanan ekonomi per server/user.
39. **Leveling** (`leveling`) — XP dan level berdasarkan aktivitas pesan.
40. **Welcome / Goodbye** (`welcome-goodbye`) — Pesan otomatis saat member masuk atau keluar.
41. **Guild Invite Welcome** (`guild-invite-welcome`) — Pesan otomatis sekali saat bot berhasil diundang ke server baru.
42. **Server Configuration** (`serverconfig-command`) — Centralized server configuration.
43. **Auto Role** (`auto-role`) — Automatic role assignment.
44. **Auto Role Remove** (`auto-role-remove`) — Optional role removal.
45. **Server Rules Embed** (`server-rules-embed`) — Formatted server rules.
46. **Server Info Dashboard** (`server-info-dashboard`) — Server statistics dashboard.
47. **Channel Statistics** (`channel-statistics`) — Channel statistics.
48. **Role Statistics** (`role-statistics`) — Role statistics.
49. **Member Statistics** (`member-statistics`) — Member statistics.
50. **Economy Transaction History** (`economy-transactions`) — Economy transaction history.
51. **Economy Transfer** (`economy-transfer`) — User-to-user server transfers.
52. **Economy Leaderboard** (`economy-leaderboard`) — Economy leaderboard.
53. **Economy Shop** (`economy-shop`) — Economy shop.
54. **Economy Inventory** (`economy-inventory`) — Economy inventory.
55. **Daily Streak** (`daily-streak`) — Daily streak rewards.
56. **Server Bank** (`server-bank`) — Server economy bank.
57. **Economy Admin Controls** (`economy-admin-controls`) — Admin economy controls.
58. **Poll System** (`poll-system`) — Interactive polls.
59. **Reminder System** (`reminder-system`) — Scheduled channel reminders.
60. **Suggestion System** (`suggestion-system`) — Server suggestion box.
61. **Starboard** (`starboard`) — Starboard entries.
62. **User Profile Card** (`user-profile-card`) — EXP profile card with streak and card rarity.

## Security

63. **Moderation** (`moderation`) — Warning, ban, anti-spam, anti-invite, link moderation, dan timeout.
64. **Server Blacklist** (`blacklist-server`) — Blacklist server global dan otomatis meninggalkan server yang diblacklist.
65. **User Blacklist** (`blacklist-user`) — Blacklist user global untuk mencegah penggunaan bot.
66. **Web Verification** (`verification-web`) — Website verifikasi dengan checkbox I'm not a robot, ticket sesi, kode sekali pakai, dan expiry.
67. **Server-bound Verification Code** (`verification-server-code`) — Kode 4 karakter yang diturunkan dari secret unik setiap server Discord dan nonce sesi.
68. **Verification Role** (`verification-role`) — Role Discord opsional yang diberikan setelah kode valid ditukarkan.
69. **Verification Rate Limit** (`verification-rate-limit`) — Batas percobaan kode dan expiry untuk mengurangi brute force.
70. **Disaster Monitor** (`disaster-monitor`) — Monitoring gempa, tsunami, gunung api, dan kejadian bencana umum dari sumber resmi.
71. **Disaster Notification** (`disaster-notification`) — Notifikasi kejadian baru dengan lokasi dan sumber ke channel server.
72. **Emergency Lockdown** (`emergency-lockdown`) — Global emergency lockdown.
73. **Anti-Raid Protection** (`anti-raid`) — Join burst detection.
74. **Anti-Nuke Protection** (`anti-nuke`) — Mass destructive-action detection.
75. **Anti-Mass-Ban** (`anti-mass-ban`) — Mass ban spike detection.
76. **Anti-Mass-Kick** (`anti-mass-kick`) — Mass kick spike detection.
77. **Anti-Mass-Role** (`anti-mass-role`) — Mass role change detection.
78. **Anti-Mass-Channel** (`anti-mass-channel`) — Mass channel change detection.
79. **Anti-Mention Spam** (`anti-mention-spam`) — Mention spam protection.
80. **Anti-DM Spam** (`anti-dm-spam`) — Broadcast abuse protection.
81. **User Trust Score** (`user-trust-score`) — Behavior trust scoring.
82. **Suspicious Activity Detection** (`suspicious-activity`) — Threshold-based suspicious activity detection.
83. **Security Incident Log** (`security-incident-log`) — Persistent security incidents.
84. **Emergency Server Lock** (`emergency-server-lock`) — Per-server security lock.
85. **Auto Moderation Setup** (`auto-moderation-setup`) — Auto moderation thresholds.
86. **Verification Gate** (`verification-gate`) — Verification requirement settings.
87. **Warning History** (`warning-history`) — Warning history lookup.
88. **Warning Remove** (`warning-remove`) — Remove a warning.
89. **Warning Reset** (`warning-reset`) — Reset warnings.
90. **Temporary Ban** (`temporary-ban`) — Temporary moderation ban cases.
91. **Temporary Timeout** (`temporary-timeout`) — Temporary timeout cases.
92. **Kick Logging** (`kick-logging`) — Kick activity logging.
93. **Ban Logging** (`ban-logging`) — Ban activity logging.
94. **Moderation Case ID** (`moderation-case-id`) — Persistent moderation case IDs.
95. **Modlog Channel** (`modlog-channel`) — Moderation log channel.

## Developer

96. **Setting Bot Command** (`settingbot-command`) — Pengaturan global bot seperti maintenance dan activity, khusus owner bot.
97. **Verification Developer API** (`verification-api`) — Endpoint health dan feature discovery untuk monitoring/developer tooling.
98. **Security Policy** (`security-docs`) — SECURITY.md berisi pelaporan vulnerability dan praktik pengamanan secret.
99. **Feature Registry** (`feature-registry`) — Registry terpusat agar command, dokumentasi, dan website membaca daftar fitur dari sumber yang sama.
100. **Bot Info** (`bot-info`) — Informasi runtime, versi, guild count, dan runtime environment.
101. **Bot Feature Catalog** (`bot-features`) — Menampilkan registry fitur aktif dari bot.
102. **Bot Health** (`bot-health`) — Status uptime, memory, database, dan verification web server.
103. **Indonesia Data Refresh** (`indonesia-data-refresh`) — Refresh terjadwal untuk cache berita dan data publik Indonesia.
104. **Scraper Registry** (`scraper-registry`) — Registry sumber URL dan adapter untuk data eksternal non-JKT48.
105. **URL Health Check** (`url-health-check`) — Pemeriksaan kesehatan URL scraper setiap 10 detik.
106. **Database Data Audit** (`database-audit`) — Audit seluruh database bot, kolom URL, status sumber, dan error data.
107. **Scraper Method Suggestion** (`scraper-method-suggestion`) — Menyarankan metode JSON, RSS/XML, media, API, atau HTML ketika URL belum punya adapter.
108. **System Status** (`system-status`) — Slash command untuk runtime, database, scraper, audit, source, dan disaster status.
109. **Global Error Handler** (`global-error-handler`) — Global application error capture.
110. **Unhandled Rejection Monitor** (`unhandled-rejection-monitor`) — Unhandled Promise rejection logging.
111. **Uncaught Exception Monitor** (`uncaught-exception-monitor`) — Process exception monitoring and controlled shutdown logging.
112. **Graceful Shutdown** (`graceful-shutdown`) — Safe scheduler and database shutdown.
113. **Automatic Reconnect Recovery** (`reconnect-recovery`) — Scheduler recovery after Discord reconnect.
114. **Command Execution Profiler** (`command-profiler`) — Command execution timing diagnostics.
115. **Database Health Monitor** (`database-health-monitor`) — Periodic database health checks.
116. **Memory Usage Monitor** (`memory-monitor`) — Runtime RSS and heap monitoring.
117. **Event Loop Monitor** (`event-loop-monitor`) — Event loop stall diagnostics.
118. **API Latency Monitor** (`api-latency-monitor`) — External API latency tracking.
119. **Background Task Monitor** (`background-task-monitor`) — Background task health tracking.
120. **Owner Dashboard** (`owner-dashboard`) — Global bot dashboard.
121. **Owner Audit Log** (`owner-audit-log`) — Owner action audit records.
122. **Owner Broadcast** (`owner-broadcast`) — Owner global announcement broadcast.
123. **Bot Announcement Scheduler** (`owner-announcement-scheduler`) — Scheduled bot announcements.
124. **Global Command Toggle** (`global-command-toggle`) — Toggle command availability.
125. **Bot Presence Scheduler** (`presence-scheduler`) — Scheduled bot presence and activity.

## Indonesia

126. **Electronics Prices** (`electronics-prices`) — Scraper harga elektronik publik dengan kategori smartphone, laptop, tablet, TV, audio, kamera, gaming, storage, dan lainnya.
127. **Indonesia News** (`indonesia-news`) — Berita Indonesia dari RSS ANTARA dengan kategori nasional, ekonomi, bisnis, bursa, politik, dan hukum.
128. **Indonesia Stock Quotes** (`indonesia-stocks`) — Quote saham IDX dan alias IHSG melalui ticker .JK dengan cache.
129. **Fuel Prices** (`fuel-prices`) — Data acuan harga BBM Pertamina dengan cache 24 jam dan sumber resmi/terkait.
130. **Electricity Tariffs** (`electricity-prices`) — Ringkasan tarif listrik menurut golongan pelanggan dengan cache 24 jam.
131. **Food Prices** (`food-prices`) — Harga pangan strategis dan komoditas utama dengan cache 24 jam.
132. **Restaurant Menu Prices** (`restaurant-prices`) — Agregasi menu dan harga restoran publik Indonesia melalui direktori MenuKuliner.net, dengan pencarian kota, kategori, filter harga, pagination, cache, dan refresh.
133. **Weather** (`weather`) — City weather lookup.
134. **Currency Exchange** (`currency`) — Currency conversion with public API.
135. **Gold Price** (`gold-price`) — Public gold price lookup.
136. **Fuel Comparison** (`fuel-comparison`) — Fuel price comparison.
137. **Electricity Calculator** (`electricity-calculator`) — Electricity cost calculation.
138. **Toll Tariff Information** (`toll-tariff`) — Toll tariff information.
139. **Public Holiday Calendar** (`public-holiday-calendar`) — Indonesia public holiday lookup.
140. **Indonesian Time Utility** (`indonesia-timezone`) — WIB, WITA and WIT time display.

## Media

141. **Media Downloader** (`media-download`) — Download video, audio, dan image dari sumber publik melalui yt-dlp/direct metadata.
142. **Media Resolution** (`media-resolution`) — Pilihan resolusi video dari 360p sampai 2160p/best sesuai sumber.
143. **Vocal Separation** (`media-vocals`) — Pemisahan vocal dan instrumental dengan Demucs.
144. **Background Removal** (`media-background`) — Penghapusan background image/video dengan rembg.
145. **Watermark Removal** (`media-watermark`) — Inpainting watermark pada area koordinat yang diberikan.
146. **Media User Settings** (`media-settings`) — Default resolusi dan format media per user.

## Ramadan

147. **Upcoming Ramadan** (`ramadan-calendar`) — Informasi perkiraan Ramadan, Nuzulul Quran, akhir Ramadan dan status penetapan.
148. **Imsakiyah Schedule** (`imsakiyah`) — Jadwal imsak, subuh, maghrib, dan sholat berdasarkan kota.
149. **Sahur Notification** (`sahur-notification`) — Notifikasi sahur 30 menit sebelum imsak ke channel server.
150. **Iftar Notification** (`iftar-notification`) — Notifikasi berbuka saat waktu maghrib.

## Registry policy

Every active feature must map to implemented code. External non-JKT48 data features must also have a registered source contract, adapter, health check, and test coverage where practical.
