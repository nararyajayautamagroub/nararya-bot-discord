export type MusicSource='file'|'url'|'stream';
export interface Track{title:string;url:string;source:MusicSource;duration?:number;requestedBy:string;localPath?:string;mime?:string}
export interface GuildPlayerState{guildId:string;voiceChannelId:string;textChannelId:string;queue:Track[];index:number;volume:number;loop:'off'|'track'|'queue';paused:boolean}
