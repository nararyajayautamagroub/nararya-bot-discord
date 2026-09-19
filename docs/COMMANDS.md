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

## Simulation

- `/sim profile`
- `/sim daily`
- `/sim bank amount:<integer>`
- `/sim fish`
- `/sim build`
- `/sim gacha`

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

## Permissions

Moderation commands use the corresponding Discord moderation permissions. Quiz asset management requires Manage Server permissions.

## Deployment

After changing command definitions, register them with:

```bash
npm run deploy
```

Command registration is separate from starting the bot process.


## Media

- `/media download type:<video|audio|image> url:<url> [resolution] [format]`
- `/media vocals [url|file] [format]`
- `/media background type:<image|video> [url|file]`
- `/media watermark type:<image|video> [url|file] x:<integer> y:<integer> width:<integer> height:<integer>`
- `/media settings [resolution] [video_format] [audio_format]`

Media operations are processed asynchronously from the Discord interaction perspective and return the generated file when it is within the configured upload limit.
