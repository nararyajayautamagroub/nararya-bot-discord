import type{Attachment}from'discord.js';
export function isAudioAttachment(a:Attachment){return Boolean(a.contentType?.startsWith('audio/')||/\.(mp3|wav|ogg|flac|m4a|aac|opus|webm|mp4|mkv|mov)$/i.test(a.name))}
export function pickAudioAttachment(list:Iterable<Attachment>){for(const a of list)if(isAudioAttachment(a))return a;return null}
