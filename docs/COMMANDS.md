# Command Reference

This document describes the active slash-command structure deployed by the project.

## JKT48

### Member
- `/jkt48 member query:<name>`
- `/jkt48 members [generation:<1-14>]`

### Upcoming
- `/jkt48 upcoming event`
- `/jkt48 upcoming theater`
- `/jkt48 upcoming setlist`
- `/jkt48 upcoming songs`
- `/jkt48 upcoming live`
- `/jkt48 upcoming birthday`
- `/jkt48 upcoming graduation`

### Latest
- `/jkt48 latest event`
- `/jkt48 latest theater`
- `/jkt48 latest setlist`
- `/jkt48 latest songs`
- `/jkt48 latest live`
- `/jkt48 latest birthday`
- `/jkt48 latest graduation`
- `/jkt48 latest live_showroom`
- `/jkt48 latest live_idn`

## JKT48 Game

- `/jkt48game play mode:<mode>`
- `/jkt48game gacha`
- `/jkt48game inventory`
- `/jkt48game leaderboard`
- `/jkt48game asset_add`
- `/jkt48game asset_list`

### Quiz Modes

- `song`
- `memberVoice`
- `activePhoto`
- `graduationPhoto`
- `randomMember`
- `setlistPhoto`
- `songPhoto`
- `streetView`

All quiz and gacha actions use a **10-second cooldown** per user/server. An unanswered active quiz fails automatically after **1 minute**.

## Simulation

- `/sim profile`
- `/sim daily`
- `/sim bank amount:<integer>`
- `/sim fish`
- `/sim build`
- `/sim gacha`

The simulation gacha also uses the shared 10-second game cooldown.

## Utility

- `/utility ping`
- `/utility server`
- `/utility user [target:<user>]`
- `/utility level`

## Economy

- `/economy balance`
- `/economy daily`

## Moderation

- `/moderation warn user:<user> [reason:<text>]`
- `/moderation ban user:<user> [reason:<text>]`

## Support

- `/support ticket`

## Feed

- `/feed list`
- `/feed add`
- `/feed remove id:<integer>`
- `/feed test id:<integer>`

## Indonesia News

- `/news latest [category]`
- `/news sources`

Categories:
- latest
- top
- economy
- finance
- business
- market
- politics
- law

## Indonesia Market

- `/market stock symbol:<ticker>`
- `/market ihsg`

Indonesian stock tickers are resolved to the IDX `.JK` suffix. Quote data can be delayed.

## Indonesia Prices

- `/prices fuel`
- `/prices electricity`
- `/prices food`
- `/prices all`

Price source caches are refreshed according to source-specific TTLs. Fuel and electricity can vary by region, customer class, and official pricing changes.

## Ramadan

- `/ramadan upcoming`
- `/ramadan today city:<city>`
- `/ramadan setup city:<city> channel:<channel>`
- `/ramadan disable`
- `/ramadan test`

`/ramadan setup` enables automated sahur and iftar notifications for the configured city.

## Verification

- `/verify start`
- `/verify code code:<4-character-code>`
- `/verify status`
- `/verify role role:<role>`

## Developer

- `/bot info`
- `/bot features`
- `/bot health`

## Media

- `/media video url:<url> [resolution] [format]`
- `/media audio url:<url> [format]`
- `/media image url:<url>`
- `/media vocals [url|file] [format]`
- `/media background type:<image|video> [url|file]`
- `/media watermark type:<image|video> [url|file] x:<integer> y:<integer> width:<integer> height:<integer>`
- `/media settings [resolution] [video_format] [audio_format]`

## Permissions

Moderation commands use Discord moderation permissions. Quiz asset administration requires Manage Server. Ramadan setup and verification role configuration require Manage Server.

## Deployment

After changing command definitions, register them with:

```bash
npm run deploy
```


## General Game

- `/game streetview`
- `/game status`

## Disaster

- `/disaster status`
- `/disaster latest [type]`
- `/disaster earthquake`
- `/disaster tsunami`
- `/disaster volcano`
- `/disaster general`
- `/disaster setup channel:<channel> [min_magnitude]`
- `/disaster disable`

## System Status

- `/status system`
- `/status scrapers`
- `/status data`
- `/status disasters`
- `/status sources`

## Upcoming

- `/upcoming ramadan`
- `/upcoming disasters`

The data audit checks all configured bot databases and stored URLs every 10 seconds. JKT48 repository/source URLs are exempt from generic scraper validation.


## Help

- `/help`
- `/help category:<category>`
- `/help page:<number>`

## Setup

- `/setup overview`
- `/setup welcome channel:<channel>`
- `/setup log channel:<channel>`

## Electronics

- `/electronics`
- `/electronics category:<category>`
- `/electronics query:<product-or-brand>`
- `/electronics category:<category> query:<product-or-brand> limit:<1-25>`

Harga berasal dari katalog publik yang discrape. Harga final dapat berubah pada marketplace.


## Owner Controls

The following commands are restricted to the bot owner:

- `/setup overview`
- `/setup welcome channel:<channel>`
- `/setup log channel:<channel>`
- `/settingbot status`
- `/settingbot maintenance enabled:<true|false>`
- `/settingbot activity text:<text>`
- `/settingbot reset`
- `/blacklistserver add server_id:<id> reason:<reason>`
- `/blacklistserver remove server_id:<id>`
- `/blacklistserver list`
- `/blacklistusers add user_id:<id> reason:<reason>`
- `/blacklistusers remove user_id:<id>`
- `/blacklistusers list`

Configure `BOT_OWNER_IDS` as a comma-separated list of Discord user IDs. The runtime also recognizes the Discord application owner after login. Owners bypass blacklist and maintenance restrictions.


## Extended Features

### Owner
- `/owner dashboard`
- `/owner broadcast text:<text>`
- `/owner rotation texts:<text1,text2>`
- `/owner maintenance enabled:<true|false>`
- `/owner toggle command:<name> enabled:<true|false>`
- `/owner schedule text:<text> delay_seconds:<seconds>`

### Server Security
- `/security status`
- `/security setup key:<raid|nuke|mention|lock> enabled:<true|false>`
- `/security trust user:<user>`
- `/security incident type:<type> detail:<detail>`
- `/security lockdown enabled:<true|false>`

### Server Configuration
- `/serverconfig view`
- `/serverconfig set key:<key> value:<value>`
- `/serverconfig rules text:<text>`
- `/serverconfig stats`
- `/serverconfig autorole role:<role>`
- `/serverconfig autoroleremove enabled:<true|false>`
- `/serverconfig automod mention_threshold:<2-20>`

### Indonesia
- `/indonesia time`
- `/indonesia weather city:<city>`
- `/indonesia currency from:<code> to:<code> amount:<number>`
- `/indonesia gold`
- `/indonesia fuel`
- `/indonesia electricity kwh:<number> tariff:<number>`
- `/indonesia toll`
- `/indonesia holiday [year]`

### Finance, Games, Community
- `/finance transfer user:<user> amount:<amount>`
- `/finance history`
- `/finance leaderboard`
- `/finance shop`
- `/finance inventory`
- `/finance streak`
- `/finance bank amount:<amount>`
- `/games number|trivia|wordchain|hangman|rps|dice|daily|leaderboard`
- `/community poll|remind|suggest|profile|star`

### EXP Profile Card
`/utility level` now renders an SVG profile card containing EXP, level progress, streak, win count, and the highest JKT48 card rarity owned by the user.

Current catalog: **150 features**.