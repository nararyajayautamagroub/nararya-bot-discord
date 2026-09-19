import 'dotenv/config';
import Database from 'better-sqlite3';
import {Client,GatewayIntentBits,Partials,EmbedBuilder,ActionRowBuilder,ButtonBuilder,ButtonStyle,ChannelType,PermissionFlagsBits} from 'discord.js';
import {createFeedService} from './jkt48/feed-service.js';
import {DEFAULT_SOURCES} from './jkt48/sources.js';
import {ensureTables,MODES,matches,rollGacha,rollRarity,rarityInfo,validMedia} from './services/games/jkt48/index.js';
import {syncMemberDatabase} from './jkt48/member-database.js';
import {configured as jkt48ConnectConfigured} from './jkt48/connect.js';
import {getUpcoming,getLatest,getLatestPlatform,renderList,TYPE_LABELS} from './jkt48/command-service.js';
import {createJkt48Monitor} from './jkt48/live-monitor.js';
import {createJkt48FeatureDatabases} from './services/games/jkt48/databases.js';
import {awardCard,getInventory as getCardInventory,getCollectionStats} from './services/games/jkt48/card-system.js';
import {addQuizAsset,getQuizAssets,migrateLegacyAssets,startSession,getActiveSession,finishSession,calculatePoints,recordAttempt,recordResult,getLeaderboard,consumeDailyQuiz} from './services/games/jkt48/quiz-system.js';
import {saveGacha,consumeDailyPull} from './services/games/jkt48/gacha.js';
import {revealAnimation,revealChannel} from './services/games/jkt48/reveal-animation.js';
import {createMediaDatabase} from './media/database.js';
import {createMediaService} from './media/service.js';
import {handleMediaCommand} from './media/command.js';
import {createVerificationService} from './security/verification.js';
import {createVerificationWebServer} from './web/verification/server.js';
import {FEATURE_REGISTRY} from './config/features.js';
import {getIndonesiaNews,getStockQuote,getFuelPrices,getElectricityPrices,getFoodPrices,findCity,getPrayerSchedule,upcomingRamadan,refreshIndonesiaCache,DATA_SOURCES} from './services/indonesia/data.js';
import {getElectronicsPrices} from './services/indonesia/electronics.js';
import {restaurantSourceStatus} from './services/restaurant/prices.js';
import {createScraperOrchestrator} from './services/scrapers/orchestrator.js';
import {ensureDisasterTables,refreshDisasterDatabase,disasterStatus,notifyDisasterConfigs} from './services/disasters/index.js';
import {createAdditionalCommandHandler} from './services/additional-commands.js';
import {ensureDataAuditTables,runDataAudit,getAuditStatus} from './services/audit/data-audit.js';
import {createBotControl} from './security/bot-control.js';
import {createExtendedFeatures} from './services/extended-features.js';
import {createPresenceRotation} from './services/presence-rotation.js';
import {createXpCardBuffer} from './services/leveling/xp-card.js';

const db=new Database(process.env.DATABASE_PATH||'./data/nararya.db');
db.pragma('journal_mode=WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS jkt48_members(id TEXT PRIMARY KEY,name TEXT NOT NULL,nickname TEXT,generation INTEGER,virtual_generation INTEGER,status TEXT DEFAULT 'active',team TEXT,image_url TEXT,profile_url TEXT,join_date TEXT,graduation_date TEXT,showroom_url TEXT,idn_url TEXT,youtube_url TEXT,instagram_url TEXT,tiktok_url TEXT,x_url TEXT,updated_at INTEGER DEFAULT 0);\nCREATE TABLE IF NOT EXISTS guild_config(guild_id TEXT PRIMARY KEY,welcome_channel TEXT,goodbye_channel TEXT,log_channel TEXT,ticket_category TEXT,ticket_staff_role TEXT,feed_channel TEXT,welcome_sent_at INTEGER);
CREATE TABLE IF NOT EXISTS feed_sources(id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT,name TEXT,url TEXT,channel_id TEXT,kind TEXT DEFAULT 'public',enabled INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS feed_items(source_id INTEGER,item_key TEXT,title TEXT,url TEXT,published_at INTEGER,PRIMARY KEY(source_id,item_key));
CREATE TABLE IF NOT EXISTS levels(guild_id TEXT,user_id TEXT,xp INTEGER DEFAULT 0,level INTEGER DEFAULT 0,PRIMARY KEY(guild_id,user_id));
CREATE TABLE IF NOT EXISTS economy(guild_id TEXT,user_id TEXT,balance INTEGER DEFAULT 0,daily_at INTEGER DEFAULT 0,PRIMARY KEY(guild_id,user_id));
CREATE TABLE IF NOT EXISTS warnings(id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT,user_id TEXT,reason TEXT,moderator_id TEXT,created_at INTEGER);
CREATE TABLE IF NOT EXISTS tickets(id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT,channel_id TEXT,user_id TEXT,status TEXT DEFAULT 'open',claimed_by TEXT,created_at INTEGER,closed_at INTEGER);
CREATE TABLE IF NOT EXISTS tycoon(guild_id TEXT,user_id TEXT,money INTEGER DEFAULT 10000,bank INTEGER DEFAULT 0,energy INTEGER DEFAULT 100,city_level INTEGER DEFAULT 1,fish_level INTEGER DEFAULT 1,daily_at INTEGER DEFAULT 0,gacha_count INTEGER DEFAULT 0,
        gacha_day TEXT DEFAULT '',PRIMARY KEY(guild_id,user_id));
CREATE TABLE IF NOT EXISTS shop_items(id TEXT PRIMARY KEY,name TEXT NOT NULL,price INTEGER NOT NULL,category TEXT NOT NULL,stock INTEGER DEFAULT -1);
CREATE TABLE IF NOT EXISTS owned_items(guild_id TEXT,user_id TEXT,item_id TEXT,qty INTEGER DEFAULT 1,PRIMARY KEY(guild_id,user_id,item_id));
CREATE TABLE IF NOT EXISTS ramadan_configs(guild_id TEXT PRIMARY KEY,city_id TEXT NOT NULL,city_name TEXT NOT NULL,channel_id TEXT NOT NULL,enabled INTEGER DEFAULT 1,last_sahur TEXT,last_buka TEXT,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL);

`);
ensureTables(db);
try{db.prepare('ALTER TABLE guild_config ADD COLUMN welcome_sent_at INTEGER').run()}catch{}
const jkt48Dbs=createJkt48FeatureDatabases();
ensureDataAuditTables(db);
const mediaDbState=createMediaDatabase();
ensureDisasterTables(db);
const scraperOrchestrator=createScraperOrchestrator({db,onDataRefresh:async row=>{
 if(row.group_name==='disaster'){if(!globalThis.__nararyaDisasterRefreshAt||Date.now()-globalThis.__nararyaDisasterRefreshAt>=60*1000){globalThis.__nararyaDisasterRefreshAt=Date.now();await refreshDisasterDatabase({db});await notifyDisasterConfigs({db,client,embed})}return;}
 if(row.key.startsWith('news.antaranews.')){const category=row.key.split('.').pop();await getIndonesiaNews(category,8);return;}
 if(row.key==='price.pertamina'){await getFuelPrices();return;}
 if(row.key==='price.pln'){await getElectricityPrices();return;}
 if(row.key==='price.pihps'){await getFoodPrices();return;}
 if(row.group_name==='electronics'){await getElectronicsPrices({category:row.key.endsWith('.audio')?'audio':'all',limit:25});return;}
 if(row.group_name==='restaurant-prices'){const source=await restaurantSourceStatus();if(!source.ok)throw new Error('Restaurant price source HTTP '+source.status+(source.error?' • '+source.error:''));return;}
}});
const mediaService=createMediaService({db:mediaDbState.db,dir:mediaDbState.dir});
const verificationService=createVerificationService({db,baseUrl:process.env.VERIFY_WEB_BASE_URL||'http://localhost:'+String(process.env.VERIFY_WEB_PORT||3000)});
const verificationWeb=createVerificationWebServer({service:verificationService,featureRegistry:FEATURE_REGISTRY});
verificationWeb.start();
migrateLegacyAssets(db,jkt48Dbs.quiz);
try{db.prepare('ALTER TABLE feed_sources ADD COLUMN kind TEXT DEFAULT "public"').run()}catch{}
const EMBED_COLORS=Object.freeze({default:0xFF6200,success:0x22C55E,error:0xEF4444,warning:0xF59E0B,info:0x3B82F6,jkt48:0xE91E63,gacha:0x8B5CF6,game:0x06B6D4,bank:0x16A34A,shop:0xF97316,city:0x64748B,fishing:0x0891B2});
const embed=(title,description='',opts={})=>{const e=new EmbedBuilder().setTitle(title).setDescription(description).setColor(opts.color??EMBED_COLORS.default).setTimestamp().setAuthor({name:'BOT NARARYA GROUB'}).setFooter({text:'PT NARARYA JAYA UTAMA GROUB - All Right Reserved'});if(opts.url)e.setURL(opts.url);if(opts.image)e.setImage(opts.image);if(opts.thumbnail)e.setThumbnail(opts.thumbnail);if(opts.fields)e.addFields(opts.fields);return e};
const memberEmbed=(m)=>embed('👤 '+m.name,`${m.status==='active'?'🟢 Aktif':'⚪ '+(m.status||'Tidak aktif')} • Generasi ${m.generation}${m.team?' • '+m.team:''}${m.virtual_generation?' • JKT48V Gen '+m.virtual_generation:''}`,{color:m.virtual_generation?0x7C3AED:EMBED_COLORS.jkt48,thumbnail:m.image_url,url:m.profile_url,fields:[{name:'Informasi',value:[m.nickname?'Nama panggilan: '+m.nickname:'',m.join_date?'Bergabung: '+m.join_date:'',m.graduation_date?'Graduasi: '+m.graduation_date:''].filter(Boolean).join('\n')||'Belum ada data tambahan.'}]});
const feedEmbed=x=>embed('📡 '+x.sourceName,x.description||'Update baru terdeteksi.',{url:x.url,image:x.image});
const client=new Client({intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMembers,GatewayIntentBits.GuildMessages,GatewayIntentBits.MessageContent,GatewayIntentBits.GuildVoiceStates,GatewayIntentBits.GuildModeration],partials:[Partials.Channel,Partials.Message]});
const botControl=createBotControl({db,client});
const extendedFeatures=createExtendedFeatures({db,client,embed,botControl,jkt48CardsDb:jkt48Dbs.cards});
const presenceRotation=createPresenceRotation({client,botControl,intervalMs:Number(process.env.PRESENCE_ROTATION_INTERVAL_MS||45000)});
const recent=new Map();
function moderate(m){
 const key=m.guild.id+':'+m.author.id,now=Date.now(),arr=(recent.get(key)||[]).filter(t=>now-t<8000);arr.push(now);recent.set(key,arr);
 if(arr.length>=6)return{delete:true,timeout:60000};
 if(m.content.includes('discord.gg/')||m.content.includes('discord.com/invite/')||m.content.includes('discordapp.com/invite/'))return{delete:true};
 if((m.content.includes('http://')||m.content.includes('https://'))&&!m.member.permissions.has(PermissionFlagsBits.ManageMessages))return{delete:true};
}
function addXp(m){
 const r=db.prepare('SELECT * FROM levels WHERE guild_id=? AND user_id=?').get(m.guild.id,m.author.id);
 const xp=(r?.xp||0)+5+Math.floor(Math.random()*8),lv=Math.floor(Math.sqrt(xp/100));
 if(r)db.prepare('UPDATE levels SET xp=?,level=? WHERE guild_id=? AND user_id=?').run(xp,lv,m.guild.id,m.author.id);
 else db.prepare('INSERT INTO levels(guild_id,user_id,xp,level) VALUES(?,?,?,?)').run(m.guild.id,m.author.id,xp,lv);
}
function findGuildWelcomeChannel(guild){
 const system=guild.systemChannel;
 if(system?.isTextBased()&&system.permissionsFor(client.user)?.has([PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages]))return system;
 const candidates=guild.channels.cache
  .filter(ch=>ch.type===ChannelType.GuildText&&ch.viewable&&ch.permissionsFor(client.user)?.has([PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages]))
  .sort((a,b)=>a.rawPosition-b.rawPosition);
 return candidates.first()||null;
}
async function sendGuildInviteWelcome(guild){
 const channel=findGuildWelcomeChannel(guild);
 if(!channel)return;
 const existing=db.prepare('SELECT 1 FROM guild_config WHERE guild_id=?').get(guild.id);
 if(existing?.welcome_sent_at)return;
 db.prepare('INSERT INTO guild_config(guild_id,welcome_channel) VALUES(?,?) ON CONFLICT(guild_id) DO UPDATE SET welcome_channel=COALESCE(guild_config.welcome_channel,excluded.welcome_channel)').run(guild.id,channel.id);
 await channel.send({
  embeds:[embed('🤖 Terima kasih sudah mengundang BOT NARARYA GROUB',
   'Halo **'+guild.name+'**! Saya sudah berhasil masuk ke server ini. 🎉\\n\\n'+
   '**Fitur utama:**\\n'+
   '• 📰 Berita Indonesia dan data publik\\n'+
   '• 🚨 Monitoring gempa, tsunami, gunung api, dan bencana lain\\n'+
   '• 🌍 Game Google Street View\\n'+
   '• 🎴 JKT48 game, gacha, dan collection\\n'+
   '• 🎬 Media downloader dan media tools\\n'+
   '• 🔐 Sistem verifikasi\\n'+
   '• 🌙 Ramadan, imsakiyah, sahur, dan buka puasa\\n'+
   '• 🛠️ Audit scraper dan status sistem\\n\\n'+
   'Mulai dengan **/bot info**, **/bot features**, atau **/status system**.\\n'+
   'Untuk bantuan, gunakan **/support ticket**.',
   {color:EMBED_COLORS.default}
  )]
 }).catch(()=>{});
 db.prepare('UPDATE guild_config SET welcome_channel=?,welcome_sent_at=COALESCE(welcome_sent_at,?) WHERE guild_id=?').run(channel.id,Date.now(),guild.id);
}
async function openTicket(i){
 const cfg=db.prepare('SELECT * FROM guild_config WHERE guild_id=?').get(i.guild.id);
 const overwrites=[{id:i.guild.roles.everyone.id,deny:[PermissionFlagsBits.ViewChannel]},{id:i.user.id,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory]}];
 if(cfg?.ticket_staff_role)overwrites.push({id:cfg.ticket_staff_role,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory]});
 const ch=await i.guild.channels.create({name:'ticket-'+i.user.username.toLowerCase().replace(/[^a-z0-9-]/g,'').slice(0,45),type:ChannelType.GuildText,parent:cfg?.ticket_category||undefined,permissionOverwrites:overwrites});
 db.prepare('INSERT INTO tickets(guild_id,channel_id,user_id,status,created_at) VALUES(?,?,?,?,?)').run(i.guild.id,ch.id,i.user.id,'open',Date.now());
 const row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket-close').setLabel('Tutup Ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger));
 await ch.send({embeds:[embed('🎫 Ticket Dibuat','Jelaskan kebutuhanmu dengan detail. Staff akan membantu.')],components:[row]});
 return ch;
}
const feedService=createFeedService({db,client,buildEmbed:feedEmbed});
const jkt48Monitor=createJkt48Monitor({db,client,embed,interval:Number(process.env.JKT48_MONITOR_INTERVAL_MS||30000)});
const gameCooldowns=new Map();
const GAME_COOLDOWN_MS=10000;
const QUIZ_TIMEOUT_MS=60000;
function gameCooldownLeft(guildId,userId){const key=guildId+':'+userId,last=gameCooldowns.get(key)||0,remaining=GAME_COOLDOWN_MS-(Date.now()-last);if(remaining>0)return remaining;gameCooldowns.set(key,Date.now());return 0;}
function scheduleQuizExpiry(session){setTimeout(async()=>{const current=jkt48Dbs.quiz.prepare('SELECT * FROM quiz_sessions WHERE id=?').get(session.id);if(!current||current.status!=='active')return;if(current.expires_at>Date.now())return scheduleQuizExpiry({...current});finishSession(jkt48Dbs.quiz,current.id,'expired');recordResult(jkt48Dbs.quiz,{guildId:current.guild_id,userId:current.user_id,mode:current.mode,rarity:current.rarity,answer:current.answer,input:'[timeout]',correct:false,points:0,durationMs:QUIZ_TIMEOUT_MS});const ch=await client.channels.fetch(current.channel_id).catch(()=>null);if(ch?.isTextBased())await ch.send({embeds:[embed('⏰ Waktu Habis','Tantangan **'+current.mode+'** gagal karena tidak dijawab dalam **1 menit**. Coba lagi setelah cooldown.',{color:EMBED_COLORS.error})]}).catch(()=>{});},Math.max(100,current.expires_at-Date.now()+100));}
function money(v){return Number.isFinite(Number(v))?'Rp'+Number(v).toLocaleString('id-ID'):'-';}
const additionalCommandHandler=createAdditionalCommandHandler({db,jkt48QuizDb:jkt48Dbs.quiz,client,embed,gameCooldowns,gameCooldownMs:GAME_COOLDOWN_MS,quizTimeoutMs:QUIZ_TIMEOUT_MS,scraperOrchestrator,getAuditStatus,onQuizStarted:scheduleQuizExpiry,botControl,extendedFeatures});
let dataPipelineRunning=false;
let lastAuditAlertSignature='';
const auditDatabases=[
 {name:'main',db},
 {name:'media',db:mediaDbState.db},
 {name:'jkt48-quiz',db:jkt48Dbs.quiz},
 {name:'jkt48-gacha',db:jkt48Dbs.gacha},
 {name:'jkt48-cards',db:jkt48Dbs.cards}
];
async function notifyDataAuditFindings(report){
 if(!report?.missing?.length){lastAuditAlertSignature='';return;}
 const signature=JSON.stringify(report.missing.map(x=>[x.url,x.status,x.method,x.suggestion,x.error]));
 if(signature===lastAuditAlertSignature)return;
 lastAuditAlertSignature=signature;
 const channels=db.prepare('SELECT guild_id,log_channel FROM guild_config WHERE log_channel IS NOT NULL AND log_channel<>""').all();
 const items=report.missing.slice(0,10).map(x=>'• **'+x.status+'**\\nURL: '+x.url+'\\nMetode: **'+x.method+'**\\nSaran: '+x.suggestion+(x.error?'\\nError: '+x.error:'')).join('\\n\\n');
 for(const row of channels){
  const channel=client.channels.cache.get(row.log_channel)||await client.channels.fetch(row.log_channel).catch(()=>null);
  if(!channel?.isTextBased())continue;
  await channel.send({embeds:[embed('🛠️ Scraper Audit Memerlukan Perbaikan','Audit menemukan URL/data yang belum memiliki scraper terdaftar.\\n\\n'+items,{color:EMBED_COLORS.warning})]}).catch(()=>{});
 }
}
async function runDataPipelineCheck(){
 if(dataPipelineRunning)return null;
 dataPipelineRunning=true;
 try{await scraperOrchestrator.checkNow();const report=await runDataAudit({databases:auditDatabases});await notifyDataAuditFindings(report);return report;}
 catch(error){console.warn('[data-audit] '+error.message);return null;}
 finally{dataPipelineRunning=false;}
}

async function sendIndonesiaDataRefresh(){return refreshIndonesiaCache().catch(error=>[{ok:false,error:error.message}]);}
function jakartaClock(date=new Date()){
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:process.env.BOT_TIMEZONE||'Asia/Jakarta',hour12:false,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}).formatToParts(date);
 const out=Object.fromEntries(parts.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
 return {...out,minutes:Number(out.hour)*60+Number(out.minute),seconds:Number(out.second),date:`${out.year}-${out.month}-${out.day}`};
}
async function checkRamadanNotifications(){
 const rows=db.prepare('SELECT * FROM ramadan_configs WHERE enabled=1').all();
 const now=new Date(),clock=jakartaClock(now),estimated=upcomingRamadan();
 if(clock.date<estimated.estimatedStart||clock.date>estimated.estimatedEnd)return;
 for(const cfg of rows){
  try{
   const schedule=await getPrayerSchedule(cfg.city_id,now);
   const channel=await client.channels.fetch(cfg.channel_id).catch(()=>null);
   if(!channel?.isTextBased())continue;
   const [ih,im]=String(schedule.jadwal.imsak||'').split(':').map(Number);
   const [mh,mm]=String(schedule.jadwal.maghrib||'').split(':').map(Number);
   const sendWindow=75;
   if(Number.isFinite(ih)&&Number.isFinite(im)){
    const target=((ih*60+im)-30+1440)%1440;
    const nowSec=clock.minutes*60+clock.seconds,targetSec=target*60;
    if(Math.abs(nowSec-targetSec)<=sendWindow&&cfg.last_sahur!==clock.date){
      await channel.send({embeds:[embed('🌙 Pengingat Sahur','Waktu sahur untuk **'+cfg.city_name+'** mendekati batas.\n🕐 Imsak: **'+schedule.jadwal.imsak+'**\n🍽️ Segera selesaikan sahur.',{color:EMBED_COLORS.gacha})]}).catch(()=>{});
      db.prepare('UPDATE ramadan_configs SET last_sahur=?,updated_at=? WHERE guild_id=?').run(clock.date,Date.now(),cfg.guild_id);
    }
   }
   if(Number.isFinite(mh)&&Number.isFinite(mm)){
    const targetSec=(mh*60+mm)*60,nowSec=clock.minutes*60+clock.seconds;
    if(Math.abs(nowSec-targetSec)<=sendWindow&&cfg.last_buka!==clock.date){
      await channel.send({embeds:[embed('🌇 Waktu Berbuka','Waktu Maghrib untuk **'+cfg.city_name+'** telah tiba.\n🕌 Maghrib: **'+schedule.jadwal.maghrib+'**\n🥤 Selamat berbuka puasa.',{color:EMBED_COLORS.success})]}).catch(()=>{});
      db.prepare('UPDATE ramadan_configs SET last_buka=?,updated_at=? WHERE guild_id=?').run(clock.date,Date.now(),cfg.guild_id);
    }
   }
  }catch(error){console.warn('[ramadan] '+cfg.guild_id+' '+error.message)}
 }
}
client.on('messageCreate',async m=>{
 if(m.author.bot||!m.guild)return;
 if(botControl.isMaintenance()&&!botControl.isOwner(m.author.id))return;
 if(botControl.getSetting('emergency_lockdown','false')==='true'&&!botControl.isOwner(m.author.id))return;
 if(botControl.denyReason({guildId:m.guild.id,userId:m.author.id}))return;
 void extendedFeatures.handleMessage(m).catch(error=>console.warn('[extended-security] '+error.message));
 const session=getActiveSession(jkt48Dbs.quiz,m.guild.id,m.author.id,m.channel.id);
 if(session?.timed_out){
  recordResult(jkt48Dbs.quiz,{guildId:session.guild_id,userId:session.user_id,mode:session.mode,rarity:session.rarity,answer:session.answer,input:'[timeout]',correct:false,points:0,durationMs:QUIZ_TIMEOUT_MS});
  await m.channel.send({embeds:[embed('⏰ Waktu Habis','Tantangan **'+session.mode+'** gagal karena tidak dijawab dalam **1 menit**.',{color:EMBED_COLORS.error})]}).catch(()=>{});
 }else if(session){
  const answers=session.answer.split(/\\s*[|;]\\s*/).map(x=>x.trim()).filter(Boolean);
  const correct=matches(m.content,answers);
  if(correct){
   const seconds=(Date.now()-session.started_at)/1000;
   const points=calculatePoints(seconds,session.rarity);
   finishSession(jkt48Dbs.quiz,session.id,'finished');
   const score=recordResult(jkt48Dbs.quiz,{guildId:m.guild.id,userId:m.author.id,mode:session.mode,rarity:session.rarity,answer:session.answer,input:m.content,correct:true,points,durationMs:Date.now()-session.started_at});
   if(session.mode==='streetView'){
    await m.channel.send({embeds:[embed('🌍 Street View Benar','✅ **'+m.author.username+'** berhasil menebak lokasi.\\n\\n⭐ **+'+points+' poin**\\n🏆 Total: **'+score.points+' poin**\\n🔥 Streak: **'+score.streak+'**',{color:EMBED_COLORS.game})]}).catch(()=>{});
   }else{
    const member=db.prepare('SELECT * FROM jkt48_members WHERE name LIKE ? OR nickname LIKE ? ORDER BY status DESC,generation DESC LIMIT 1').get('%'+session.answer+'%','%'+session.answer+'%');
    const card=awardCard(jkt48Dbs.cards,{
     guildId:m.guild.id,userId:m.user.id,
     type:member?'member':'quiz',
     key:member?.id||session.mode+':'+session.answer,
     name:member?.name||session.answer,
     rarity:session.rarity,
     generation:member?.generation||null,
     imageUrl:member?.image_url||session.media_url||null,
     mode:session.mode,
     source:'quiz'
    });
    await revealChannel(m.channel,{
     title:'🎯 Jawaban Benar',
     prefix:'✅ **'+m.author.username+'** berhasil menjawab!\\n\\n',
     rarity:session.rarity,
     finalDescription:'🎴 **Kartu diperoleh**\\n'+card.subject_name+'\\n\\n'+(member?.generation?'Generasi '+member.generation+'\\n':'')+'⭐ **+'+points+' poin**\\n🏆 Total: **'+score.points+' poin**\\n🔥 Streak: **'+score.streak+'**',
     finalImage:card.image_url||null
    }).catch(console.error);
   }
  }else{
   recordAttempt(jkt48Dbs.quiz,{guildId:m.guild.id,userId:m.user.id,mode:session.mode,rarity:session.rarity,answer:session.answer,input:m.content,correct:false,points:0,durationMs:Date.now()-session.started_at});
   await m.channel.send({embeds:[embed('❌ Belum Tepat','Jawabanmu belum cocok. Tantangan masih aktif.\\n'+(rarityInfo[session.rarity]?.emoji||'🎴')+' Rarity: **'+(rarityInfo[session.rarity]?.label||session.rarity)+'**',{color:EMBED_COLORS.warning})]}).catch(()=>{});
  }
 }
 const a=moderate(m);if(a?.delete)await m.delete().catch(()=>{});if(a?.timeout)await m.member.timeout(a.timeout,'Auto moderation').catch(()=>{});addXp(m)
});
client.on('guildCreate',async guild=>{
 try{
  if(await botControl.leaveIfBlacklisted(guild)){
   console.log('[guildCreate] blacklisted server left: '+guild.name+' ('+guild.id+')');
   return;
  }
  db.prepare('INSERT OR IGNORE INTO guild_config(guild_id) VALUES(?)').run(guild.id);
  await sendGuildInviteWelcome(guild);
  console.log('[guildCreate] welcome sent for '+guild.name+' ('+guild.id+')');
 }catch(error){
  console.warn('[guildCreate] '+guild.id+' '+error.message);
 }
});
client.on('guildMemberAdd',async m=>{const c=db.prepare('SELECT welcome_channel FROM guild_config WHERE guild_id=?').get(m.guild.id),ch=c?.welcome_channel?m.guild.channels.cache.get(c.welcome_channel):null;if(ch?.isTextBased())await ch.send({embeds:[embed('👋 Selamat datang','Selamat datang '+m.user.tag+'!')]})});
client.on('guildMemberRemove',async m=>{const c=db.prepare('SELECT goodbye_channel FROM guild_config WHERE guild_id=?').get(m.guild.id),ch=c?.goodbye_channel?m.guild.channels.cache.get(c.goodbye_channel):null;if(ch?.isTextBased())await ch.send({embeds:[embed('👋 Sampai jumpa','Sampai jumpa '+m.user.tag+'.')]})});
client.on('interactionCreate',async i=>{
 try{
  if(i.isButton()&&i.customId==='ticket-create'){const ch=await openTicket(i);return i.reply({embeds:[embed('🎫 Ticket Dibuat','Ticket kamu sudah dibuat: '+ch)],ephemeral:true})}
  if(i.isButton()&&i.customId==='ticket-close'){db.prepare("UPDATE tickets SET status='closed',closed_at=? WHERE channel_id=? AND status='open'").run(Date.now(),i.channel.id);await i.reply({embeds:[embed('🔒 Ticket Ditutup','Ticket ditandai closed.')]});return i.channel.permissionOverwrites.edit(i.user.id,{SendMessages:false}).catch(()=>{})}
  if(!i.isChatInputCommand())return;
  const n=i.commandName;
  const ownerControlCommand=['setup','settingbot','blacklistserver','blacklistusers','owner'].includes(n);
  if(!ownerControlCommand&&botControl.isMaintenance()&&!botControl.isOwner(i.user.id))return i.reply({embeds:[embed('🛠️ Bot Maintenance','Bot sedang dalam maintenance. Command publik sementara dinonaktifkan.',{color:EMBED_COLORS.warning})],ephemeral:true});
  if(!ownerControlCommand&&botControl.getSetting('command:'+n,'true')==='false'&&!botControl.isOwner(i.user.id))return i.reply({embeds:[embed('🛠️ Command Nonaktif','Command publik ini sedang dinonaktifkan oleh konfigurasi bot.',{color:EMBED_COLORS.warning})],ephemeral:true});
if(!ownerControlCommand&&botControl.getSetting('emergency_lockdown','false')==='true'&&!botControl.isOwner(i.user.id))return i.reply({embeds:[embed('🚨 Emergency Lockdown','Bot sedang dalam emergency lockdown. Command publik sementara dibatasi.',{color:EMBED_COLORS.error})],ephemeral:true});
const deny=botControl.denyReason({guildId:i.guild?.id,userId:i.user.id});
  if(deny){
   return i.reply({embeds:[embed('🚫 Akses Ditolak',deny==='USER_BLACKLIST'?'Akun ini masuk blacklist bot.':'Server ini masuk blacklist bot. Gunakan support resmi bot jika merasa terjadi kesalahan.',{color:EMBED_COLORS.error})],ephemeral:true});
  }

  if(n==='media')return handleMediaCommand(i,{mediaService,embed,colors:EMBED_COLORS});
  const additionalResult=await additionalCommandHandler(i);
  if(additionalResult)return additionalResult;
  if(n==='verify'){
   const sub=i.options.getSubcommand(true);
   if(sub==='start'){
    const session=verificationService.createSession({guildId:i.guild.id,userId:i.user.id});
    return i.reply({embeds:[embed('🔐 Verifikasi Akun','Buka website berikut untuk menyelesaikan verifikasi:\\n'+session.url+'\\n\\nSetelah berhasil, website akan menampilkan **kode 4 karakter**. Masukkan kode itu dengan **/verify code**.\\n\\nSesi berlaku sekitar **'+Math.round((session.expiresAt-Date.now())/60000)+' menit**.',{color:EMBED_COLORS.info})],ephemeral:true});
   }
   if(sub==='code'){
    const code=i.options.getString('code',true);
    try{
      const result=verificationService.redeemCode({guildId:i.guild.id,userId:i.user.id,code});
      let roleMessage='Tidak ada role otomatis yang dikonfigurasi.';
      if(result.roleId){
       const member=await i.guild.members.fetch(i.user.id);
       const role=i.guild.roles.cache.get(result.roleId);
       if(role&&role.editable){await member.roles.add(role,'Nararya verification');roleMessage='Role <@&'+role.id+'> berhasil diberikan.';}
       else roleMessage='Kode valid, tetapi role verifikasi tidak dapat diberikan. Periksa permission Manage Roles dan posisi role bot.';
      }
      return i.reply({embeds:[embed('✅ Verifikasi Berhasil','Akun kamu sudah diverifikasi untuk server ini.\\n'+roleMessage,{color:EMBED_COLORS.success})],ephemeral:true});
    }catch(e){return i.reply({embeds:[embed('❌ Verifikasi Gagal',e.message,{color:EMBED_COLORS.error})],ephemeral:true});}
   }
   if(sub==='status'){
    const cfg=verificationService.getConfig(i.guild.id),h=verificationService.health();
    return i.reply({embeds:[embed('🔐 Verification Status','Role: '+(cfg.role_id?'<@&'+cfg.role_id+'>':'Belum diatur')+'\\nKode: **'+h.codeLength+' karakter**\\nSesi aktif: **'+h.pending+'**\\nMasa berlaku: **'+h.ttlSeconds+' detik**\\nPercobaan maksimum: **'+h.maxAttempts+'**',{color:EMBED_COLORS.info})]});
   }
   if(sub==='role'){
    const role=i.options.getRole('role',true);
    if(role.managed)return i.reply({embeds:[embed('❌ Role Tidak Bisa Digunakan','Pilih role biasa yang dapat diberikan oleh bot.',{color:EMBED_COLORS.error})],ephemeral:true});
    verificationService.setRole(i.guild.id,role.id);
    return i.reply({embeds:[embed('✅ Role Verifikasi Disimpan','Role verified: <@&'+role.id+'>\\nPastikan role bot berada di atas role tersebut pada hierarki Discord.',{color:EMBED_COLORS.success})]});
   }
  }

  if(n==='news'){
   const sub=i.options.getSubcommand(true);
   if(sub==='sources')return i.reply({embeds:[embed('📰 Sumber Berita Indonesia',Object.entries(DATA_SOURCES.news).map(([k,v])=>'**'+k+'** • '+v).join('\\n'),{color:EMBED_COLORS.info})]});
   const category=i.options.getString('category')||'latest';
   try{const data=await getIndonesiaNews(category,8);return i.reply({embeds:[embed('📰 Berita Indonesia • '+category.toUpperCase(),data.items.slice(0,8).map((x,n)=>'**'+(n+1)+'. ['+x.title+']('+x.link+')**\\n'+(x.description||'').slice(0,180)+'\\n'+(x.pubDate||'')).join('\\n\\n'),{color:EMBED_COLORS.info,fields:[{name:'Update',value:new Date(data.updatedAt).toLocaleString('id-ID',{timeZone:process.env.BOT_TIMEZONE||'Asia/Jakarta'})+' WIB'}]})]})}catch(e){return i.reply({embeds:[embed('❌ Berita Tidak Tersedia',e.message,{color:EMBED_COLORS.error})],ephemeral:true})}
  }
  if(n==='market'){
   const sub=i.options.getSubcommand(true);let symbol=sub==='ihsg'?'IHSG':i.options.getString('symbol',true);try{const q=await getStockQuote(symbol);return i.reply({embeds:[embed('📈 '+q.symbol,'Harga: **'+q.price.toLocaleString('id-ID')+' '+q.currency+'**\\nPerubahan: **'+q.change.toLocaleString('id-ID')+' ('+q.changePercent.toFixed(2)+'%)**\\nExchange: **'+q.exchange+'**\\nStatus pasar: **'+q.marketState+'**\\nData diperbarui: <t:'+Math.floor(q.fetchedAt/1000)+':R>\\nSumber: **'+q.source+'**',{color:q.change>=0?EMBED_COLORS.success:EMBED_COLORS.error})]})}catch(e){return i.reply({embeds:[embed('❌ Data Saham Tidak Tersedia',e.message,{color:EMBED_COLORS.error})],ephemeral:true})}
  }
  if(n==='prices'){
   const sub=i.options.getSubcommand(true);
   try{
    const render=(title,data)=>embed(title,data.items.map(x=>x.value===null?'• **'+x.name+'** • Data belum terbaca':'• **'+x.name+'** • **'+(x.unit==='Rp/kWh'?'Rp'+Number(x.value).toLocaleString('id-ID'):'Rp'+Number(x.value).toLocaleString('id-ID'))+'** / '+(x.unit==='Rp/kWh'?'kWh':x.unit.replace('Rp/',''))).join('\\n')+'\\n\\nSumber: '+data.source+'\\nUpdate cache: <t:'+Math.floor(data.updatedAt/1000)+':R>',{color:EMBED_COLORS.info});
    if(sub==='fuel')return i.reply({embeds:[render('⛽ Harga BBM Indonesia',await getFuelPrices())]});
    if(sub==='electricity')return i.reply({embeds:[render('⚡ Tarif Listrik PLN',await getElectricityPrices())]});
    if(sub==='food')return i.reply({embeds:[render('🛒 Harga Pangan Strategis',await getFoodPrices())]});
    const [fuel,electricity,food]=await Promise.all([getFuelPrices(),getElectricityPrices(),getFoodPrices()]);
    return i.reply({embeds:[render('🇮🇩 Ringkasan Harga Indonesia',{items:[...fuel.items.slice(0,7),...electricity.items.slice(0,4),...food.items.slice(0,6)],source:fuel.source,updatedAt:Math.min(fuel.updatedAt,electricity.updatedAt,food.updatedAt)})]});
   }catch(e){return i.reply({embeds:[embed('❌ Data Harga Tidak Tersedia',e.message,{color:EMBED_COLORS.error})],ephemeral:true})}
  }
  if(n==='ramadan'){
   const sub=i.options.getSubcommand(true);
   if(sub==='upcoming'){const r=upcomingRamadan();return i.reply({embeds:[embed('🌙 Upcoming Ramadan 1448 H','Perkiraan awal Ramadan: **8 Februari 2027**\\nPerkiraan Nuzulul Qur’an: **24 Februari 2027**\\nPerkiraan akhir Ramadan: **8 Maret 2027**\\nPerkiraan Idulfitri: **9–10 Maret 2027**\\n\\nStatus: **'+r.officialStatus+'**',{color:EMBED_COLORS.gacha})]})}
   if(sub==='today'){try{const matches=await findCity(i.options.getString('city',true));if(!matches.length)return i.reply({embeds:[embed('❌ Kota Tidak Ditemukan','Coba gunakan nama kota/kabupaten yang lebih lengkap.',{color:EMBED_COLORS.error})],ephemeral:true});const p=await getPrayerSchedule(matches[0].id);return i.reply({embeds:[embed('🕌 Jadwal Imsakiyah • '+matches[0].lokasi,'Imsak: **'+p.jadwal.imsak+'**\\nSubuh: **'+p.jadwal.subuh+'**\\nDzuhur: **'+p.jadwal.dzuhur+'**\\nAshar: **'+p.jadwal.ashar+'**\\nMaghrib: **'+p.jadwal.maghrib+'**\\nIsya: **'+p.jadwal.isya+'**\\n\\nSumber: **'+p.source+'**',{color:EMBED_COLORS.gacha})]})}catch(e){return i.reply({embeds:[embed('❌ Jadwal Tidak Tersedia',e.message,{color:EMBED_COLORS.error})],ephemeral:true})}}
   if(sub==='setup'){try{const city=i.options.getString('city',true),channel=i.options.getChannel('channel',true),matches=await findCity(city);if(!matches.length)return i.reply({embeds:[embed('❌ Kota Tidak Ditemukan','Kota tidak ditemukan.',{color:EMBED_COLORS.error})],ephemeral:true});const selected=matches[0];db.prepare('INSERT INTO ramadan_configs(guild_id,city_id,city_name,channel_id,enabled,created_at,updated_at) VALUES(?,?,?,?,1,?,?) ON CONFLICT(guild_id) DO UPDATE SET city_id=excluded.city_id,city_name=excluded.city_name,channel_id=excluded.channel_id,enabled=1,updated_at=excluded.updated_at').run(i.guild.id,selected.id,selected.lokasi,channel.id,Date.now(),Date.now());return i.reply({embeds:[embed('✅ Notifikasi Ramadan Aktif','Kota: **'+selected.lokasi+'**\\nChannel: '+channel+'\\nSahur: **30 menit sebelum Imsak**\\nBuka: **saat Maghrib**\\nPemeriksaan jadwal berjalan otomatis.',{color:EMBED_COLORS.success})]})}catch(e){return i.reply({embeds:[embed('❌ Setup Ramadan Gagal',e.message,{color:EMBED_COLORS.error})],ephemeral:true})}}
   if(sub==='disable'){db.prepare('UPDATE ramadan_configs SET enabled=0,updated_at=? WHERE guild_id=?').run(Date.now(),i.guild.id);return i.reply({embeds:[embed('🔕 Notifikasi Ramadan Dimatikan','Notifikasi sahur dan buka puasa untuk server ini dinonaktifkan.',{color:EMBED_COLORS.warning})]})}
   if(sub==='test'){const cfg=db.prepare('SELECT * FROM ramadan_configs WHERE guild_id=?').get(i.guild.id);if(!cfg)return i.reply({embeds:[embed('⚠️ Belum Dikonfigurasi','Jalankan /ramadan setup terlebih dahulu.',{color:EMBED_COLORS.warning})],ephemeral:true});const p=await getPrayerSchedule(cfg.city_id);return i.reply({embeds:[embed('🧪 Ramadan Notification Test','Kota: **'+cfg.city_name+'**\\nImsak: **'+p.jadwal.imsak+'**\\nMaghrib: **'+p.jadwal.maghrib+'**\\nChannel: <#'+cfg.channel_id+'>',{color:EMBED_COLORS.info})]})}
  }

  if(n==='bot'){
   const sub=i.options.getSubcommand(true);
   if(sub==='info')return i.reply({embeds:[embed('🤖 Bot Info','**Nama:** '+i.client.user.tag+'\\n**Version:** '+(process.env.npm_package_version||'1.5.0')+'\\n**Guild:** '+i.client.guilds.cache.size+'\\n**Node:** '+process.version+'\\n**Uptime:** '+Math.floor(process.uptime()/60)+' menit',{color:EMBED_COLORS.info})]});
   if(sub==='features'){
    const grouped=new Map();
    for(const f of FEATURE_REGISTRY){if(!grouped.has(f.category))grouped.set(f.category,[]);grouped.get(f.category).push(f);}
    const body=[...grouped].map(([cat,rows])=>'**'+cat+'**\\n'+rows.map(x=>'• '+x.name+' — '+x.status).join('\\n')).join('\\n\\n');
    return i.reply({embeds:[embed('🧩 Feature Registry',body.slice(0,3900),{color:EMBED_COLORS.default,fields:[{name:'Total fitur terdaftar',value:String(FEATURE_REGISTRY.length),inline:true}]} )]});
   }
   if(sub==='health'){
    let dbOk=false;try{db.prepare('SELECT 1').get();dbOk=true}catch{}
    const mem=process.memoryUsage();
    return i.reply({embeds:[embed('🩺 Bot Health','Database: **'+(dbOk?'OK':'ERROR')+'**\\nVerification Web: **'+(verificationWeb.enabled?'ENABLED':'DISABLED')+'**\\nWeb Port: **'+verificationWeb.port+'**\\nHeap: **'+Math.round(mem.heapUsed/1024/1024)+' MB**\\nRSS: **'+Math.round(mem.rss/1024/1024)+' MB**\\nUptime: **'+Math.floor(process.uptime())+' detik**',{color:dbOk?EMBED_COLORS.success:EMBED_COLORS.error})]});
   }
  }

  if(n==='utility'){
   const sub=i.options.getSubcommand(true);
   if(sub==='ping')return i.reply({embeds:[embed('🏓 Pong','Latency Discord: **'+i.client.ws.ping+'ms**',{color:EMBED_COLORS.info})]});
   if(sub==='server')return i.reply({embeds:[embed('🏠 Server Info','**'+i.guild.name+'**\n👥 Member: **'+i.guild.memberCount+'**\n🆔 '+i.guild.id)]});
   if(sub==='user'){const u=i.options.getUser('target')||i.user;return i.reply({embeds:[embed('👤 User Info','**'+u.tag+'**\n🆔 '+u.id+'\n🤖 Bot: '+(u.bot?'Ya':'Tidak'))]});}
   if(sub==='level'){const r=db.prepare('SELECT * FROM levels WHERE guild_id=? AND user_id=?').get(i.guild.id,i.user.id)||{level:0,xp:0};const streak=db.prepare('SELECT streak FROM daily_streaks WHERE guild_id=? AND user_id=?').get(i.guild.id,i.user.id)?.streak||0;const wins=db.prepare('SELECT COALESCE(SUM(wins),0) wins FROM game_scores WHERE guild_id=? AND user_id=?').get(i.guild.id,i.user.id)?.wins||0;const rarity=jkt48Dbs.cards.prepare("SELECT c.rarity FROM user_cards u JOIN cards c ON c.card_id=u.card_id WHERE u.guild_id=? AND u.user_id=? ORDER BY CASE c.rarity WHEN 'secret' THEN 7 WHEN 'mythic' THEN 6 WHEN 'legendary' THEN 5 WHEN 'epic' THEN 4 WHEN 'rare' THEN 3 WHEN 'uncommon' THEN 2 ELSE 1 END DESC LIMIT 1").get(i.guild.id,i.user.id)?.rarity||'common';const card=createXpCardBuffer({username:i.user.username,level:r.level,xp:r.xp,streak,rarity,wins});return i.reply({embeds:[embed('⭐ EXP Profile Card','EXP, level, streak, win count, dan rarity card ditampilkan dalam satu profile card.',{color:EMBED_COLORS.info,image:'attachment://xp-card.svg'})],files:[new AttachmentBuilder(card,{name:'xp-card.svg'})]});}
  }
  if(n==='economy'){
   const sub=i.options.getSubcommand(true);
   if(sub==='balance'){const b=db.prepare('SELECT balance FROM economy WHERE guild_id=? AND user_id=?').get(i.guild.id,i.user.id)?.balance||0;return i.reply({embeds:[embed('💰 Economy','Saldo: **Rp '+b.toLocaleString('id-ID')+'**',{color:EMBED_COLORS.bank})]});}
   if(sub==='daily'){const now=Date.now(),r=db.prepare('SELECT * FROM economy WHERE guild_id=? AND user_id=?').get(i.guild.id,i.user.id);if(r?.daily_at&&now-r.daily_at<86400000)return i.reply({embeds:[embed('⏳ Daily Cooldown','Reward harian masih cooldown.',{color:EMBED_COLORS.warning})],ephemeral:true});db.prepare('INSERT INTO economy(guild_id,user_id,balance,daily_at) VALUES(?,?,1000,?) ON CONFLICT(guild_id,user_id) DO UPDATE SET balance=balance+1000,daily_at=excluded.daily_at').run(i.guild.id,i.user.id,now);return i.reply({embeds:[embed('🎁 Daily Reward','Kamu menerima **Rp1.000**.',{color:EMBED_COLORS.success})]});}
  }
  if(n==='moderation'){
   const sub=i.options.getSubcommand(true);
   if(sub==='warn'){const u=i.options.getUser('user',true),reason=i.options.getString('reason')||'Tidak ada alasan',now=Date.now();db.prepare('INSERT INTO warnings(guild_id,user_id,reason,moderator_id,created_at) VALUES(?,?,?,?,?)').run(i.guild.id,u.id,reason,i.user.id,now);const caseRow=db.prepare("INSERT INTO moderation_cases(guild_id,target_id,moderator_id,type,reason,created_at,status) VALUES(?,?,?,?,?,?,?)").run(i.guild.id,u.id,i.user.id,'warn',reason,now,'open');return i.reply({embeds:[embed('⚠️ Warning','User <@'+u.id+'> diberi warning.\nCase: **#'+caseRow.lastInsertRowid+'**\nAlasan: **'+reason+'**',{color:EMBED_COLORS.warning})]});}
   if(sub==='ban'){const u=i.options.getUser('user',true),m=await i.guild.members.fetch(u.id).catch(()=>null);if(!m)return i.reply({embeds:[embed('❌ Member Tidak Ditemukan','Target tidak ditemukan di server.',{color:EMBED_COLORS.error})],ephemeral:true});const reason=i.options.getString('reason')||'Ban via Nararya Bot Discord';await m.ban({reason});const caseRow=db.prepare("INSERT INTO moderation_cases(guild_id,target_id,moderator_id,type,reason,created_at,status) VALUES(?,?,?,?,?,?,?)").run(i.guild.id,u.id,i.user.id,'ban',reason,Date.now(),'open');return i.reply({embeds:[embed('🔨 Member Dibanned','User <@'+u.id+'> berhasil dibanned.\nCase: **#'+caseRow.lastInsertRowid+'**',{color:EMBED_COLORS.error})]});}
  }
  if(n==='support'){
   const sub=i.options.getSubcommand(true);
   if(sub==='ticket'){const row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket-create').setLabel('Buat Ticket').setEmoji('🎫').setStyle(ButtonStyle.Primary));return i.reply({embeds:[embed('🎫 Ticket Center','Tekan tombol di bawah untuk membuka ticket support.')],components:[row]});}
  }

  if(n==='sim'){
   const sub=i.options.getSubcommand(true),uid=i.user.id,gid=i.guild.id;
   db.prepare('INSERT OR IGNORE INTO tycoon(guild_id,user_id) VALUES(?,?)').run(gid,uid);
   let p=db.prepare('SELECT * FROM tycoon WHERE guild_id=? AND user_id=?').get(gid,uid);
   if(sub==='profile')return i.reply({embeds:[embed('🏙️ Profil Simulasi','💰 Cash: Rp'+p.money.toLocaleString('id-ID')+'\\n🏦 Bank: Rp'+p.bank.toLocaleString('id-ID')+'\\n🏙️ Kota Lv.'+p.city_level+'\\n🎣 Pancing Lv.'+p.fish_level)]});
   if(sub==='daily'){if(Date.now()-p.daily_at<86400000)return i.reply({embeds:[embed('⏳ Daily Cooldown','Daily reward simulasi masih cooldown.',{color:EMBED_COLORS.warning})],ephemeral:true});db.prepare('UPDATE tycoon SET money=money+50000,daily_at=? WHERE guild_id=? AND user_id=?').run(Date.now(),gid,uid);return i.reply({embeds:[embed('🎁 Daily Reward','Kamu mendapatkan **Rp50.000**!',{color:EMBED_COLORS.success})]})}
   if(sub==='bank'){const amount=i.options.getInteger('amount',true);if(amount<=0||amount>p.money)return i.reply({embeds:[embed('🏦 Deposit Gagal','Jumlah deposit tidak valid atau cash tidak mencukupi.',{color:EMBED_COLORS.warning})],ephemeral:true});db.prepare('UPDATE tycoon SET money=money-?,bank=bank+? WHERE guild_id=? AND user_id=?').run(amount,amount,gid,uid);return i.reply({embeds:[embed('🏦 Deposit Berhasil','Rp'+amount.toLocaleString('id-ID')+' masuk ke bank.',{color:EMBED_COLORS.bank})]})}
   if(sub==='fish'){const gain=5000+p.fish_level*1000;db.prepare('UPDATE tycoon SET money=money+?,energy=MAX(0,energy-10) WHERE guild_id=? AND user_id=?').run(gain,gid,uid);return i.reply({embeds:[embed('🎣 Fishing','Hasil tangkapan: **Rp'+gain.toLocaleString('id-ID')+'**',{color:EMBED_COLORS.fishing})]})}
   if(sub==='build'){const cost=25000*p.city_level;if(p.money<cost)return i.reply({embeds:[embed('🏗️ Build Gagal','Uang tidak cukup. Biaya upgrade: **Rp'+cost.toLocaleString('id-ID')+'**.',{color:EMBED_COLORS.warning})],ephemeral:true});db.prepare('UPDATE tycoon SET money=money-?,city_level=city_level+1 WHERE guild_id=? AND user_id=?').run(cost,gid,uid);return i.reply({embeds:[embed('🏗️ City Upgrade','Kota naik ke **Level '+(p.city_level+1)+'**.',{color:EMBED_COLORS.city})]})}
   if(sub==='gacha'){
 const cooldown=gameCooldownLeft(gid,uid);
 if(cooldown)return i.reply({embeds:[embed('⏳ Cooldown Gacha','Tunggu **'+Math.ceil(cooldown/1000)+' detik** sebelum menggunakan game/gacha lagi.',{color:EMBED_COLORS.warning})],ephemeral:true});
 const daily=consumeDailyPull(jkt48Dbs.gacha,gid,uid,10);
 if(!daily.allowed)return i.reply({embeds:[embed('🎴 Gacha Harian','Batas **10 kali per hari** sudah tercapai.',{color:EMBED_COLORS.warning})],ephemeral:true});
 if(p.money<10000){jkt48Dbs.gacha.prepare('UPDATE gacha_daily SET pulls=MAX(0,pulls-1) WHERE guild_id=? AND user_id=? AND day=?').run(gid,uid,daily.day);return i.reply({embeds:[embed('💸 Saldo Tidak Cukup','Gacha membutuhkan **Rp10.000**.',{color:EMBED_COLORS.warning})],ephemeral:true});}
 const members=db.prepare("SELECT id as key,name,image_url,generation,status FROM jkt48_members WHERE generation BETWEEN 1 AND 14 ORDER BY name").all();
 if(!members.length){jkt48Dbs.gacha.prepare('UPDATE gacha_daily SET pulls=MAX(0,pulls-1) WHERE guild_id=? AND user_id=? AND day=?').run(gid,uid,daily.day);return i.reply({embeds:[embed('🎴 Gacha Belum Siap','Database member generasi **1–14** belum tersedia.',{color:EMBED_COLORS.warning})],ephemeral:true});}
 const r=rollGacha(members);
 db.prepare('UPDATE tycoon SET money=money-10000 WHERE guild_id=? AND user_id=?').run(gid,uid);
 const card=awardCard(jkt48Dbs.cards,{guildId:gid,userId:uid,type:'member',key:r.member.key||r.member.name,name:r.member.name||r.member.key,rarity:r.rarity,generation:r.member.generation||null,imageUrl:r.member.image_url||null,source:'sim-gacha'});
 saveGacha(jkt48Dbs.gacha,gid,uid,r,'sim-gacha',r.member.generation||null);
 return revealAnimation(i,{title:'🎴 JKT48 Gacha',prefix:'💰 Biaya: **Rp10.000**\\n\\n',rarity:r.rarity,finalDescription:'🎴 **'+card.subject_name+'**\\nGenerasi '+(card.generation||'?')+'\\n📦 Kartu diperoleh: **×'+card.quantity+'**\\n💰 Sisa cash: **Rp'+(p.money-10000).toLocaleString('id-ID')+'**\\n🎟️ Sisa pull hari ini: **'+(10-daily.count)+'**',finalImage:card.image_url||null});
}
  }
  if(n==='jkt48game'){
   const sub=i.options.getSubcommand(true);
   if(sub==='asset_add'){
    const mode=i.options.getString('mode',true),answer=i.options.getString('answer',true).trim(),mediaUrl=i.options.getString('media_url',true).trim(),rarity=i.options.getString('rarity',true);
    if(!validMedia(mediaUrl))return i.reply({embeds:[embed('❌ URL Media Tidak Valid','Gunakan URL **http/https** yang dapat diakses publik.',{color:EMBED_COLORS.error})],ephemeral:true});
    addQuizAsset(jkt48Dbs.quiz,mode,answer,mediaUrl,rarity);
    return i.reply({embeds:[embed('✅ Asset Quiz Ditambahkan','Mode: **'+MODES[mode]+'**\\nJawaban: **'+answer+'**\\nRarity: '+rarityInfo[rarity].emoji+' **'+rarityInfo[rarity].label+'**\\n\\nAsset tersimpan di **database quiz terpisah**.',{color:EMBED_COLORS.success})]});
   }
   if(sub==='asset_list'){
    const mode=i.options.getString('mode');
    const rows=mode?jkt48Dbs.quiz.prepare('SELECT rarity,COUNT(*) count FROM quiz_assets WHERE active=1 AND kind=? GROUP BY rarity ORDER BY count DESC').all(mode):jkt48Dbs.quiz.prepare('SELECT kind,COUNT(*) count FROM quiz_assets WHERE active=1 GROUP BY kind ORDER BY kind').all();
    const body=rows.length?(mode?rows.map(x=>(rarityInfo[x.rarity]?.emoji||'🎴')+' '+(rarityInfo[x.rarity]?.label||x.rarity)+' • '+x.count).join('\\n'):rows.map(x=>'**'+(MODES[x.kind]||x.kind)+'** • '+x.count).join('\\n')):'Belum ada asset.';
    return i.reply({embeds:[embed('🗂️ Quiz Asset Database',body,{color:EMBED_COLORS.game})]});
   }
   if(sub==='gacha'){
    const cooldown=gameCooldownLeft(i.guild.id,i.user.id);
    if(cooldown)return i.reply({embeds:[embed('⏳ Cooldown Gacha','Tunggu **'+Math.ceil(cooldown/1000)+' detik** sebelum menggunakan game/gacha lagi.',{color:EMBED_COLORS.warning})],ephemeral:true});
    const members=db.prepare("SELECT id as key,name,image_url,generation,status FROM jkt48_members WHERE generation BETWEEN 1 AND 14 ORDER BY name").all();
    if(!members.length)return i.reply({embeds:[embed('🎴 Gacha Belum Siap','Database member generasi **1–14** belum tersedia. Sinkronisasi member perlu berhasil terlebih dahulu.',{color:EMBED_COLORS.warning})],ephemeral:true});
    const daily=consumeDailyPull(jkt48Dbs.gacha,i.guild.id,i.user.id,10);
    if(!daily.allowed)return i.reply({embeds:[embed('🎴 Gacha Harian','Batas **10 kali per hari** sudah tercapai. Reset otomatis saat pergantian hari sesuai zona waktu bot.',{color:EMBED_COLORS.warning})],ephemeral:true});
    const r=rollGacha(members); const key=r.member.key||r.member.name;
    const card=awardCard(jkt48Dbs.cards,{guildId:i.guild.id,userId:i.user.id,type:'member',key,name:r.member.name||key,rarity:r.rarity,generation:r.member.generation||null,imageUrl:r.member.image_url||null,source:'jkt48game-gacha'});
    saveGacha(jkt48Dbs.gacha,i.guild.id,i.user.id,r,'jkt48game-gacha',r.member.generation||null);
    return revealAnimation(i,{title:'🎴 JKT48 Gacha',prefix:'🎁 **CARD PACK OPENING**\\n\\n',rarity:r.rarity,finalDescription:'👤 **'+card.subject_name+'**\\nGenerasi '+(card.generation||'?')+'\\n📦 Kartu: **×'+card.quantity+'**',finalImage:card.image_url||null});
   }
   if(sub==='inventory'){
    const rows=getCardInventory(jkt48Dbs.cards,i.guild.id,i.user.id,40);
    const stats=getCollectionStats(jkt48Dbs.cards,i.guild.id,i.user.id);
    const body=rows.length?rows.map(x=>{
      const ri=rarityInfo[x.rarity]||rarityInfo.common;
      return ri.emoji+' **'+x.subject_name+'** • '+ri.label+' • ×'+x.quantity+(x.generation?' • Gen '+x.generation:'');
    }).join('\\n'):'Belum punya kartu.';
    const summary=stats.length?'\\n\\n**Koleksi per rarity:**\\n'+stats.map(x=>(rarityInfo[x.rarity]?.emoji||'🎴')+' '+(rarityInfo[x.rarity]?.label||x.rarity)+' • '+x.unique_cards+' unik • ×'+x.quantity).join('\\n'):'';
    return i.reply({embeds:[embed('🎴 Card Collection',body+summary,{color:EMBED_COLORS.gacha})]});
   }
   if(sub==='leaderboard'){
    const rows=getLeaderboard(jkt48Dbs.quiz,i.guild.id);
    return i.reply({embeds:[embed('🏆 JKT48 Game Leaderboard',rows.length?rows.map((x,n)=>'#'+(n+1)+' <@'+x.user_id+'> • '+x.points+' poin • '+x.wins+' menang • '+x.games+' game').join('\\n'):'Belum ada skor.') ]});
   }
   const mode=i.options.getString('mode',true);
   const cooldown=gameCooldownLeft(i.guild.id,i.user.id);
   if(cooldown)return i.reply({embeds:[embed('⏳ Game Cooldown','Tunggu **'+Math.ceil(cooldown/1000)+' detik** sebelum memainkan tebak-tebakan lagi.',{color:EMBED_COLORS.warning})],ephemeral:true});

   const daily=consumeDailyQuiz(jkt48Dbs.quiz,i.guild.id,i.user.id,10);
   if(!daily.allowed)return i.reply({embeds:[embed('Game Harian','Batas 10 permainan tebak-tebakan per hari sudah tercapai. Reset otomatis saat pergantian hari sesuai zona waktu bot.',{color:EMBED_COLORS.warning})],ephemeral:true});
   const assets=getQuizAssets(jkt48Dbs.quiz,mode);
   if(!assets.length){jkt48Dbs.quiz.prepare('UPDATE quiz_daily SET plays=MAX(0,plays-1) WHERE guild_id=? AND user_id=? AND day=?').run(i.guild.id,i.user.id,daily.day);return i.reply({embeds:[embed('🎯 Asset Game Kosong','Asset untuk mode **'+MODES[mode]+'** belum tersedia. Admin perlu menambah asset ke database quiz.',{color:EMBED_COLORS.warning})],ephemeral:true});}
   const q=assets[0],rarity=q.rarity||rollRarity();
   const active=startSession(jkt48Dbs.quiz,{guildId:i.guild.id,userId:i.user.id,channelId:i.channel.id,mode,answer:q.answer,mediaUrl:q.media_url,rarity,durationMs:QUIZ_TIMEOUT_MS});
   scheduleQuizExpiry(active);
   return revealAnimation(i,{title:'🎯 '+MODES[mode],prefix:'🃏 **Challenge Card**\\n\\nBalas pesan ini dengan jawabanmu.\\n⏱️ Waktu: **1 menit**\\n\\n',rarity,finalDescription:'🃏 **Tantangan aktif**\\nMode: '+MODES[mode]+'\\nRarity: '+(rarityInfo[rarity]?.label||rarity)+'\\n⏱️ Jawab dalam **1 menit**.',finalImage:q.media_url||null});
  }
  if(n==='jkt48'){
   const group=i.options.getSubcommandGroup(false),type=i.options.getSubcommand(true);
   if(!group&&type==='member'){
    const q=i.options.getString('query',true).trim();
    const row=db.prepare('SELECT * FROM jkt48_members WHERE name LIKE ? OR nickname LIKE ? ORDER BY status DESC,generation DESC LIMIT 1').get('%'+q+'%','%'+q+'%');
    if(!row)return i.reply({embeds:[embed('🔎 Member Tidak Ditemukan','Tidak menemukan member dengan kata kunci **'+q+'**.',{color:EMBED_COLORS.warning})],ephemeral:true});
    return i.reply({embeds:[memberEmbed(row)]});
   }
   if(!group&&type==='members'){
    const gen=i.options.getInteger('generation');
    const rows=gen?db.prepare('SELECT name,nickname,status,team FROM jkt48_members WHERE generation=? ORDER BY name').all(gen):db.prepare('SELECT generation,COUNT(*) count FROM jkt48_members GROUP BY generation ORDER BY generation').all();
    if(!rows.length)return i.reply({embeds:[embed('👥 Database Member JKT48','Belum ada data member. Sinkronisasi sumber member belum menghasilkan data.',{color:EMBED_COLORS.warning})],ephemeral:true});
    if(gen){
      const active=rows.filter(x=>x.status==='active').length;
      const text=rows.map(x=>'• **'+x.name+'**'+(x.nickname?' ('+x.nickname+')':'')+' • '+(x.status==='active'?'🟢 Aktif':'⚪ '+x.status)+(x.team?' • '+x.team:'')).join('\n');
      return i.reply({embeds:[embed('👥 JKT48 Generasi '+gen,text+'\n\n**Total:** '+rows.length+' • **Aktif:** '+active,{color:EMBED_COLORS.jkt48})]});
    }
    return i.reply({embeds:[embed('👥 Database JKT48','Data per generasi:\n'+rows.map(x=>'**Gen '+x.generation+'** • '+x.count+' member').join('\n'),{color:EMBED_COLORS.jkt48})]});
   }
   if(!group)return;
   try{
    if(group==='upcoming'){
      const rows=await getUpcoming(type,db);
      return i.reply({embeds:[embed('📅 Upcoming '+TYPE_LABELS[type],renderList(TYPE_LABELS[type],rows),{color:EMBED_COLORS.jkt48})]});
    }
    if(group==='latest'){
      const rows=type==='live_showroom'?await getLatestPlatform('showroom',db):type==='live_idn'?await getLatestPlatform('idn',db):await getLatest(type,db);
      return i.reply({embeds:[embed('🕘 Latest '+TYPE_LABELS[type],renderList(TYPE_LABELS[type],rows),{color:EMBED_COLORS.info})]});
    }
   }catch(e){
    return i.reply({embeds:[embed('⚠️ Gagal Mengambil Data','Sumber JKT48 tidak dapat diakses saat ini. '+e.message,{color:EMBED_COLORS.error})],ephemeral:true});
   }
  }

  if(n==='feed'){
   const sub=i.options.getSubcommand(false);
   if(sub==='defaults'){
    const channel=db.prepare('SELECT feed_channel FROM guild_config WHERE guild_id=?').get(i.guild.id)?.feed_channel;
    if(!channel)return i.reply({embeds:[embed('⚙️ Feed Channel Belum Diatur','Atur feed channel terlebih dahulu melalui konfigurasi server.',{color:EMBED_COLORS.warning})],ephemeral:true});
    let added=0;
    for(const [id,label,kind,url] of DEFAULT_SOURCES){
     if(db.prepare('SELECT 1 FROM feed_sources WHERE guild_id=? AND url=?').get(i.guild.id,url))continue;
     db.prepare('INSERT INTO feed_sources(guild_id,name,url,channel_id,kind,enabled) VALUES(?,?,?,?,?,1)').run(i.guild.id,label,url,channel,kind);
     added++;
    }
    return i.reply({embeds:[embed('📡 JKT48 Feed Registry Dipasang','Menambahkan **'+added+'** sumber baru ke <#'+channel+'>. URL costume/member yang belum dikonfigurasi tidak dibuat secara palsu.',{color:EMBED_COLORS.success})]});
   }
   if(sub==='add'){
    const name=i.options.getString('name',true).trim(),url=i.options.getString('url',true).trim(),channel=i.options.getChannel('channel',true),kind=i.options.getString('kind',true);
    let parsedUrl;
    try{parsedUrl=new URL(url);}catch{return i.reply({embeds:[embed('❌ URL Tidak Valid','Gunakan URL publik http/https.',{color:EMBED_COLORS.error})],ephemeral:true});}
    if(parsedUrl.protocol!=='http:'&&parsedUrl.protocol!=='https:')return i.reply({embeds:[embed('❌ URL Tidak Valid','Gunakan URL publik http/https.',{color:EMBED_COLORS.error})],ephemeral:true});
    const exists=db.prepare('SELECT id FROM feed_sources WHERE guild_id=? AND url=?').get(i.guild.id,url);
    if(exists)return i.reply({embeds:[embed('ℹ️ Feed Sudah Ada','URL tersebut sudah terdaftar sebagai feed **#'+exists.id+'**.',{color:EMBED_COLORS.warning})],ephemeral:true});
    db.prepare('INSERT INTO feed_sources(guild_id,name,url,channel_id,kind,enabled) VALUES(?,?,?,?,?,1)').run(i.guild.id,name,url,channel.id,kind);
    return i.reply({embeds:[embed('✅ Feed Ditambahkan',name+' → '+channel,{color:EMBED_COLORS.success})]});
   }
   if(sub==='remove'){const id=i.options.getInteger('id',true);const result=db.prepare('DELETE FROM feed_sources WHERE id=? AND guild_id=?').run(id,i.guild.id);return i.reply({embeds:[embed(result.changes?'🗑️ Feed Dihapus':'ℹ️ Feed Tidak Ditemukan',result.changes?'ID '+id:'Feed tersebut tidak ditemukan.',{color:result.changes?EMBED_COLORS.success:EMBED_COLORS.warning})]})}
   if(sub==='health'){
    const rows=feedService.health(i.guild.id);
    const body=rows.length?rows.map(x=>'**#'+x.id+' '+x.name+'** • '+(x.healthy?'🟢 OK':'🔴 ERROR')+' • '+x.kind+' • '+(x.last_item_count||0)+' item'+(x.last_error?'\\nError: '+x.last_error:'')).join('\\n\\n'):'Belum ada feed.';
    return i.reply({embeds:[embed('🩺 Feed Scraper Health',body.slice(0,3900),{color:rows.every(x=>x.healthy)?EMBED_COLORS.success:EMBED_COLORS.warning})]});
   }
   if(sub==='test'){
    const id=i.options.getInteger('id',true),row=db.prepare('SELECT * FROM feed_sources WHERE id=? AND guild_id=?').get(id,i.guild.id);
    if(!row)return i.reply({embeds:[embed('❌ Feed Tidak Ditemukan','ID feed tersebut tidak tersedia.',{color:EMBED_COLORS.error})],ephemeral:true});
    const count=await feedService.pollSource(row);
    return i.reply({embeds:[embed('🧪 Feed Test',row.name+' memproses **'+count+'** item.',{color:EMBED_COLORS.info})]});
   }
   const rows=db.prepare('SELECT * FROM feed_sources WHERE guild_id=? ORDER BY id').all(i.guild.id);
   return i.reply({embeds:[embed('📡 Feed Sources',rows.length?rows.map(x=>'#'+x.id+' • '+x.name+' • '+x.kind+' → <#'+x.channel_id+'>').join('\\n'):'Belum ada feed. Gunakan /feed add atau /feed defaults',{color:EMBED_COLORS.info})]});
  }
 }catch(e){console.error(e);if(!i.replied&&!i.deferred)await i.reply({embeds:[embed('⚠️ Terjadi Error',e.message,{color:EMBED_COLORS.error})],ephemeral:true}).catch(()=>{})}
});
client.once('ready',async()=>{
 console.log('Nararya Bot Discord online as '+client.user.tag);
 await botControl.applyPresence().catch(error=>console.warn('[bot-control] '+error.message));
 scraperOrchestrator.start();
 extendedFeatures.start();
 await presenceRotation.start().catch(error=>console.warn('[presence] '+error.message));
 void runDataPipelineCheck();
 setInterval(()=>void runDataPipelineCheck(),10000);
 for(const g of client.guilds.cache.values()){
  const ch=db.prepare('SELECT feed_channel FROM guild_config WHERE guild_id=?').get(g.id)?.feed_channel;
  if(ch){
   for(const [id,label,kind,url] of DEFAULT_SOURCES){
    if(db.prepare('SELECT 1 FROM feed_sources WHERE guild_id=? AND url=?').get(g.id,url))continue;
    db.prepare('INSERT INTO feed_sources(guild_id,name,url,channel_id,kind,enabled) VALUES(?,?,?,?,?,1)').run(g.id,label,url,ch,kind);
   }
  }
 }
 for(const session of jkt48Dbs.quiz.prepare("SELECT * FROM quiz_sessions WHERE status='active'").all())scheduleQuizExpiry(session);
 const synced=await syncMemberDatabase(db).catch(error=>{console.warn('[jkt48-members] '+error.message);return 0;});
 console.log('[jkt48-members] synced '+synced+' members from AllMember/ActiveMember');
 setInterval(()=>syncMemberDatabase(db).catch(error=>console.warn('[jkt48-members] '+error.message)),Math.max(3600,Number(process.env.JKT48_MEMBER_SYNC_INTERVAL_SECONDS||21600))*1000);
 await feedService.poll();
 setInterval(()=>feedService.poll().catch(console.error),Math.max(30,Number(process.env.SCRAPER_INTERVAL_SECONDS||120))*1000);
 await sendIndonesiaDataRefresh();
 const dataRefreshHours=Math.max(24,Number(process.env.INDONESIA_DATA_REFRESH_HOURS||24));
 setInterval(()=>sendIndonesiaDataRefresh().catch(console.error),dataRefreshHours*60*60*1000);
 setInterval(()=>checkRamadanNotifications().catch(console.error),30*1000);
 jkt48Monitor.start();
});
client.login(process.env.DISCORD_TOKEN);