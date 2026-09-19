import 'dotenv/config';
import Database from 'better-sqlite3';
import {Client,GatewayIntentBits,Partials,EmbedBuilder,ActionRowBuilder,ButtonBuilder,ButtonStyle,ChannelType,PermissionFlagsBits,SlashCommandBuilder} from 'discord.js';
import {createFeedService} from './jkt48/feed-service.js';
import {DEFAULT_SOURCES} from './jkt48/sources.js';
import {ensureTables,MODES,matches,rollGacha} from './services/games/jkt48/index.js';
import {addAsset,getAssets} from './services/games/jkt48/assets.js';
import {addScore} from './services/games/jkt48/scoring.js';

const db=new Database(process.env.DATABASE_PATH||'./data/nararya.db');
db.pragma('journal_mode=WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS guild_config(guild_id TEXT PRIMARY KEY,welcome_channel TEXT,goodbye_channel TEXT,log_channel TEXT,ticket_category TEXT,ticket_staff_role TEXT,feed_channel TEXT);
CREATE TABLE IF NOT EXISTS feed_sources(id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT,name TEXT,url TEXT,channel_id TEXT,kind TEXT DEFAULT 'public',enabled INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS feed_items(source_id INTEGER,item_key TEXT,title TEXT,url TEXT,published_at INTEGER,PRIMARY KEY(source_id,item_key));
CREATE TABLE IF NOT EXISTS levels(guild_id TEXT,user_id TEXT,xp INTEGER DEFAULT 0,level INTEGER DEFAULT 0,PRIMARY KEY(guild_id,user_id));
CREATE TABLE IF NOT EXISTS economy(guild_id TEXT,user_id TEXT,balance INTEGER DEFAULT 0,daily_at INTEGER DEFAULT 0,PRIMARY KEY(guild_id,user_id));
CREATE TABLE IF NOT EXISTS warnings(id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT,user_id TEXT,reason TEXT,moderator_id TEXT,created_at INTEGER);
CREATE TABLE IF NOT EXISTS tickets(id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT,channel_id TEXT,user_id TEXT,status TEXT DEFAULT 'open',claimed_by TEXT,created_at INTEGER,closed_at INTEGER);
`);
ensureTables(db);
try{db.prepare('ALTER TABLE feed_sources ADD COLUMN kind TEXT DEFAULT "public"').run()}catch{}
const embed=(title,description='',opts={})=>{const e=new EmbedBuilder().setTitle(title).setDescription(description).setTimestamp().setFooter({text:'Nararya Bot Discord'});if(opts.url)e.setURL(opts.url);if(opts.image)e.setThumbnail(opts.image);return e};
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
client.on('messageCreate',async m=>{if(m.author.bot||!m.guild)return;const a=moderate(m);if(a?.delete)await m.delete().catch(()=>{});if(a?.timeout)await m.member.timeout(a.timeout,'Auto moderation').catch(()=>{});addXp(m)});
client.on('guildMemberAdd',async m=>{const c=db.prepare('SELECT welcome_channel FROM guild_config WHERE guild_id=?').get(m.guild.id),ch=c?.welcome_channel?m.guild.channels.cache.get(c.welcome_channel):null;if(ch?.isTextBased())await ch.send({embeds:[embed('👋 Selamat datang','Selamat datang '+m.user.tag+'!')]})});
client.on('guildMemberRemove',async m=>{const c=db.prepare('SELECT goodbye_channel FROM guild_config WHERE guild_id=?').get(m.guild.id),ch=c?.goodbye_channel?m.guild.channels.cache.get(c.goodbye_channel):null;if(ch?.isTextBased())await ch.send({embeds:[embed('👋 Sampai jumpa','Sampai jumpa '+m.user.tag+'.')]})});
client.on('interactionCreate',async i=>{
 try{
  if(i.isButton()&&i.customId==='ticket-create'){const ch=await openTicket(i);return i.reply({content:'Ticket dibuat: '+ch,ephemeral:true})}
  if(i.isButton()&&i.customId==='ticket-close'){db.prepare("UPDATE tickets SET status='closed',closed_at=? WHERE channel_id=? AND status='open'").run(Date.now(),i.channel.id);await i.reply({embeds:[embed('🔒 Ticket Ditutup','Ticket ditandai closed.')]});return i.channel.permissionOverwrites.edit(i.user.id,{SendMessages:false}).catch(()=>{})}
  if(!i.isChatInputCommand())return;
  const n=i.commandName;
  if(n==='jkt48game'){
   const sub=i.options.getSubcommand(true);
   if(sub==='gacha'){
    const members=JSON.parse(process.env.JKT48_GACHA_MEMBERS_JSON||'[]');
    if(!members.length)return i.reply({content:'Gacha belum dikonfigurasi. Isi JKT48_GACHA_MEMBERS_JSON dengan daftar member.',ephemeral:true});
    const r=rollGacha(members); const key=r.member.key||r.member.name;
    db.prepare('INSERT INTO jkt48_gacha(guild_id,user_id,member_key,rarity,count) VALUES(?,?,?,?,1) ON CONFLICT(guild_id,user_id,member_key,rarity) DO UPDATE SET count=count+1').run(i.guild.id,i.user.id,key,r.rarity);
    return i.reply({embeds:[embed('🎴 Gacha JKT48',r.emoji+' **'+r.rarity.toUpperCase()+'**\\n'+(r.member.name||key))]});
   }
   if(sub==='inventory'){const rows=db.prepare('SELECT member_key,rarity,count FROM jkt48_gacha WHERE guild_id=? AND user_id=? ORDER BY count DESC').all(i.guild.id,i.user.id);return i.reply({embeds:[embed('🎴 Koleksi Gacha',rows.length?rows.map(x=>x.rarity+' • '+x.member_key+' ×'+x.count).join('\\n'):'Belum punya kartu.') ]})}
   if(sub==='leaderboard'){const rows=db.prepare('SELECT user_id,points,wins FROM jkt48_game_scores WHERE guild_id=? ORDER BY points DESC LIMIT 10').all(i.guild.id);return i.reply({embeds:[embed('🏆 JKT48 Game Leaderboard',rows.length?rows.map((x,n)=>'#'+(n+1)+' <@'+x.user_id+'> • '+x.points+' poin • '+x.wins+' menang').join('\\n'):'Belum ada skor.') ]})}
   const mode=i.options.getString('mode',true),assets=getAssets(db,mode);if(!assets.length)return i.reply({content:'Asset game untuk mode **'+MODES[mode]+'** belum tersedia. Admin perlu menambah asset.',ephemeral:true});
   const q=assets[0]; return i.reply({embeds:[embed('🎯 '+MODES[mode],'Tebak jawabannya!\\nBalas pesan ini dengan jawabanmu.').setImage(q.media_url)],ephemeral:false});
  }
  if(n==='ping')return i.reply({embeds:[embed('🏓 Pong',i.client.ws.ping+'ms')]});
  if(n==='ticket'){const row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket-create').setLabel('Buat Ticket').setEmoji('🎫').setStyle(ButtonStyle.Primary));return i.reply({embeds:[embed('🎫 Ticket Center','Gunakan tombol untuk membuka ticket.')],components:[row]})}
  if(n==='feed'){
   const sub=i.options.getSubcommand(false);
   if(sub==='add'){const name=i.options.getString('name',true),url=i.options.getString('url',true),channel=i.options.getChannel('channel',true),kind=i.options.getString('kind',true);new URL(url);db.prepare('INSERT INTO feed_sources(guild_id,name,url,channel_id,kind,enabled) VALUES(?,?,?,?,?,1)').run(i.guild.id,name,url,channel.id,kind);return i.reply({embeds:[embed('✅ Feed ditambahkan',name+' → '+channel)]})}
   if(sub==='remove'){const id=i.options.getInteger('id',true);db.prepare('DELETE FROM feed_sources WHERE id=? AND guild_id=?').run(id,i.guild.id);return i.reply({embeds:[embed('🗑️ Feed dihapus','ID '+id)]})}
   if(sub==='test'){const id=i.options.getInteger('id',true),row=db.prepare('SELECT * FROM feed_sources WHERE id=? AND guild_id=?').get(id,i.guild.id);if(!row)return i.reply({content:'Feed tidak ditemukan.',ephemeral:true});const count=await feedService.pollSource(row);return i.reply({embeds:[embed('🧪 Feed test',row.name+' memproses '+count+' item.')]})}
   const r=db.prepare('SELECT * FROM feed_sources WHERE guild_id=? ORDER BY id').all(i.guild.id);return i.reply({embeds:[embed('📡 Feed Sources',r.length?r.map(x=>'#'+x.id+' • '+x.name+' • '+x.kind+' → <#'+x.channel_id+'>').join('\\n'):'Belum ada feed. Gunakan /feed add')]});
  }
  if(n==='level'){const r=db.prepare('SELECT * FROM levels WHERE guild_id=? AND user_id=?').get(i.guild.id,i.user.id);return i.reply({embeds:[embed('⭐ Level','Level '+(r?.level||0)+' • XP '+(r?.xp||0))]})}
  if(n==='balance'){const b=db.prepare('SELECT balance FROM economy WHERE guild_id=? AND user_id=?').get(i.guild.id,i.user.id)?.balance||0;return i.reply({embeds:[embed('💰 Economy','Saldo: Rp '+b.toLocaleString('id-ID'))]})}
  if(n==='daily'){const now=Date.now(),r=db.prepare('SELECT * FROM economy WHERE guild_id=? AND user_id=?').get(i.guild.id,i.user.id);if(r?.daily_at&&now-r.daily_at<86400000)return i.reply({content:'Daily masih cooldown.',ephemeral:true});db.prepare('INSERT INTO economy(guild_id,user_id,balance,daily_at) VALUES(?,?,1000,?) ON CONFLICT(guild_id,user_id) DO UPDATE SET balance=balance+1000,daily_at=excluded.daily_at').run(i.guild.id,i.user.id,now);return i.reply({embeds:[embed('🎁 Daily','Reward Rp 1.000 diterima.')]})}
  if(n==='serverinfo')return i.reply({embeds:[embed('🏠 Server Info','Nama: '+i.guild.name+'\\nMember: '+i.guild.memberCount)]});
  if(n==='userinfo'){const u=i.options.getUser('user')||i.user;return i.reply({embeds:[embed('👤 User Info','Username: '+u.tag+'\\nID: '+u.id)]})}
  if(n==='warn'){const u=i.options.getUser('user',true),reason=i.options.getString('reason')||'Tidak ada alasan';db.prepare('INSERT INTO warnings(guild_id,user_id,reason,moderator_id,created_at) VALUES(?,?,?,?,?)').run(i.guild.id,u.id,reason,i.user.id,Date.now());return i.reply({embeds:[embed('⚠️ Warning','User <@'+u.id+'> diberi warning. Alasan: '+reason)]})}
  if(n==='ban'){const u=i.options.getUser('user',true),m=await i.guild.members.fetch(u.id).catch(()=>null);if(!m)return i.reply({content:'Member tidak ditemukan.',ephemeral:true});await m.ban({reason:i.options.getString('reason')||'Ban via Nararya Bot Discord'});return i.reply({embeds:[embed('🔨 Ban','User <@'+u.id+'> diban.')]})}
 }catch(e){console.error(e);if(!i.replied&&!i.deferred)await i.reply({content:'Terjadi error: '+e.message,ephemeral:true}).catch(()=>{})}
});
client.once('ready',async()=>{
 console.log('Nararya Bot Discord online as '+client.user.tag);
 for(const g of client.guilds.cache.values()){
  const existing=db.prepare('SELECT COUNT(*) c FROM feed_sources WHERE guild_id=?').get(g.id)?.c||0;
  if(existing===0){const ch=db.prepare('SELECT feed_channel FROM guild_config WHERE guild_id=?').get(g.id)?.feed_channel;if(ch)for(const [name,label,kind,url] of DEFAULT_SOURCES)db.prepare('INSERT INTO feed_sources(guild_id,name,url,channel_id,kind,enabled) VALUES(?,?,?,?,?,1)').run(g.id,label,url,ch,kind)}
 }
 await feedService.poll();
 setInterval(()=>feedService.poll().catch(console.error),Math.max(30,Number(process.env.SCRAPER_INTERVAL_SECONDS||120))*1000);
});
client.login(process.env.DISCORD_TOKEN);
