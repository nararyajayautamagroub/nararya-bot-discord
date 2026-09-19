export function isUrl(v:string){try{const u=new URL(v);return ['http:','https:'].includes(u.protocol)}catch{return false}}
export function safeFileName(v:string){return v.replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,160)}
