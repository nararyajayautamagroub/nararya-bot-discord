import crypto from 'node:crypto';

const CODE_ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH=Number(process.env.VERIFY_CODE_LENGTH||4);
const TTL_MS=Math.max(60,Number(process.env.VERIFY_TTL_SECONDS||600))*1000;
const MAX_ATTEMPTS=Math.max(3,Number(process.env.VERIFY_MAX_ATTEMPTS||5));

const hash=value=>crypto.createHash('sha256').update(String(value)).digest('hex');
const randomToken=()=>crypto.randomBytes(32).toString('base64url');

function ensureGuildSecret(db,guildId){
 const existing=db.prepare('SELECT guild_id,secret FROM verification_guilds WHERE guild_id=?').get(guildId);
 if(existing)return existing.secret;
 const secret=randomToken();
 db.prepare('INSERT INTO verification_guilds(guild_id,secret,created_at) VALUES(?,?,?)').run(guildId,secret,Date.now());
 return secret;
}

function deriveCode(secret,seed){
 const digest=crypto.createHmac('sha256',secret).update(seed).digest();
 let out='';
 for(let i=0;i<CODE_LENGTH;i++)out+=CODE_ALPHABET[digest[i]%CODE_ALPHABET.length];
 return out;
}

export function createVerificationService({db,baseUrl}){
 db.exec(`
 CREATE TABLE IF NOT EXISTS verification_guilds(
   guild_id TEXT PRIMARY KEY,
   secret TEXT NOT NULL,
   role_id TEXT,
   created_at INTEGER NOT NULL
 );
 CREATE TABLE IF NOT EXISTS verification_sessions(
   id TEXT PRIMARY KEY,
   guild_id TEXT NOT NULL,
   user_id TEXT NOT NULL,
   nonce_hash TEXT NOT NULL,
   challenge_hash TEXT NOT NULL,
   code_hash TEXT NOT NULL,
   issued_at INTEGER NOT NULL,
   expires_at INTEGER NOT NULL,
   attempts INTEGER NOT NULL DEFAULT 0,
   status TEXT NOT NULL DEFAULT 'pending',
   verified_at INTEGER
 );
 CREATE INDEX IF NOT EXISTS idx_verification_sessions_user ON verification_sessions(guild_id,user_id,status);
 `);

 return {
   createSession({guildId,userId}){
     const secret=ensureGuildSecret(db,guildId);
     const id=randomToken();
     const challenge=id;
     const code=deriveCode(secret,id);
     const now=Date.now();
     const expiresAt=now+TTL_MS;
     db.prepare('UPDATE verification_sessions SET status=\'expired\' WHERE guild_id=? AND user_id=? AND status=\'pending\'').run(guildId,userId);
     db.prepare('INSERT INTO verification_sessions(id,guild_id,user_id,nonce_hash,challenge_hash,code_hash,issued_at,expires_at,attempts,status) VALUES(?,?,?,?,?,?,?,?,0,\'pending\')').run(
       id,guildId,userId,hash(id),hash(challenge),hash(code),now,expiresAt
     );
     return {
       ticket:id,
       challenge,
       expiresAt,
       url:baseUrl.replace(/\/$/,'')+'/verify?ticket='+encodeURIComponent(id)
     };
   },

   getSession(ticket){
     const row=db.prepare('SELECT id,guild_id,user_id,issued_at,expires_at,status,attempts FROM verification_sessions WHERE id=?').get(ticket);
     if(!row)return null;
     if(row.status==='pending'&&Date.now()>row.expires_at){
       db.prepare('UPDATE verification_sessions SET status=\'expired\' WHERE id=?').run(ticket);
       row.status='expired';
     }
     return row;
   },

   completeWebChallenge({ticket,challenge,human,honeypot,startedAt}){
     const row=db.prepare('SELECT * FROM verification_sessions WHERE id=?').get(ticket);
     if(!row)throw new Error('Sesi verifikasi tidak ditemukan.');
     if(row.status!=='pending')throw new Error('Sesi verifikasi sudah tidak aktif.');
     if(Date.now()>row.expires_at){
       db.prepare('UPDATE verification_sessions SET status=\'expired\' WHERE id=?').run(ticket);
       throw new Error('Sesi verifikasi sudah kedaluwarsa.');
     }
     if(!human)throw new Error('Centang “I\'m not a robot” terlebih dahulu.');
     if(honeypot)throw new Error('Verifikasi tidak valid.');
     const elapsed=Date.now()-Number(startedAt||0);
     if(elapsed<1000)throw new Error('Selesaikan verifikasi secara normal.');
     if(hash(challenge)!==row.challenge_hash)throw new Error('Challenge tidak valid.');
     const secret=db.prepare('SELECT secret FROM verification_guilds WHERE guild_id=?').get(row.guild_id)?.secret;
     if(!secret)throw new Error('Secret server verifikasi tidak tersedia.');
     return {ticket,code:deriveCode(secret,ticket),expiresAt:row.expires_at};
   },

   redeemCode({guildId,userId,code}){
     const normalized=String(code||'').trim().toUpperCase();
     const row=db.prepare('SELECT * FROM verification_sessions WHERE guild_id=? AND user_id=? AND status=\'pending\' ORDER BY issued_at DESC LIMIT 1').get(guildId,userId);
     if(!row)throw new Error('Tidak ada sesi verifikasi aktif. Jalankan /verify start.');
     if(Date.now()>row.expires_at){
       db.prepare('UPDATE verification_sessions SET status=\'expired\' WHERE id=?').run(row.id);
       throw new Error('Kode verifikasi sudah kedaluwarsa.');
     }
     if(row.attempts>=MAX_ATTEMPTS){
       db.prepare('UPDATE verification_sessions SET status=\'locked\' WHERE id=?').run(row.id);
       throw new Error('Sesi terkunci karena terlalu banyak percobaan.');
     }
     const valid=crypto.timingSafeEqual(Buffer.from(hash(normalized),'hex'),Buffer.from(row.code_hash,'hex'));
     if(!valid){
       db.prepare('UPDATE verification_sessions SET attempts=attempts+1 WHERE id=?').run(row.id);
       const left=Math.max(0,MAX_ATTEMPTS-row.attempts-1);
       throw new Error('Kode salah. Sisa percobaan: '+left+'.');
     }
     db.prepare('UPDATE verification_sessions SET status=\'verified\',verified_at=? WHERE id=?').run(Date.now(),row.id);
     const roleId=db.prepare('SELECT role_id FROM verification_guilds WHERE guild_id=?').get(guildId)?.role_id||null;
     return {sessionId:row.id,roleId};
   },

   setRole(guildId,roleId){
     ensureGuildSecret(db,guildId);
     db.prepare('UPDATE verification_guilds SET role_id=? WHERE guild_id=?').run(roleId,guildId);
   },

   getConfig(guildId){
     ensureGuildSecret(db,guildId);
     return db.prepare('SELECT guild_id,role_id,created_at FROM verification_guilds WHERE guild_id=?').get(guildId);
   },

   health(){
     const pending=db.prepare("SELECT COUNT(*) c FROM verification_sessions WHERE status='pending'").get()?.c||0;
     return {pending,codeLength:CODE_LENGTH,ttlSeconds:TTL_MS/1000,maxAttempts:MAX_ATTEMPTS};
   }
 };
}
