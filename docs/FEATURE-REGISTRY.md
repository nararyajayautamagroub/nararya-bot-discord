# Feature Registry

Daftar fitur aktif bot berasal dari `src/config/features.js`.

## 57 fitur aktif

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
9. Google Street View Quiz
10. Game Cooldown
11. Quiz Timeout
12. Simulation Tycoon

### Community
13. Server Economy
14. Leveling
15. Welcome / Goodbye

### Security
16. Moderation
17. Web Verification
18. Server-bound Verification Code
19. Verification Role
20. Verification Rate Limit

### Support
21. Support Tickets

### Media
22. Media Downloader
23. Media Resolution
24. Vocal Separation
25. Background Removal
26. Watermark Removal
27. Media User Settings

### Developer
28. Security Policy
29. Feature Registry
30. Bot Info
31. Bot Feature Catalog
32. Bot Health
33. Verification Developer API
34. Indonesia Data Refresh

### Indonesia
35. Indonesia News
36. Indonesia Stock Quotes
37. Fuel Prices
38. Electricity Tariffs
39. Food Prices

### Ramadan
40. Upcoming Ramadan
41. Imsakiyah Schedule
42. Sahur Notification
43. Iftar Notification

### Developer
44. Scraper Registry
45. URL Health Check
46. Database Data Audit
47. Scraper Method Suggestion
48. System Status

### Security
49. Disaster Monitor
50. Disaster Notification
51. Help Command
52. Setup Command
53. Electronics Prices
54. Setting Bot Command
55. Server Blacklist
56. User Blacklist
57. Guild Invite Welcome

## Game policy

All quiz and gacha actions share a 10-second per-user/server cooldown.

Every active guessing session has a 1-minute answer window. Timeout is recorded as a failed attempt and does not grant quiz points.

Google Street View mode requires `GOOGLE_MAPS_API_KEY`.

## Indonesia data

- News uses public ANTARA RSS feeds.
- Stock quotes use IDX `.JK` symbols through Yahoo Finance data endpoints.
- Fuel, electricity, and food sources are cached and refreshed on source-specific intervals.
- Ramadan prayer schedules use city-based prayer schedule data.
- Ramadan dates include environment overrides because official Indonesian dates are established through the relevant government process.

See [INDONESIA-DATA.md](./INDONESIA-DATA.md) for data-source details.


## Extended Features 58-150

58. **Global Error Handler** — Global application error capture.
59. **Unhandled Rejection Monitor** — Unhandled Promise rejection logging.
60. **Uncaught Exception Monitor** — Process exception monitoring and controlled shutdown logging.
61. **Graceful Shutdown** — Safe scheduler and database shutdown.
62. **Automatic Reconnect Recovery** — Scheduler recovery after Discord reconnect.
63. **Command Execution Profiler** — Command execution timing diagnostics.
64. **Database Health Monitor** — Periodic database health checks.
65. **Memory Usage Monitor** — Runtime RSS and heap monitoring.
66. **Event Loop Monitor** — Event loop stall diagnostics.
67. **API Latency Monitor** — External API latency tracking.
68. **Background Task Monitor** — Background task health tracking.
69. **Runtime Diagnostics** — Owner runtime diagnostics.
70. **Owner Dashboard** — Global bot dashboard.
71. **Owner Audit Log** — Owner action audit records.
72. **Owner Broadcast** — Owner global announcement broadcast.
73. **Bot Announcement Scheduler** — Scheduled bot announcements.
74. **Global Command Toggle** — Toggle command availability.
75. **Per-Command Maintenance** — Per-command maintenance switches.
76. **Global Rate Limit Control** — Global rate limit configuration.
77. **Global Cooldown Control** — Global game cooldown configuration.
78. **Bot Presence Scheduler** — Scheduled bot presence and activity.
79. **Emergency Lockdown** — Global emergency lockdown.
80. **Anti-Raid Protection** — Join burst detection.
81. **Anti-Nuke Protection** — Mass destructive-action detection.
82. **Anti-Mass-Ban** — Mass ban spike detection.
83. **Anti-Mass-Kick** — Mass kick spike detection.
84. **Anti-Mass-Role** — Mass role change detection.
85. **Anti-Mass-Channel** — Mass channel change detection.
86. **Anti-Mention Spam** — Mention spam protection.
87. **Anti-DM Spam** — Broadcast abuse protection.
88. **User Trust Score** — Behavior trust scoring.
89. **Suspicious Activity Detection** — Threshold-based suspicious activity detection.
90. **Security Incident Log** — Persistent security incidents.
91. **Emergency Server Lock** — Per-server security lock.
92. **Server Configuration** — Centralized server configuration.
93. **Auto Moderation Setup** — Auto moderation thresholds.
94. **Auto Role** — Automatic role assignment.
95. **Auto Role Remove** — Optional role removal.
96. **Verification Gate** — Verification requirement settings.
97. **Server Rules Embed** — Formatted server rules.
98. **Server Info Dashboard** — Server statistics dashboard.
99. **Channel Statistics** — Channel statistics.
100. **Role Statistics** — Role statistics.
101. **Member Statistics** — Member statistics.
102. **Warning History** — Warning history lookup.
103. **Warning Remove** — Remove a warning.
104. **Warning Reset** — Reset warnings.
105. **Temporary Ban** — Temporary moderation ban cases.
106. **Temporary Timeout** — Temporary timeout cases.
107. **Kick Logging** — Kick activity logging.
108. **Ban Logging** — Ban activity logging.
109. **Moderation Case ID** — Persistent moderation case IDs.
110. **Modlog Channel** — Moderation log channel.
111. **Appeal Ticket** — Moderation appeal workflow.
112. **JKT48 Birthday Notification** — Birthday notification support.
113. **JKT48 Graduation Notification** — Graduation notification support.
114. **JKT48 Theater Reminder** — Theater reminder support.
115. **JKT48 Event Reminder** — Event reminder support.
116. **JKT48 Live Start Notification** — Live notification support.
117. **SHOWROOM Notification Enhancement** — Improved SHOWROOM feed metadata.
118. **IDN Live Notification Enhancement** — Improved IDN Live feed metadata.
119. **YouTube Upload Notification** — YouTube upload notification.
120. **JKT48 News Digest** — Periodic JKT48 news digest.
121. **Member Activity Digest** — Member activity digest.
122. **Weather** — City weather lookup.
123. **Currency Exchange** — Currency conversion with public API.
124. **Gold Price** — Public gold price lookup.
125. **Fuel Comparison** — Fuel price comparison.
126. **Electricity Calculator** — Electricity cost calculation.
127. **Toll Tariff Information** — Toll tariff information.
128. **Public Holiday Calendar** — Indonesia public holiday lookup.
129. **Indonesian Time Utility** — WIB, WITA and WIT time display.
130. **Economy Transaction History** — Economy transaction history.
131. **Economy Transfer** — User-to-user server transfers.
132. **Economy Leaderboard** — Economy leaderboard.
133. **Economy Shop** — Economy shop.
134. **Economy Inventory** — Economy inventory.
135. **Daily Streak** — Daily streak rewards.
136. **Server Bank** — Server economy bank.
137. **Economy Admin Controls** — Admin economy controls.
138. **Guess Number** — Guess the number.
139. **Trivia** — Trivia game.
140. **Word Chain** — Word chain game.
141. **Hangman** — Hangman game.
142. **Rock Paper Scissors** — Rock paper scissors.
143. **Dice Game** — Dice guessing game.
144. **Daily Challenge** — Daily game challenge.
145. **Game Leaderboard Expansion** — Extended game leaderboard.
146. **Poll System** — Interactive polls.
147. **Reminder System** — Scheduled channel reminders.
148. **Suggestion System** — Server suggestion box.
149. **Starboard** — Starboard entries.
150. **User Profile Card** — EXP profile card with streak and card rarity.

Total active features: **150**.
