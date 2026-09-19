import {EXTENDED_FEATURES} from "../config/extended-features.js";
import {getFuelPrices} from "./indonesia/data.js";
import {createXpCardBuffer} from "./leveling/xp-card.js";

function ensureTables(db){
 db.exec(
 "CREATE TABLE IF NOT EXISTS feature_settings(guild_id TEXT,key TEXT,value TEXT,updated_at INTEGER NOT NULL,PRIMARY KEY(guild_id,key));"+
 "CREATE TABLE IF NOT EXISTS security_incidents(id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT,user_id TEXT,type TEXT,detail TEXT,created_at INTEGER NOT NULL);"+
 "CREATE TABLE IF NOT EXISTS member_trust(guild_id TEXT,user_id TEXT,score INTEGER DEFAULT 100,updated_at INTEGER NOT NULL,PRIMARY KEY(guild_id,user_id));"+
 "CREATE TABLE IF NOT EXISTS moderation_cases(id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT,target_id TEXT,moderator_id TEXT,type TEXT,reason TEXT,created_at INTEGER NOT NULL,expires_at INTEGER,status TEXT DEFAULT 'open');"+
 "CREATE TABLE IF NOT EXISTS reminders(id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT,user_id TEXT,channel_id TEXT,text TEXT,due_at INTEGER,sent_at INTEGER);"+
 "CREATE TABLE IF NOT EXISTS suggestions(id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT,user_id TEXT,text TEXT,status TEXT DEFAULT 'pending',created_at INTEGER);"+
 "CREATE TABLE IF NOT EXISTS economy_transactions(id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT,user_id TEXT,type TEXT,amount INTEGER,balance_after INTEGER,meta TEXT,created_at INTEGER);"+
 "CREATE TABLE IF NOT EXISTS daily_streaks(guild_id TEXT,user_id TEXT,streak INTEGER DEFAULT 0,last_claim_date TEXT,PRIMARY KEY(guild_id,user_id));"+
 "CREATE TABLE IF NOT EXISTS server_bank(guild_id TEXT PRIMARY KEY,balance INTEGER DEFAULT 0,updated_at INTEGER);"+
 "CREATE TABLE IF NOT EXISTS economy_shop_items(item_id TEXT PRIMARY KEY,name TEXT,price INTEGER,description TEXT,stock INTEGER DEFAULT -1);"+
 "CREATE TABLE IF NOT EXISTS economy_inventory(guild_id TEXT,user_id TEXT,item_id TEXT,quantity INTEGER DEFAULT 0,PRIMARY KEY(guild_id,user_id,item_id));"+
 "CREATE TABLE IF NOT EXISTS game_scores(guild_id TEXT,user_id TEXT,game TEXT,wins INTEGER DEFAULT 0,plays INTEGER DEFAULT 0,points INTEGER DEFAULT 0,updated_at INTEGER,PRIMARY KEY(guild_id,user_id,game));"+
 "CREATE TABLE IF NOT EXISTS owner_jobs(id INTEGER PRIMARY KEY AUTOINCREMENT,kind TEXT,payload TEXT,due_at INTEGER,created_at INTEGER,enabled INTEGER DEFAULT 1);"+
 "CREATE TABLE IF NOT EXISTS user_profiles(guild_id TEXT,user_id TEXT,bio TEXT DEFAULT '',badge TEXT DEFAULT '',updated_at INTEGER,PRIMARY KEY(guild_id,user_id));"+
 "CREATE TABLE IF NOT EXISTS polls(id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT,channel_id TEXT,question TEXT,options_json TEXT,created_at INTEGER,closed_at INTEGER);"+
 "CREATE TABLE IF NOT EXISTS poll_votes(poll_id INTEGER,user_id TEXT,option_index INTEGER,created_at INTEGER,PRIMARY KEY(poll_id,user_id));"+
 "CREATE TABLE IF NOT EXISTS starboard(message_id TEXT PRIMARY KEY,guild_id TEXT,channel_id TEXT,author_id TEXT,content TEXT,stars INTEGER DEFAULT 0,posted_message_id TEXT,updated_at INTEGER);"+
 "CREATE TABLE IF NOT EXISTS owner_audit_log(id INTEGER PRIMARY KEY AUTOINCREMENT,owner_id TEXT,action TEXT,guild_id TEXT,created_at INTEGER NOT NULL);"
 );
 if(!db.prepare("SELECT 1 FROM economy_shop_items LIMIT 1").get()){
  const q=db.prepare("INSERT OR IGNORE INTO economy_shop_items(item_id,name,price,description,stock) VALUES(?,?,?,?,?)");
  q.run("xp-boost","XP Boost Card",5000,"Bonus EXP 25 persen selama 24 jam",-1);
  q.run("daily-luck","Daily Luck Card",7500,"Kartu keberuntungan daily",-1);
  q.run("server-support","Server Support Badge",25000,"Badge profil komunitas",-1);
 }
}
function cfg(db,gid,key,fallback=null){const r=db.prepare("SELECT value FROM feature_settings WHERE guild_id=? AND key=?").get(gid,key);return r?.value??fallback;}
function setCfg(db,gid,key,value){db.prepare("INSERT INTO feature_settings(guild_id,key,value,updated_at) VALUES(?,?,?,?) ON CONFLICT(guild_id,key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at").run(gid,key,String(value),Date.now());}
function admin(i){return Boolean(i.guild&&i.memberPermissions?.has?.("ManageGuild"));}
function money(n){return "Rp"+Number(n||0).toLocaleString("id-ID");}
function trust(db,gid,uid,delta=0){const old=db.prepare("SELECT score FROM member_trust WHERE guild_id=? AND user_id=?").get(gid,uid)?.score;const score=Math.max(0,Math.min(100,Number(old??100)+delta));db.prepare("INSERT INTO member_trust(guild_id,user_id,score,updated_at) VALUES(?,?,?,?) ON CONFLICT(guild_id,user_id) DO UPDATE SET score=excluded.score,updated_at=excluded.updated_at").run(gid,uid,score,Date.now());return score;}
function incident(db,gid,uid,type,detail){db.prepare("INSERT INTO security_incidents(guild_id,user_id,type,detail,created_at) VALUES(?,?,?,?,?)").run(gid,uid,type,detail,Date.now());trust(db,gid,uid,-10);}
function ownerAudit(db,ownerId,action,guildId="global"){db.prepare("INSERT INTO owner_audit_log(owner_id,action,guild_id,created_at) VALUES(?,?,?,?)").run(ownerId,action,guildId,Date.now());}
function score(db,gid,uid,game,win,points){db.prepare("INSERT INTO game_scores(guild_id,user_id,game,wins,plays,points,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(guild_id,user_id,game) DO UPDATE SET wins=wins+excluded.wins,plays=plays+excluded.plays,points=points+excluded.points,updated_at=excluded.updated_at").run(gid,uid,game,win?1:0,1,points,Date.now());}

export function createExtendedFeatures({db,client,embed,botControl,jkt48CardsDb=null}={}){
 ensureTables(db);
 const intervals=new Set(),rates=new Map(),joins=new Map();

 async function handle(i){
  const n=i.commandName;
  if(n==="owner"){
   if(!botControl?.isOwner(i.user.id))return i.reply({embeds:[embed("Owner Only","Command ini hanya untuk owner bot.",{color:0xEF4444})],ephemeral:true}),true;
   const s=i.options.getSubcommand(true);ownerAudit(db,i.user.id,"owner:"+s,i.guild?.id||"global");
   if(s==="dashboard"){const m=process.memoryUsage();return i.reply({embeds:[embed("Owner Dashboard","Guild: "+client.guilds.cache.size+"\nRSS: "+Math.round(m.rss/1048576)+" MB\nHeap: "+Math.round(m.heapUsed/1048576)+" MB\nMaintenance: "+(botControl.isMaintenance()?"ON":"OFF")+"\nExtended features: "+EXTENDED_FEATURES.length,{color:0x8B5CF6})],ephemeral:true}),true;}
   if(s==="broadcast"){const text=i.options.getString("text",true);let sent=0;for(const g of client.guilds.cache.values()){const ch=g.systemChannel||g.channels.cache.find(x=>x.isTextBased?.()&&x.viewable);if(ch)await ch.send({embeds:[embed("Pengumuman Bot",text,{color:0x3B82F6})]}).then(()=>sent++).catch(()=>{});}return i.reply({embeds:[embed("Broadcast Selesai","Terkirim: "+sent+" server.",{color:0x3B82F6})],ephemeral:true}),true;}
   if(s==="rotation"){const list=i.options.getString("texts",true).split(/[|,\n]+/).map(x=>x.trim()).filter(Boolean).slice(0,20);botControl.setSetting("activity_rotation",JSON.stringify(list));botControl.setSetting("activity",list[0]||"Nararya Bot");return i.reply({embeds:[embed("Playing Rotation Disimpan",list.join(" -> ")+".",{})],ephemeral:true}),true;}
   if(s==="maintenance"){const on=i.options.getBoolean("enabled",true);botControl.setSetting("maintenance",on?"true":"false");await botControl.applyPresence();return i.reply({embeds:[embed("Maintenance",on?"Aktif":"Nonaktif",{color:on?0xF59E0B:0x22C55E})],ephemeral:true}),true;}
   if(s==="toggle"){const name=i.options.getString("command",true).toLowerCase(),on=i.options.getBoolean("enabled",true);botControl.setSetting("command:"+name,on?"true":"false");return i.reply({embeds:[embed("Command Toggle",name+" -> "+(on?"ON":"OFF"),{})],ephemeral:true}),true;}
   if(s==="schedule"){const text=i.options.getString("text",true),delay=i.options.getInteger("delay_seconds",true);db.prepare("INSERT INTO owner_jobs(kind,payload,due_at,created_at,enabled) VALUES(?,?,?,?,1)").run("announcement",text,Date.now()+delay*1000,Date.now());return i.reply({embeds:[embed("Announcement Dijadwalkan","Delay "+delay+" detik.",{})],ephemeral:true}),true;}
  }
  if(["security","serverconfig","modcase"].includes(n)&&!i.guild)return i.reply({embeds:[embed("Guild Only","Command ini membutuhkan server.",{color:0xEF4444})],ephemeral:true}),true;

  if(n==="security"){
   if(!admin(i)&&!botControl?.isOwner(i.user.id))return i.reply({embeds:[embed("Admin Only","Butuh Manage Server.",{color:0xEF4444})],ephemeral:true}),true;
   const s=i.options.getSubcommand(true);
   if(s==="status"){const state=["raid","nuke","mention","lock"].map(k=>k+": "+cfg(db,i.guild.id,"security:"+k,"on")).join("\n");const logs=db.prepare("SELECT * FROM security_incidents WHERE guild_id=? ORDER BY id DESC LIMIT 8").all(i.guild.id);return i.reply({embeds:[embed("Security Center",state+"\n\n"+(logs.map(x=>x.type+" <@"+x.user_id+"> "+x.detail).join("\n")||"Tidak ada insiden."),{color:0xEF4444})]}),true;}
   if(s==="setup"){const key=i.options.getString("key",true),on=i.options.getBoolean("enabled",true);setCfg(db,i.guild.id,"security:"+key,on?"on":"off");return i.reply({embeds:[embed("Security Setting",key+" -> "+(on?"ON":"OFF"),{})]}),true;}
   if(s==="trust"){const u=i.options.getUser("user",true);return i.reply({embeds:[embed("Trust Score","<@"+u.id+"> = "+trust(db,i.guild.id,u.id,0)+"/100",{})]}),true;}
   if(s==="incident"){incident(db,i.guild.id,i.user.id,i.options.getString("type",true),i.options.getString("detail",true));return i.reply({embeds:[embed("Security Incident","Incident dicatat.",{})],ephemeral:true}),true;}
   if(s==="lockdown"){const on=i.options.getBoolean("enabled",true);setCfg(db,i.guild.id,"security:lock",on?"on":"off");return i.reply({embeds:[embed("Server Lockdown",on?"Aktif":"Nonaktif",{color:on?0xEF4444:0x22C55E})]}),true;}
  }

  if(n==="serverconfig"){
   if(!admin(i))return i.reply({embeds:[embed("Admin Only","Butuh Manage Server.",{color:0xEF4444})],ephemeral:true}),true;
   const s=i.options.getSubcommand(true);
   if(s==="view"){const r=db.prepare("SELECT key,value FROM feature_settings WHERE guild_id=? ORDER BY key").all(i.guild.id);return i.reply({embeds:[embed("Server Configuration",r.length?r.map(x=>x.key+" = "+x.value).join("\n"):"Belum ada konfigurasi.",{})]}),true;}
   if(s==="set"){const k=i.options.getString("key",true).slice(0,60),v=i.options.getString("value",true).slice(0,500);setCfg(db,i.guild.id,k,v);return i.reply({embeds:[embed("Konfigurasi Disimpan",k+" = "+v,{color:0x22C55E})]}),true;}
   if(s==="rules"){await i.channel.send({embeds:[embed("Peraturan Server",i.options.getString("text",true),{color:0xF59E0B})]});return i.reply({content:"Pesan aturan dikirim.",ephemeral:true}),true;}
   if(s==="stats"){return i.reply({embeds:[embed("Server Dashboard","Member: "+i.guild.memberCount+"\nChannels: "+i.guild.channels.cache.size+"\nRoles: "+i.guild.roles.cache.size,{color:0x64748B})]}),true;}
   if(s==="autorole"){const role=i.options.getRole("role",true);setCfg(db,i.guild.id,"autorole",role.id);return i.reply({embeds:[embed("Auto Role","Role: "+role.name,{color:0x22C55E})]}),true;}
   if(s==="autoroleremove"){setCfg(db,i.guild.id,"autorole_remove",i.options.getBoolean("enabled",true)?"on":"off");return i.reply({embeds:[embed("Auto Role Remove","Konfigurasi disimpan.",{})]}),true;}
   if(s==="automod"){const v=i.options.getInteger("mention_threshold",true);setCfg(db,i.guild.id,"mention_threshold",v);return i.reply({embeds:[embed("Auto Moderation","Mention threshold: "+v,{color:0x22C55E})]}),true;}
  }

  if(n==="modcase"){
   if(!admin(i))return i.reply({embeds:[embed("Admin Only","Butuh Manage Server.",{color:0xEF4444})],ephemeral:true}),true;
   const s=i.options.getSubcommand(true),u=i.options.getUser("user",true);
   if(s==="history"){const r=db.prepare("SELECT * FROM moderation_cases WHERE guild_id=? AND target_id=? ORDER BY id DESC LIMIT 20").all(i.guild.id,u.id);return i.reply({embeds:[embed("Moderation History",r.length?r.map(x=>"#"+x.id+" "+x.type+" "+x.reason).join("\n"):"Tidak ada case.",{})]}),true;}
   if(s==="reset"){db.prepare("DELETE FROM warnings WHERE guild_id=? AND user_id=?").run(i.guild.id,u.id);return i.reply({embeds:[embed("Warning Reset","Warning direset.",{color:0x22C55E})]}),true;}
   if(s==="remove"){const id=i.options.getInteger("case_id",true),ok=db.prepare("UPDATE moderation_cases SET status='removed' WHERE id=? AND guild_id=? AND target_id=?").run(id,i.guild.id,u.id).changes>0;return i.reply({embeds:[embed(ok?"Case Dihapus":"Case Tidak Ditemukan",ok?"Case #"+id+" dihapus.":"ID tidak cocok.",{color:ok?0x22C55E:0xEF4444})]}),true;}
  }

  if(n==="indonesia"){
   const s=i.options.getSubcommand(true);
   if(s==="time"){const zones=[["WIB","Asia/Jakarta"],["WITA","Asia/Makassar"],["WIT","Asia/Jayapura"]],now=new Date();return i.reply({embeds:[embed("Waktu Indonesia",zones.map(([a,z])=>a+": "+new Intl.DateTimeFormat("id-ID",{timeZone:z,dateStyle:"short",timeStyle:"medium"}).format(now)).join("\n"),{color:0x06B6D4})]}),true;}
   if(s==="electricity"){const kwh=i.options.getNumber("kwh",true),tariff=i.options.getNumber("tariff",true);return i.reply({embeds:[embed("Kalkulator Listrik",kwh+" kWh x "+money(tariff)+" = "+money(kwh*tariff),{})]}),true;}
   if(s==="currency"){const from=i.options.getString("from",true).toUpperCase(),to=i.options.getString("to",true).toUpperCase(),amount=i.options.getNumber("amount",true);try{const r=await fetch("https://open.er-api.com/v6/latest/"+encodeURIComponent(from));if(!r.ok)throw new Error("Currency HTTP "+r.status);const d=await r.json(),rate=d.rates?.[to];if(!rate)throw new Error("Mata uang tidak ditemukan");return i.reply({embeds:[embed("Currency",amount+" "+from+" = "+(amount*rate).toFixed(2)+" "+to,{color:0x16A34A})]});}catch(e){return i.reply({embeds:[embed("Currency Error",e.message,{color:0xEF4444})],ephemeral:true});}}
   if(s==="weather"){const city=i.options.getString("city",true);try{const r=await fetch("https://wttr.in/"+encodeURIComponent(city)+"?format=j1",{headers:{"User-Agent":"NararyaBot/2.0"}});if(!r.ok)throw new Error("Weather HTTP "+r.status);const d=await r.json(),c=d.current_condition?.[0];if(!c)throw new Error("Data cuaca kosong");return i.reply({embeds:[embed("Cuaca "+city,c.temp_C+" C • "+c.humidity+"% humidity • "+c.windspeedKmph+" km/h",{color:0x06B6D4})]});}catch(e){return i.reply({embeds:[embed("Cuaca Error",e.message,{color:0xEF4444})],ephemeral:true});}}
   if(s==="gold"){try{const r=await fetch("https://logam-mulia.com/harga-emas-hari-ini");if(!r.ok)throw new Error("Gold HTTP "+r.status);const t=await r.text(),m=t.match(/Rp[^<]{4,40}/i);return i.reply({embeds:[embed("Harga Emas",m?.[0]||"Data belum terbaca.",{color:0xF59E0B})]});}catch(e){return i.reply({embeds:[embed("Harga Emas Error",e.message,{color:0xEF4444})],ephemeral:true});}}
   if(s==="holiday"){const y=i.options.getInteger("year")||new Date().getFullYear();try{const r=await fetch("https://date.nager.at/api/v3/PublicHolidays/"+y+"/ID");if(!r.ok)throw new Error("Holiday HTTP "+r.status);const rows=await r.json();return i.reply({embeds:[embed("Hari Libur Indonesia "+y,rows.slice(0,20).map(x=>x.date+" - "+x.localName).join("\n"),{})]});}catch(e){return i.reply({embeds:[embed("Holiday Error",e.message,{color:0xEF4444})],ephemeral:true});}}
   if(s==="fuel"){try{const d=await getFuelPrices();const text=d.items?.slice(0,12).map(x=>x.name+" • "+money(x.price)).join("\n")||"Data BBM belum tersedia.";return i.reply({embeds:[embed("Perbandingan BBM",text,{color:0x0EA5E9})]});}catch(e){return i.reply({embeds:[embed("BBM Error",e.message,{color:0xEF4444})],ephemeral:true});}}
   if(s==="toll"){return i.reply({embeds:[embed("Tarif Tol","Tarif tol bergantung ruas, golongan kendaraan, dan operator. Gunakan data operator resmi untuk nominal terbaru.",{color:0x64748B})]});}
  }

  if(n==="finance"||n==="economy"){
   const s=i.options.getSubcommand(true),gid=i.guild.id,uid=i.user.id;
   if(s==="transfer"){const to=i.options.getUser("user",true),amount=i.options.getInteger("amount",true);if(amount<=0||to.id===uid)return i.reply({embeds:[embed("Transfer Tidak Valid","Target atau jumlah salah.",{color:0xEF4444})],ephemeral:true}),true;const a=db.prepare("SELECT balance FROM economy WHERE guild_id=? AND user_id=?").get(gid,uid)?.balance||0;if(a<amount)return i.reply({embeds:[embed("Saldo Tidak Cukup","Saldo kurang.",{color:0xF59E0B})],ephemeral:true}),true;const b=db.prepare("SELECT balance FROM economy WHERE guild_id=? AND user_id=?").get(gid,to.id)?.balance||0;db.transaction(()=>{db.prepare("INSERT INTO economy(guild_id,user_id,balance,daily_at) VALUES(?,?,?,0) ON CONFLICT(guild_id,user_id) DO UPDATE SET balance=excluded.balance").run(gid,uid,a-amount);db.prepare("INSERT INTO economy(guild_id,user_id,balance,daily_at) VALUES(?,?,?,0) ON CONFLICT(guild_id,user_id) DO UPDATE SET balance=excluded.balance").run(gid,to.id,b+amount);db.prepare("INSERT INTO economy_transactions(guild_id,user_id,type,amount,balance_after,meta,created_at) VALUES(?,?,?,?,?,?,?)").run(gid,uid,"transfer_out",amount,a-amount,to.id,Date.now());})();return i.reply({embeds:[embed("Transfer Berhasil",money(amount)+" dikirim.",{color:0x22C55E})]}),true;}
   if(s==="history"){const r=db.prepare("SELECT * FROM economy_transactions WHERE guild_id=? AND user_id=? ORDER BY id DESC LIMIT 10").all(gid,uid);return i.reply({embeds:[embed("Economy History",r.length?r.map(x=>x.type+" "+money(x.amount)).join("\n"):"Belum ada transaksi.")]}),true;}
   if(s==="leaderboard"){const r=db.prepare("SELECT user_id,balance FROM economy WHERE guild_id=? ORDER BY balance DESC LIMIT 10").all(gid);return i.reply({embeds:[embed("Economy Leaderboard",r.length?r.map((x,n)=>(n+1)+". <@"+x.user_id+"> "+money(x.balance)).join("\n"):"Belum ada data.")]}),true;}
   if(s==="shop"){const r=db.prepare("SELECT * FROM economy_shop_items WHERE stock<>0 ORDER BY price").all();return i.reply({embeds:[embed("Economy Shop",r.map(x=>x.item_id+" • "+x.name+" • "+money(x.price)).join("\n")||"Shop kosong.")]}),true;}
   if(s==="inventory"){const r=db.prepare("SELECT e.item_id,e.quantity,s.name FROM economy_inventory e JOIN economy_shop_items s ON s.item_id=e.item_id WHERE e.guild_id=? AND e.user_id=?").all(gid,uid);return i.reply({embeds:[embed("Economy Inventory",r.length?r.map(x=>x.name+" x"+x.quantity).join("\n"):"Inventory kosong.")]}),true;}
   if(s==="streak"){const day=new Date().toLocaleDateString("en-CA",{timeZone:process.env.BOT_TIMEZONE||"Asia/Jakarta"}),r=db.prepare("SELECT * FROM daily_streaks WHERE guild_id=? AND user_id=?").get(gid,uid);if(r?.last_claim_date===day)return i.reply({embeds:[embed("Daily Streak","Hari ini sudah diklaim. Streak "+r.streak,{color:0xF59E0B})],ephemeral:true}),true;const y=new Date(Date.now()-86400000).toLocaleDateString("en-CA",{timeZone:process.env.BOT_TIMEZONE||"Asia/Jakarta"}),streak=r?.last_claim_date===y?r.streak+1:1,reward=500*streak;db.prepare("INSERT INTO daily_streaks(guild_id,user_id,streak,last_claim_date) VALUES(?,?,?,?) ON CONFLICT(guild_id,user_id) DO UPDATE SET streak=excluded.streak,last_claim_date=excluded.last_claim_date").run(gid,uid,streak,day);db.prepare("INSERT INTO economy(guild_id,user_id,balance,daily_at) VALUES(?,?,?,0) ON CONFLICT(guild_id,user_id) DO UPDATE SET balance=balance+excluded.balance").run(gid,uid,reward);return i.reply({embeds:[embed("Daily Streak","Streak "+streak+" • Reward "+money(reward),{color:0xF97316})]}),true;}
   if(s==="bank"){const amount=i.options.getInteger("amount",true);if(!admin(i)||amount<=0)return i.reply({embeds:[embed("Server Bank","Admin only dan amount > 0.",{color:0xEF4444})],ephemeral:true});db.prepare("INSERT INTO server_bank(guild_id,balance,updated_at) VALUES(?,?,?) ON CONFLICT(guild_id) DO UPDATE SET balance=balance+excluded.balance,updated_at=excluded.updated_at").run(gid,amount,Date.now());return i.reply({embeds:[embed("Server Bank","Kas bertambah "+money(amount),{color:0x16A34A})]}),true;}
  }

  if(n==="games"){
   const s=i.options.getSubcommand(true),gid=i.guild.id,uid=i.user.id;
   if(s==="number"){const g=i.options.getInteger("guess",true),a=1+Math.floor(Math.random()*10),win=g===a;score(db,gid,uid,"number",win,win?10:0);return i.reply({embeds:[embed("Guess Number",(win?"Benar":"Salah")+" • Angka "+a,{color:win?0x22C55E:0xEF4444})]}),true;}
   if(s==="rps"){const p=i.options.getString("choice",true),c=["batu","gunting","kertas"],b=c[Math.floor(Math.random()*3)],win=(p==="batu"&&b==="gunting")||(p==="gunting"&&b==="kertas")||(p==="kertas"&&b==="batu"),draw=p===b;score(db,gid,uid,"rps",win,win?5:draw?1:0);return i.reply({embeds:[embed("Suit","Kamu "+p+" • Bot "+b+" • "+(draw?"Seri":win?"Menang":"Kalah"),{color:win?0x22C55E:draw?0xF59E0B:0xEF4444})]}),true;}
   if(s==="dice"){const g=i.options.getInteger("guess",true),a=1+Math.floor(Math.random()*6),win=g===a;score(db,gid,uid,"dice",win,win?6:0);return i.reply({embeds:[embed("Dice","Dadu "+a+" • Tebakan "+g,{color:win?0x22C55E:0xEF4444})]}),true;}
   if(s==="trivia"){const q=[["Ibukota Indonesia?","Jakarta"],["Planet merah?","Mars"],["2+2?","4"]][Math.floor(Math.random()*3)],a=i.options.getString("answer",true),win=a.trim().toLowerCase()===q[1].toLowerCase();score(db,gid,uid,"trivia",win,win?15:0);return i.reply({embeds:[embed("Trivia","Q: "+q[0]+"\nJawaban: "+a+"\nKunci: "+q[1],{color:win?0x22C55E:0xEF4444})]}),true;}
   if(s==="wordchain"){const w=i.options.getString("word",true).trim().toLowerCase(),last=cfg(db,gid,"wordchain:last",""),ok=!last||w[0]===last.slice(-1);setCfg(db,gid,"wordchain:last",w);score(db,gid,uid,"wordchain",ok,ok?5:0);return i.reply({embeds:[embed("Word Chain",ok?"Valid: "+w:"Tidak nyambung: "+w,{color:ok?0x22C55E:0xEF4444})]}),true;}
   if(s==="hangman"){const a=i.options.getString("answer",true).trim().toLowerCase(),win=a==="nararya";score(db,gid,uid,"hangman",win,win?20:0);return i.reply({embeds:[embed("Hangman","Target nararya • Jawabanmu "+a,{color:win?0x22C55E:0xEF4444})]}),true;}
   if(s==="daily"){const day=new Date().toLocaleDateString("en-CA",{timeZone:process.env.BOT_TIMEZONE||"Asia/Jakarta"}),key="game_daily:"+uid;if(cfg(db,gid,key,"")===day)return i.reply({embeds:[embed("Daily Challenge","Sudah selesai hari ini.",{color:0xF59E0B})],ephemeral:true}),true;setCfg(db,gid,key,day);score(db,gid,uid,"daily",true,25);return i.reply({embeds:[embed("Daily Challenge","+25 poin",{color:0x22C55E})]}),true;}
   if(s==="leaderboard"){const r=db.prepare("SELECT user_id,SUM(points) points FROM game_scores WHERE guild_id=? GROUP BY user_id ORDER BY points DESC LIMIT 10").all(gid);return i.reply({embeds:[embed("Game Leaderboard",r.map((x,n)=>(n+1)+". <@"+x.user_id+"> "+x.points+" poin").join("\n")||"Belum ada skor.",{})]}),true;}
  }

  if(n==="community"){
   const s=i.options.getSubcommand(true),gid=i.guild.id,uid=i.user.id;
   if(s==="remind"){const d=i.options.getInteger("delay_seconds",true),text=i.options.getString("text",true);db.prepare("INSERT INTO reminders(guild_id,user_id,channel_id,text,due_at) VALUES(?,?,?,?,?)").run(gid,uid,i.channel.id,text,Date.now()+d*1000);return i.reply({embeds:[embed("Reminder Dibuat","Akan dikirim dalam "+d+" detik.",{color:0x06B6D4})]}),true;}
   if(s==="suggest"){const text=i.options.getString("text",true),r=db.prepare("INSERT INTO suggestions(guild_id,user_id,text,created_at) VALUES(?,?,?,?)").run(gid,uid,text,Date.now());return i.reply({embeds:[embed("Suggestion Tersimpan","Nomor "+r.lastInsertRowid,{color:0xF59E0B})]}),true;}
   if(s==="profile"){const p=db.prepare("SELECT * FROM user_profiles WHERE guild_id=? AND user_id=?").get(gid,uid),l=db.prepare("SELECT * FROM levels WHERE guild_id=? AND user_id=?").get(gid,uid)||{xp:0,level:0},st=db.prepare("SELECT streak FROM daily_streaks WHERE guild_id=? AND user_id=?").get(gid,uid)?.streak||0,wins=db.prepare("SELECT COALESCE(SUM(wins),0) wins FROM game_scores WHERE guild_id=? AND user_id=?").get(gid,uid)?.wins||0;const rarity=jkt48CardsDb?.prepare("SELECT c.rarity FROM user_cards u JOIN cards c ON c.card_id=u.card_id WHERE u.guild_id=? AND u.user_id=? ORDER BY CASE c.rarity WHEN 'secret' THEN 7 WHEN 'mythic' THEN 6 WHEN 'legendary' THEN 5 WHEN 'epic' THEN 4 WHEN 'rare' THEN 3 WHEN 'uncommon' THEN 2 ELSE 1 END DESC LIMIT 1").get(gid,uid)?.rarity||"common";const card=createXpCardBuffer({username:i.user.username,xp:l.xp,level:l.level,streak:st,rarity,wins});return i.reply({embeds:[embed("🪪 User Profile Card","Bio: "+(p?.bio||"Belum diisi."),{color:0x8B5CF6,image:"attachment://xp-card.svg"})],files:[{attachment:card,name:"xp-card.svg"}]}),true;}
   if(s==="poll"){const q=i.options.getString("question",true),o=i.options.getString("options",true).split(/[|,]+/).map(x=>x.trim()).filter(Boolean).slice(0,8);if(o.length<2)return i.reply({embeds:[embed("Poll","Minimal 2 pilihan.",{color:0xEF4444})],ephemeral:true}),true;const p=db.prepare("INSERT INTO polls(guild_id,channel_id,question,options_json,created_at) VALUES(?,?,?,?,?)").run(gid,i.channel.id,q,JSON.stringify(o),Date.now());const text=q+"\n"+o.map((x,n)=>(n+1)+". "+x).join("\n")+"\n\nPoll ID: #"+p.lastInsertRowid;return i.reply({embeds:[embed("📊 Poll #"+p.lastInsertRowid,text,{color:0x3B82F6})]}),true;}
   if(s==="star"){const messageId=i.options.getString("message_id",true),stars=i.options.getInteger("stars",true);db.prepare("INSERT INTO starboard(message_id,guild_id,channel_id,author_id,content,stars,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(message_id) DO UPDATE SET stars=excluded.stars,updated_at=excluded.updated_at").run(messageId,gid,i.channel.id,uid,"Manual starboard entry",stars,Date.now());return i.reply({embeds:[embed("⭐ Starboard","Message "+messageId+" tercatat dengan **"+stars+"⭐**.",{color:0xFBBF24})]}),true;}
  }
  return false;
 }

 async function handleMessage(m){
  if(!m.guild||m.author?.bot)return;
  const mentions=m.mentions?.users?.size||0,limit=Number(cfg(db,m.guild.id,"mention_threshold","5"));
  if(mentions>=limit){incident(db,m.guild.id,m.author.id,"mention_spam","mentions="+mentions);if(m.deletable)await m.delete().catch(()=>{});}
  const key=m.guild.id+":"+m.author.id,now=Date.now(),arr=(rates.get(key)||[]).filter(x=>now-x<5000);arr.push(now);rates.set(key,arr);if(arr.length>=12)trust(db,m.guild.id,m.author.id,-10);
 }
 async function handleMemberJoin(member){
  const gid=member.guild.id,now=Date.now(),arr=(joins.get(gid)||[]).filter(x=>now-x<30000);arr.push(now);joins.set(gid,arr);
  if(arr.length>=10){setCfg(db,gid,"security:raid","on");incident(db,gid,member.id,"raid","join burst");}
  const roleId=cfg(db,gid,"autorole",null);if(roleId){const role=member.guild.roles.cache.get(roleId);if(role)await member.roles.add(role).catch(()=>{});}
 }
 function start(){
  const reminder=setInterval(async()=>{const rows=db.prepare("SELECT * FROM reminders WHERE sent_at IS NULL AND due_at<=? LIMIT 20").all(Date.now());for(const x of rows){const ch=await client.channels.fetch(x.channel_id).catch(()=>null);if(ch?.isTextBased())await ch.send({content:"⏰ <@"+x.user_id+"> Reminder: "+x.text}).catch(()=>{});db.prepare("UPDATE reminders SET sent_at=? WHERE id=?").run(Date.now(),x.id);}},10000);
  const jobs=setInterval(async()=>{const rows=db.prepare("SELECT * FROM owner_jobs WHERE enabled=1 AND due_at<=? LIMIT 10").all(Date.now());for(const x of rows){if(x.kind==="announcement")for(const g of client.guilds.cache.values()){const ch=g.systemChannel||g.channels.cache.find(c=>c.isTextBased?.()&&c.viewable);if(ch)await ch.send({embeds:[embed("Pengumuman Bot",x.payload,{color:0x3B82F6})]}).catch(()=>{});}db.prepare("UPDATE owner_jobs SET enabled=0 WHERE id=?").run(x.id);}},10000);
  intervals.add(reminder);intervals.add(jobs);
  const stop=()=>{for(const t of intervals)clearInterval(t);intervals.clear();};
  process.once("SIGINT",stop);process.once("SIGTERM",stop);
  process.on("unhandledRejection",e=>console.error("[unhandledRejection]",e));
  process.on("uncaughtException",e=>{console.error("[uncaughtException]",e);for(const t of intervals)clearInterval(t);setTimeout(()=>process.exit(1),250);});
  client.on("guildMemberAdd",handleMemberJoin);
 }
 return {handle,handleMessage,start,ensureTables};
}
