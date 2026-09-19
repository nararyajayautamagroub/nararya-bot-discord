import 'dotenv/config';
import Database from 'better-sqlite3';
import {Client,GatewayIntentBits,Partials,EmbedBuilder,ActionRowBuilder,ButtonBuilder,ButtonStyle,ChannelType,PermissionFlagsBits,SlashCommandBuilder} from 'discord.js';
import {createFeedService} from './jkt48/feed-service.js';
import {DEFAULT_SOURCES} from './jkt48/sources.js';
import {ensureTables,MODES,matches,rollGacha,rollRarity,rarityInfo,validMedia} from './services/games/jkt48/index.js';
import {syncMemberDatabase} from './jkt48/member-database.js';
import {configured as jkt48ConnectConfigured} from './jkt48/connect.js';
import {getUpcoming,getLatest,getLatestPlatform,renderList,TYPE_LABELS} from './jkt48/command-service.js';
import {createJkt48Monitor} from './jkt48/live-monitor.js';
import {createJkt48FeatureDatabases} from './services/games/jkt48/databases.js';
import {awardCard,getInventory as getCardInventory,getCollectionStats} from './services/games/jkt48/card-system.js';
import {addQuizAsset,getQuizAssets,migrateLegacyAssets,startSession,getActiveSession,finishSession,calculatePoints,recordAttempt,recordResult,getLeaderboard} from './services/games/jkt48/quiz-system.js';
import {saveGacha,consumeDailyPull} from './services/games/jkt48/gacha.js';
import {revealAnimation,revealChannel} from './services/games/jkt48/reveal-animation.js';
import {createMediaDatabase} from './media/database.js';
import {createMediaService} from './media/service.js';
import {handleMediaCommand} from './media/command.js';

const db=new Database(process.env.DATABASE_PATH||'./data/nararya.db');
db.pragma('journal_mode=WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS jkt48_members(id TEXT PRIMARY KEY,name TEXT NOT NULL,nickname TEXT,generation INTEGER,virtual_generation INTEGER,status TEXT DEFAULT 'active',team TEXT,image_url TEXT,profile_url TEXT,join_date TEXT,graduation_date TEXT,showroom_url TEXT,idn_url TEXT,youtube_url TEXT,instagram_url TEXT,tiktok_url TEXT,x_url TEXT,updated_at INTEGER DEFAULT 0);\nCREATE TABLE IF NOT EXISTS guild_config(guild_id TEXT PRIMARY KEY,welcome_channel TEXT,goodbye_channel TEXT,log_channel TEXT,ticket_category TEXT,ticket_staff_role TEXT,feed_channel TEXT);
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

`);
ensureTables(db);
const jkt48Dbs=createJkt48FeatureDatabases();
const mediaDbState=createMediaDatabase();
const mediaService=createMediaService({db:mediaDbState.db,dir:mediaDbState.dir});
migrateLegacyAssets(db,jkt48Dbs.quiz);
try{db.prepare('ALTER TABLE feed_sources ADD COLUMN kind TEXT DEFAULT "public"').run()}catch{}
const EMBED_COLORS=Object.freeze({default:0xFF6200,success:0x22C55E,error:0xEF4444,warning:0xF59E0B,info:0x3B82F6,jkt48:0xE91E63,gacha:0x8B5CF6,game:0x06B6D4,bank:0x16A34A,shop:0xF97316,city:0x64748B,fishing:0x0891B2});
const embed=(title,description='',opts={})=>{const e=new EmbedBuilder().setTitle(title).setDescription(description).setColor(opts.color??EMBED_COLORS.default).setTimestamp().setAuthor({name:'BOT NARARYA GROUB'}).setFooter({text:'PT NARARYA JAYA UTAMA GROUB - All Right Reserved'});if(opts.url)e.setURL(opts.url);if(opts.image)e.setImage(opts.image);if(opts.thumbnail)e.setThumbnail(opts.thumbnail);if(opts.fields)e.addFields(opts.fields);return e};
const memberEmbed=(m)=>embed('👤 '+m.name,`${m.status==='active'?'🟢 Aktif':'⚪ '+(m.status||'Tidak aktif')} • Generasi ${m.generation}${m.team?' • '+m.team:''}${m.virtual_generation?' • JKT48V Gen '+m.virtual_generation:''}`,{color:m.virtual_generation?0x7C3AED:EMBED_COLORS.jkt48,thumbnail:m.image_url,url:m.profile_url,fields:[{name:'Informasi',value:[m.nickname?'Nama panggilan: '+m.nickname:'',m.join_date?'Bergabung: '+m.join_date:'',m.graduation_date?'Graduasi: '+m.graduation_date:''].filter(Boolean).join('\n')||'Belum ada data tambahan.'}]});
const feedEmbed=x=>embed('📡 '+x.sourceName,x.description||'Update baru terdeteksi.',{url:x.url,image:x.image});
const client=new Client({intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMembers,GatewayIntentBits.GuildMessages,GatewayIntentBits.MessageContent,GatewayIntentBits.GuildVoiceStates,GatewayIntentBits.GuildModeration],partials:[Partials.Channel,Partials.Message]});
const recent=new Map();
function moderate(m){
 const key=m.guild.id+':'+m.author.id,now=Date.now(),arr=(recent.get(key)||[]).filter(t=>now-t<8000);arr.push(now);recent.set(key,arr);
 if(arr.length>=6)return{delete:true,timeout:60000};
 if(/discord(?:app)?\\.com\\/invite\\//i.test(m.content))return{delete:true};
 if(/https?:\\/\\//i.test(m.content)&&!m.member.permissions.has(PermissionFlagsBits.ManageMessages))return{delete:true};
}
function addXp(m){
 const r=db.prepare('SELECT * FROM levels WHERE guild_id=? AND user_id=?').get(m.guild.id,m.author.id);
 const xp=(r?.xp||0)+5+Math.floor(Math.random()*8),lv=Math.floor(Math.sqrt(xp/100));
 if(r)db.prepare('UPDATE levels SET xp=?,level=? WHERE guild_id=? AND user_id=?').run(xp,lv,m.guild.id,m.author.id);
 else db.prepare('INSERT INTO levels(guild_id,user_id,xp,level) VALUES(?,?,?,?)').run(m.guild.id,m.author.id,xp,lv);
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
client.on('messageCreate',async m=>{
 if(m.author.bot||!m.guild)return;
 const session=getActiveSession(jkt48Dbs.quiz,m.guild.id,m.author.id,m.channel.id);
 if(session){
  const answers=session.answer.split(/\\s*[|;]\\s*/).map(x=>x.trim()).filter(Boolean);
  const correct=matches(m.content,answers);
  if(correct){
   const seconds=(Date.now()-session.started_at)/1000;
   const points=calculatePoints(seconds,session.rarity);
   finishSession(jkt48Dbs.quiz,session.id,'finished');
   const score=recordResult(jkt48Dbs.quiz,{guildId:m.guild.id,userId:m.author.id,mode:session.mode,rarity:session.rarity,answer:session.answer,input:m.content,correct:true,points,durationMs:Date.now()-session.started_at});
   const member=db.prepare('SELECT * FROM jkt48_members WHERE name LIKE ? OR nickname LIKE ? ORDER BY status DESC,generation DESC LIMIT 1').get('%'+session.answer+'%','%'+session.answer+'%');
   const card=awardCard(jkt48Dbs.cards,{
    guildId:m.guild.id,userId:m.author.id,
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
  }else{
   recordAttempt(jkt48Dbs.quiz,{guildId:m.guild.id,userId:m.author.id,mode:session.mode,rarity:session.rarity,answer:session.answer,input:m.content,correct:false,points:0,durationMs:Date.now()-session.started_at});
   await m.channel.send({embeds:[embed('❌ Belum Tepat','Jawabanmu belum cocok. Tantangan masih aktif.\\n'+(rarityInfo[session.rarity]?.emoji||'🎴')+' Rarity: **'+(rarityInfo[session.rarity]?.label||session.rarity)+'**',{color:EMBED_COLORS.warning})]}).catch(()=>{});
  }
 }
 const a=moderate(m);if(a?.delete)await m.delete().catch(()=>{});if(a?.timeout)await m.member.timeout(a.timeout,'Auto moderation').catch(()=>{});addXp(m)
});
client.on('guildMemberAdd',async m=>{const c=db.prepare('SELECT welcome_channel FROM guild_config WHERE guild_id=?').get(m.guild.id),ch=c?.welcome_channel?m.guild.channels.cache.get(c.welcome_channel):null;if(ch?.isTextBased())await ch.send({embeds:[embed('👋 Selamat datang','Selamat datang '+m.user.tag+'!')]})});
client.on('guildMemberRemove',async m=>{const c=db.prepare('SELECT goodbye_channel FROM guild_config WHERE guild_id=?').get(m.guild.id),ch=c?.goodbye_channel?m.guild.channels.cache.get(c.goodbye_channel):null;if(ch?.isTextBased())await ch.send({embeds:[embed('👋 Sampai jumpa','Sampai jumpa '+m.user.tag+'.')]})});
client.on('interactionCreate',async i=>{
 try{
  if(i.isButton()&&i.customId==='ticket-create'){const ch=await openTicket(i);return i.reply({embeds:[embed('🎫 Ticket Dibuat','Ticket kamu sudah dibuat: '+ch)],ephemeral:true})}
  if(i.isButton()&&i.customId==='ticket-close'){db.prepare("UPDATE tickets SET status='closed',closed_at=? WHERE channel_id=? AND status='open'").run(Date.now(),i.channel.id);await i.reply({embeds:[embed('🔒 Ticket Ditutup','Ticket ditandai closed.')]});return i.channel.permissionOverwrites.edit(i.user.id,{SendMessages:false}).catch(()=>{})}
  if(!i.isChatInputCommand())return;
  const n=i.commandName;

  if(n==='media')return handleMediaCommand(i,{mediaService,embed,colors:EMBED_COLORS});

  if(n==='utility'){
   const sub=i.options.getSubcommand(true);
   if(sub==='ping')return i.reply({embeds:[embed('🏓 Pong','Latency Discord: **'+i.client.ws.ping+'ms**',{color:EMBED_COLORS.info})]});
   if(sub==='server')return i.reply({embeds:[embed('🏠 Server Info','**'+i.guild.name+'**\n👥 Member: **'+i.guild.memberCount+'**\n🆔 '+i.guild.id)]});
   if(sub==='user'){const u=i.options.getUser('target')||i.user;return i.reply({embeds:[embed('👤 User Info','**'+u.tag+'**\n🆔 '+u.id+'\n🤖 Bot: '+(u.bot?'Ya':'Tidak'))]});}
   if(sub==='level'){const r=db.prepare('SELECT * FROM levels WHERE guild_id=? AND user_id=?').get(i.guild.id,i.user.id);return i.reply({embeds:[embed('⭐ Level','Level **'+(r?.level||0)+'**\nXP **'+(r?.xp||0)+'**',{color:EMBED_COLORS.info})]});}
  }
  if(n==='economy'){
   const sub=i.options.getSubcommand(true);
   if(sub==='balance'){const b=db.prepare('SELECT balance FROM economy WHERE guild_id=? AND user_id=?').get(i.guild.id,i.user.id)?.balance||0;return i.reply({embeds:[embed('💰 Economy','Saldo: **Rp '+b.toLocaleString('id-ID')+'**',{color:EMBED_COLORS.bank})]});}
   if(sub==='daily'){const now=Date.now(),r=db.prepare('SELECT * FROM economy WHERE guild_id=? AND user_id=?').get(i.guild.id,i.user.id);if(r?.daily_at&&now-r.daily_at<86400000)return i.reply({embeds:[embed('⏳ Daily Cooldown','Reward harian masih cooldown.',{color:EMBED_COLORS.warning})],ephemeral:true});db.prepare('INSERT INTO economy(guild_id,user_id,balance,daily_at) VALUES(?,?,1000,?) ON CONFLICT(guild_id,user_id) DO UPDATE SET balance=balance+1000,daily_at=excluded.daily_at').run(i.guild.id,i.user.id,now);return i.reply({embeds:[embed('🎁 Daily Reward','Kamu menerima **Rp1.000**.',{color:EMBED_COLORS.success})]});}
  }
  if(n==='moderation'){
   const sub=i.options.getSubcommand(true);
   if(sub==='warn'){const u=i.options.getUser('user',true),reason=i.options.getString('reason')||'Tidak ada alasan';db.prepare('INSERT INTO warnings(guild_id,user_id,reason,moderator_id,created_at) VALUES(?,?,?,?,?)').run(i.guild.id,u.id,reason,i.user.id,Date.now());return i.reply({embeds:[embed('⚠️ Warning','User <@'+u.id+'> diberi warning.\nAlasan: **'+reason+'**',{color:EMBED_COLORS.warning})]});}
   if(sub==='ban'){const u=i.options.getUser('user',true),m=await i.guild.members.fetch(u.id).catch(()=>null);if(!m)return i.reply({embeds:[embed('❌ Member Tidak Ditemukan','Target tidak ditemukan di server.',{color:EMBED_COLORS.error})],ephemeral:true});await m.ban({reason:i.options.getString('reason')||'Ban via Nararya Bot Discord'});return i.reply({embeds:[embed('🔨 Member Dibanned','User <@'+u.id+'> berhasil dibanned.',{color:EMBED_COLORS.error})]});}
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
    const members=db.prepare("SELECT id as key,name,image_url,generation,status FROM jkt48_members WHERE generation BETWEEN 1 AND 14 ORDER BY name").all();
    if(!members.length)return i.reply({embeds:[embed('🎴 Gacha Belum Siap','Database member generasi **1–14** belum tersedia. Sinkronisasi member perlu berhasil terlebih dahulu.',{color:EMBED_COLORS.warning})],ephemeral:true});
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
   const mode=i.options.getString('mode',true),assets=getQuizAssets(jkt48Dbs.quiz,mode);
   if(!assets.length)return i.reply({embeds:[embed('🎯 Asset Game Kosong','Asset untuk mode **'+MODES[mode]+'** belum tersedia. Admin perlu menambah asset ke database quiz.',{color:EMBED_COLORS.warning})],ephemeral:true});
   const q=assets[0],rarity=q.rarity||rollRarity();
   const active=startSession(jkt48Dbs.quiz,{guildId:i.guild.id,userId:i.user.id,channelId:i.channel.id,mode,answer:q.answer,mediaUrl:q.media_url,rarity,durationMs:Number(process.env.JKT48_QUIZ_TIMEOUT_MS||60000)});
   return revealAnimation(i,{title:'🎯 '+MODES[mode],prefix:'🃏 **Challenge Card**\\n\\nBalas pesan ini dengan jawabanmu.\\n⏱️ Waktu: **'+Math.round((active.expires_at-active.started_at)/1000)+' detik**\\n\\n',rarity,finalDescription:'🃏 **Tantangan aktif**\\nMode: '+MODES[mode]+'\\nRarity: '+(rarityInfo[rarity]?.label||rarity)+'\\n⏱️ Jawab dalam **'+Math.round((active.expires_at-active.started_at)/1000)+' detik**.',finalImage:q.media_url||null});
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
   if(!jkt48ConnectConfigured())return i.reply({embeds:[embed('⚙️ JKT48Connect Belum Aktif','Fitur jadwal dan live membutuhkan **JKT48CONNECT_API_KEY** pada environment bot.',{color:EMBED_COLORS.warning})],ephemeral:true});
   try{
    if(group==='upcoming'){
      const rows=await getUpcoming(type);
      return i.reply({embeds:[embed('📅 Upcoming '+TYPE_LABELS[type],renderList(TYPE_LABELS[type],rows),{color:EMBED_COLORS.jkt48})]});
    }
    if(group==='latest'){
      const rows=type==='live_showroom'?await getLatestPlatform('showroom'):type==='live_idn'?await getLatestPlatform('idn'):await getLatest(type);
      return i.reply({embeds:[embed('🕘 Latest '+TYPE_LABELS[type],renderList(TYPE_LABELS[type],rows),{color:EMBED_COLORS.info})]});
    }
   }catch(e){
    return i.reply({embeds:[embed('⚠️ Gagal Mengambil Data','Sumber JKT48 tidak dapat diakses saat ini. '+e.message,{color:EMBED_COLORS.error})],ephemeral:true});
   }
  }

  if(n==='feed'){
   const sub=i.options.getSubcommand(false);
   if(sub==='add'){const name=i.options.getString('name',true),url=i.options.getString('url',true),channel=i.options.getChannel('channel',true),kind=i.options.getString('kind',true);new URL(url);db.prepare('INSERT INTO feed_sources(guild_id,name,url,channel_id,kind,enabled) VALUES(?,?,?,?,?,1)').run(i.guild.id,name,url,channel.id,kind);return i.reply({embeds:[embed('✅ Feed ditambahkan',name+' → '+channel)]})}
   if(sub==='remove'){const id=i.options.getInteger('id',true);db.prepare('DELETE FROM feed_sources WHERE id=? AND guild_id=?').run(id,i.guild.id);return i.reply({embeds:[embed('🗑️ Feed dihapus','ID '+id)]})}
   if(sub==='test'){const id=i.options.getInteger('id',true),row=db.prepare('SELECT * FROM feed_sources WHERE id=? AND guild_id=?').get(id,i.guild.id);if(!row)return i.reply({embeds:[embed('❌ Feed Tidak Ditemukan','ID feed tersebut tidak tersedia.',{color:EMBED_COLORS.error})],ephemeral:true});const count=await feedService.pollSource(row);return i.reply({embeds:[embed('🧪 Feed test',row.name+' memproses '+count+' item.')]})}
   const r=db.prepare('SELECT * FROM feed_sources WHERE guild_id=? ORDER BY id').all(i.guild.id);return i.reply({embeds:[embed('📡 Feed Sources',r.length?r.map(x=>'#'+x.id+' • '+x.name+' • '+x.kind+' → <#'+x.channel_id+'>').join('\\n'):'Belum ada feed. Gunakan /feed add')]});
  }
 }catch(e){console.error(e);if(!i.replied&&!i.deferred)await i.reply({embeds:[embed('⚠️ Terjadi Error',e.message,{color:EMBED_COLORS.error})],ephemeral:true}).catch(()=>{})}
});
client.once('ready',async()=>{
 console.log('Nararya Bot Discord online as '+client.user.tag);
 for(const g of client.guilds.cache.values()){
  const existing=db.prepare('SELECT COUNT(*) c FROM feed_sources WHERE guild_id=?').get(g.id)?.c||0;
  if(existing===0){const ch=db.prepare('SELECT feed_channel FROM guild_config WHERE guild_id=?').get(g.id)?.feed_channel;if(ch)for(const [name,label,kind,url] of DEFAULT_SOURCES)db.prepare('INSERT INTO feed_sources(guild_id,name,url,channel_id,kind,enabled) VALUES(?,?,?,?,?,1)').run(g.id,label,url,ch,kind)}
 }
 const synced=await syncMemberDatabase(db).catch(error=>{console.warn('[jkt48-members] '+error.message);return 0;});
 console.log('[jkt48-members] synced '+synced+' members from AllMember/ActiveMember');
 setInterval(()=>syncMemberDatabase(db).catch(error=>console.warn('[jkt48-members] '+error.message)),Math.max(3600,Number(process.env.JKT48_MEMBER_SYNC_INTERVAL_SECONDS||21600))*1000);
 await feedService.poll();
 setInterval(()=>feedService.poll().catch(console.error),Math.max(30,Number(process.env.SCRAPER_INTERVAL_SECONDS||120))*1000);
 if(jkt48ConnectConfigured())jkt48Monitor.start();
});
client.login(process.env.DISCORD_TOKEN);
