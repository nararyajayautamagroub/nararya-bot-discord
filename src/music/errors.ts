export class MusicError extends Error{constructor(message:string){super(message);this.name='MusicError'}}
export class UnsupportedMediaError extends MusicError{}
export class DownloadError extends MusicError{}
