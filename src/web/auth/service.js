import crypto from 'node:crypto';

const SESSION_TTL_MS=Math.max(3600,Number(process.env.WEB_SESSION_TTL_SECONDS||604800))*1000;
const OAUTH_STATE_TTL_MS=10*60*1000;
const PASSWORD_MIN=8;
const EMAIL_RE=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE=/^[a-zA-Z0-9_.-]{3,32}$/;

const randomToken=bytes=>crypto.randomBytes(bytes).toString('base64url');
const sha256=value=>crypto.createHash('sha256').update(String(value)).digest('hex');

function hashPassword(password,salt=crypto.randomBytes(16)){
  const derived=crypto.scryptSync(String(password),salt,64,{N:16384,r:8,p:1});
  return {salt:salt.toString('base64url'),hash:derived.toString('base64url')};
}

function verifyPassword(password,row){
  const salt=Buffer.from(row.password_salt,'base64url');
  const expected=Buffer.from(row.password_hash,'base64url');
  const actual=crypto.scryptSync(String(password),salt,expected.length,{N:16384,r:8,p:1});
  return actual.length===expected.length&&crypto.timingSafeEqual(actual,expected);
}

function publicUser(row){
  if(!row)return null;
  return {
    id:row.id,
    username:row.username,
    email:row.email,
    displayName:row.display_name,
    avatarUrl:row.avatar_url||null,
    provider:row.provider,
    language:row.language||'id',
    theme:row.theme||'light',
    timezone:row.timezone||'Asia/Jakarta',
    createdAt:row.created_at,
    lastLoginAt:row.last_login_at||null
  };
}

export function createWebAuthService({db}){
  db.exec(`
    CREATE TABLE IF NOT EXISTS web_users(
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      avatar_url TEXT,
      provider TEXT NOT NULL DEFAULT 'local',
      provider_subject TEXT,
      password_hash TEXT,
      password_salt TEXT,
      language TEXT NOT NULL DEFAULT 'id',
      theme TEXT NOT NULL DEFAULT 'light',
      timezone TEXT NOT NULL DEFAULT 'Asia/Jakarta',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      last_login_at INTEGER
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_web_users_provider_subject ON web_users(provider,provider_subject) WHERE provider_subject IS NOT NULL;
    CREATE TABLE IF NOT EXISTS web_sessions(
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_web_sessions_user ON web_sessions(user_id);
    CREATE TABLE IF NOT EXISTS web_oauth_states(
      state_hash TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      return_to TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );
  `);

  const queries={
    byEmail:db.prepare('SELECT * FROM web_users WHERE lower(email)=lower(?) LIMIT 1'),
    byUsername:db.prepare('SELECT * FROM web_users WHERE lower(username)=lower(?) LIMIT 1'),
    byId:db.prepare('SELECT * FROM web_users WHERE id=? LIMIT 1'),
    byProviderSubject:db.prepare('SELECT * FROM web_users WHERE provider=? AND provider_subject=? LIMIT 1')
  };

  function validateRegistration(input){
    const username=String(input.username||'').trim();
    const email=String(input.email||'').trim().toLowerCase();
    const password=String(input.password||'');
    const displayName=String(input.displayName||username).trim().slice(0,80);
    if(!USERNAME_RE.test(username))throw new Error('Username harus 3-32 karakter dan hanya boleh berisi huruf, angka, titik, garis bawah, atau tanda minus.');
    if(!EMAIL_RE.test(email))throw new Error('Email tidak valid.');
    if(password.length<PASSWORD_MIN)throw new Error('Password minimal 8 karakter.');
    if(!displayName)throw new Error('Nama tampilan wajib diisi.');
    return {username,email,password,displayName};
  }

  function createUser({username,email,password,displayName,provider='local',providerSubject=null,avatarUrl=null}){
    const now=Date.now();
    const id=randomToken(18);
    const credentials=password?hashPassword(password):{salt:null,hash:null};
    db.prepare(`INSERT INTO web_users(
      id,username,email,display_name,avatar_url,provider,provider_subject,password_hash,password_salt,
      language,theme,timezone,created_at,updated_at,last_login_at
    ) VALUES(?,?,?,?,?,?,?,?,?,'id','light','Asia/Jakarta',?,?,?)
    `).run(id,username,email,displayName,avatarUrl,provider,providerSubject,credentials.hash,credentials.salt,now,now,now);
    return queries.byId.get(id);
  }

  function createSession(userId){
    const token=randomToken(48);
    const now=Date.now();
    const expiresAt=now+SESSION_TTL_MS;
    db.prepare('INSERT INTO web_sessions(token_hash,user_id,created_at,expires_at) VALUES(?,?,?,?)').run(sha256(token),userId,now,expiresAt);
    return {token,expiresAt};
  }

  function userFromSession(token){
    if(!token)return null;
    const session=db.prepare('SELECT user_id,expires_at FROM web_sessions WHERE token_hash=?').get(sha256(token));
    if(!session)return null;
    if(session.expires_at<=Date.now()){
      db.prepare('DELETE FROM web_sessions WHERE token_hash=?').run(sha256(token));
      return null;
    }
    return queries.byId.get(session.user_id)||null;
  }

  function revokeSession(token){
    if(token)db.prepare('DELETE FROM web_sessions WHERE token_hash=?').run(sha256(token));
  }

  function register(input){
    const data=validateRegistration(input);
    if(queries.byEmail.get(data.email))throw new Error('Email sudah terdaftar.');
    if(queries.byUsername.get(data.username))throw new Error('Username sudah digunakan.');
    const user=createUser(data);
    const session=createSession(user.id);
    return {user:publicUser(user),...session};
  }

  function login(input){
    const email=String(input.email||'').trim().toLowerCase();
    const password=String(input.password||'');
    const user=queries.byEmail.get(email);
    if(!user||!user.password_hash||!user.password_salt||!verifyPassword(password,user))throw new Error('Email atau password salah.');
    const now=Date.now();
    db.prepare('UPDATE web_users SET last_login_at=?,updated_at=? WHERE id=?').run(now,now,user.id);
    const session=createSession(user.id);
    return {user:publicUser({...user,last_login_at:now}),...session};
  }

  function createOAuthState({provider,returnTo='/'}) {
    const state=randomToken(32);
    const now=Date.now();
    const safeReturn=/^\/(?!\/)/.test(returnTo)?returnTo:'/';
    db.prepare('INSERT INTO web_oauth_states(state_hash,provider,return_to,created_at,expires_at) VALUES(?,?,?,?,?)').run(sha256(state),provider,safeReturn,now,now+OAUTH_STATE_TTL_MS);
    return {state,returnTo:safeReturn};
  }

  function consumeOAuthState(state){
    const key=sha256(state||'');
    const row=db.prepare('SELECT * FROM web_oauth_states WHERE state_hash=?').get(key);
    db.prepare('DELETE FROM web_oauth_states WHERE state_hash=?').run(key);
    if(!row||row.expires_at<Date.now())throw new Error('OAuth state expired or invalid.');
    return row;
  }

  function upsertGoogleProfile(profile){
    const email=String(profile.email||'').trim().toLowerCase();
    const subject=String(profile.sub||'').trim();
    if(!email||!subject)throw new Error('Google tidak mengembalikan identitas email yang valid.');
    let user=queries.byProviderSubject.get('google',subject)||queries.byEmail.get(email);
    const now=Date.now();
    if(user){
      db.prepare('UPDATE web_users SET email=?,display_name=?,avatar_url=?,provider=CASE WHEN provider=\'local\' THEN provider ELSE \'google\' END,provider_subject=CASE WHEN provider=\'local\' THEN provider_subject ELSE ? END,last_login_at=?,updated_at=? WHERE id=?')
        .run(email,String(profile.name||user.display_name||email).slice(0,80),profile.picture||null,subject,now,now,user.id);
      user=queries.byId.get(user.id);
    }else{
      const base=(String(profile.name||'user').toLowerCase().replace(/[^a-z0-9]+/g,'.').replace(/^\.|\.$/g,'')||'user').slice(0,24);
      let username=base;
      let n=1;
      while(queries.byUsername.get(username)){
        username=(base.slice(0,20)+'.'+n).slice(0,32);
        n++;
      }
      user=createUser({
        username,email,
        displayName:String(profile.name||username).slice(0,80),
        provider:'google',
        providerSubject:subject,
        avatarUrl:profile.picture||null
      });
    }
    const session=createSession(user.id);
    return {user:publicUser(user),...session};
  }

  function updateSettings(userId,settings){
    const language=['id','en','ja','ko','zh','ar','es','pt','fr','de'].includes(String(settings.language))?String(settings.language):null;
    const theme=['light','dark','system'].includes(String(settings.theme))?String(settings.theme):null;
    const timezone=/^[A-Za-z_]+\/[A-Za-z_+-]+$/.test(String(settings.timezone||''))?String(settings.timezone):null;
    const current=queries.byId.get(userId);
    if(!current)throw new Error('Akun tidak ditemukan.');
    db.prepare('UPDATE web_users SET language=COALESCE(?,language),theme=COALESCE(?,theme),timezone=COALESCE(?,timezone),updated_at=? WHERE id=?').run(language,theme,timezone,Date.now(),userId);
    return publicUser(queries.byId.get(userId));
  }

  function changePassword(userId,{currentPassword,newPassword}){
    if(String(newPassword||'').length<PASSWORD_MIN)throw new Error('Password baru minimal 8 karakter.');
    const user=queries.byId.get(userId);
    if(!user)throw new Error('Akun tidak ditemukan.');
    if(!user.password_hash||!user.password_salt)throw new Error('Akun Google belum memiliki password lokal.');
    if(!verifyPassword(currentPassword,user))throw new Error('Password saat ini salah.');
    const next=hashPassword(newPassword);
    db.prepare('UPDATE web_users SET password_hash=?,password_salt=?,updated_at=? WHERE id=?').run(next.hash,next.salt,Date.now(),userId);
    db.prepare('DELETE FROM web_sessions WHERE user_id=?').run(userId);
    return createSession(userId);
  }

  function cleanup(){
    const now=Date.now();
    db.prepare('DELETE FROM web_sessions WHERE expires_at<=?').run(now);
    db.prepare('DELETE FROM web_oauth_states WHERE expires_at<=?').run(now);
  }

  return {
    register,login,publicUser,userFromSession,revokeSession,createSession,
    createOAuthState,consumeOAuthState,upsertGoogleProfile,updateSettings,changePassword,cleanup,
    getUser:userId=>publicUser(queries.byId.get(userId)),
    health:()=>{
      cleanup();
      return {
        users:db.prepare('SELECT COUNT(*) c FROM web_users').get()?.c||0,
        sessions:db.prepare('SELECT COUNT(*) c FROM web_sessions WHERE expires_at>?').get(Date.now())?.c||0,
        googleConfigured:Boolean(process.env.GOOGLE_CLIENT_ID&&process.env.GOOGLE_CLIENT_SECRET&&process.env.GOOGLE_REDIRECT_URI),
        sessionTtlSeconds:SESSION_TTL_MS/1000
      };
    }
  };
}
