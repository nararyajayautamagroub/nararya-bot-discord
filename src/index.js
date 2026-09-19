import 'dotenv/config';
import Database from 'better-sqlite3';
import * as cheerio from 'cheerio';
import crypto from 'node:crypto';
import {fetch} from 'undici';
import {Client,GatewayIntentBits,Partials,EmbedBuilder,ActionRowBuilder,ButtonBuilder,ButtonStyle,ChannelType,PermissionFlagsBits,SlashCommandBuilder,REST,Routes} from 'discord.js';

const db=new Database(process.env.DATABASE_PATH||'./data/nararya.db');
db.pragma('journal_mode=WAL');
db.exec(`CREATE TABLE IF NOT EXISTS guild_config(guild_id TEXT PRIMARY KEY,welcome_channel TEXT,goodbye_channel TEXT,log_channel TEXT,ticket_category TEXT,ticket_staff_role TEXT,feed_channel TEXT);
CREATE TABLE IF NOT EXISTS feed_sources(id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT,name TEXT,url TEXT,channel_id TEXT,enabled INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS feed_items(source_id INTEGER,item_key TEXT,title TEXT,url TEXT,published_at INTEGER,PRIMARY KEY(source_id,item_key));
CREATE TABLE IF NOT EXISTS levels(guild_id TEXT,user_id TEXT,xp INTEGER DEFAULT 0,level INTEGER DEFAULT 0,PRIMARY KEY(guild_id,user_id));
CREATE TABLE IF NOT EXISTS economy(guild_id TEXT,user_id TEXT,balance INTEGER DEFAULT 0,PRIMARY KEY(guild_id,user_id));
CREATE TABLE IF NOT EXISTS warnings(id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT,user_id TEXT,reason TEXT,moderator_id TEXT,created_at INTEGER);
CREATE TABLE IF NOT EXISTS tickets(id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT,channel_id TEXT,user_id TEXT,status TEXT DEFAULT 'open',claimed_by TEXT,created_at INTEGER,closed_at INTEGER)`);

const sources=[
['jkt48-web','JKT48 Website','https://jkt48.com/'],['jkt48-events','JKT48 Event','https://jkt48.com/events'],['jkt48-news','JKT48 News','https://jkt48.com/news'],['jkt48-theater','JKT48 Theater','https://jkt48.com/theater'],
['idn','IDN','https://www.idn.app/'],['showroom','SHOWROOM','https://www.showroom-live.com/'],['tokopedia','Tokopedia JKT48','https://www.tokopedia.com/'],['shopee','Shopee JKT48','https://shopee.co.id/'],
['youtube-jkt48','YouTube JKT48','https://www.youtube.com/@JKT48'],['youtube-jkt48tv','YouTube JKT48 TV','https://www.youtube.com/'],
['instagram-jkt48','Instagram JKT48','https://www.instagram.com/jkt48/'],['instagram-member','Instagram Member','https://www.instagram.com/'],
['tiktok-jkt48','TikTok JKT48','https://www.tiktok.com/@jkt48'],['tiktok-member','TikTok Member','https://www.tiktok.com/'],
['x-jkt48','X/Twitter JKT48','https://x.com/officialJKT48'],['x-member','X/Twitter Member','https://x.com/'],
['threads-jkt48','Threads JKT48','https://www.threads.net/'],['threads-member','Threads Member','https://www.threads.net/'],
['costume-youtube','Costume YouTube','https://www.youtube.com/'],['costume-instagram','Costume Instagram','https://www.instagram.com/'],['costume-tiktok','Costume TikTok','https://www.tiktok.com/']
];

const embed=(title,description='')=>new EmbedBuilder().setTitle(title).setDescription(description).setTimestamp().setFooter({text:'Nararya Bot Discord'});
const feedEmbed=x=>new EmbedBuilder().setTitle(x.title).setURL(x.url).setDescription((x.description||'Update baru terdeteksi.').slice(0,4000)).setTimestamp().setFooter({text:'Nararya Bot Discord • JKT48 Feed'});
const client=new Client({intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMembers,GatewayIntentBits.GuildMessages,GatewayIntentBits.MessageContent,GatewayIntentBits.GuildVoiceStates,GatewayIntentBits.GuildModeration],partials:[Partials.Channel,Partials.Message]});

const commandData=[
new SlashCommandBuilder().setName('ping').setDescription('Cek latency'),
new SlashCommandBuilder().setName('ticket').setDescription('Buka ticket support'),
new SlashCommandBuilder().setName('feed').setDescription('Lihat sumber feed'),
new SlashCommandBuilder().setName('level').setDescription('Lihat level'),
new SlashCommandBuilder().setName('balance').setDescription('Lihat saldo'),
new SlashCommandBuilder().setName('daily').setDescription('Ambil reward harian'),
new SlashCommandBuilder().setName('serverinfo').setDescription('Info server'),
new SlashCommandBuilder().setName('userinfo').setDescription('Info user'),
new SlashCommandBuilder().setName('warn').setDescription('Beri warning').setDefaultMemberPermissions('ModerateMembers'),
new SlashCommandBuilder().setName('ban').setDescription('Ban member').setDefaultMemberPermissions('BanMembers')
];

const recent=new Map();
async function moderate(m){
 const key=m.guild.id+':'+m.author.id,now=Date.now(),arr=(recent.get(key)||[]).filter(t=>now-t<8000);arr.push(now);recent.set(key,arr);
 if(arr.length>=6)return{delete:true,timeout:60000};
 if(/discord(?:app)?\\.com\\/invite\\//i.test(m.content))return{delete:true};
 if(/https?:\\/\\//i.test(m.content)&&!m.member.permissions.has(PermissionFlagsBits.ManageMessages))return{delete:true};
 return null;
}
async function level(m){
 const r=db.prepare('SELECT * FROM levels WHERE guild_id=? AND user_id=?').get(m.guild.id,m.author.id);
 const xp=(r?.xp||0)+5+Math.floor(Math.random()*8),lv=Math.floor(Math.sqrt(xp/100));
 if(r)db.prepare('UPDATE levels SET xp=?,level=? WHERE guild_id=? AND user_id=?').run(xp,lv,m.guild.id,m.author.id);
 else db.prepare('INSERT INTO levels(guild_id,user_id,xp,level) VALUES(?,?,?,?)').run(m.guild.id,m.author.id,xp,lv);
}
async function scrape(source){
 const res=await fetch(source[2],{headers:{'user-agent':process.env.SCRAPER_USER_AGENT||'NararyaBotDiscord/1.0',accept:'text/html,application/xhtml+xml'},signal:AbortSignal.timeout(15000)});
 if(!res.ok)throw new Error('HTTP '+res.status);
 const $=cheerio.load(await res.text()),out=[];
 $('a[href]').each((_,el)=>{const title=$(el).text().replace(/\\s+/g,' ').trim(),href=$(el).attr('href');if(!title||!href||title.length<5)return;const url=new URL(href,source[2]).href;if(out.some(x=>x.url===url))return;out.push({key:crypto.createHash('sha256').update(url).digest('hex'),title,url,description:title})});
 return out.slice(0,30);
}
async function feeds(){
 for(const s of sources){try{const items=await scrape(s);const rows=db.prepare('SELECT * FROM feed_sources WHERE enabled=1').all();for(const row of rows){if(!s[2].includes(new URL(row.url).hostname))continue;for(const item of items){if(db.prepare('SELECT 1 FROM feed_items WHERE source_id=? AND item_key=?').get(row.id,item.key))continue;db.prepare('INSERT INTO feed_items VALUES(?,?,?,?,?)').run(row.id,item.key,item.title,item.url,Date.now());const ch=await client.channels.fetch(row.channel_id).catch(()=>null);if(ch?.isTextBased())await ch.send({embeds:[feedEmbed(item)]})}}}catch(e){console.warn('feed failed',s[0],e.message)}}
}
async function ticket(i){
 const cfg=db.prepare('SELECT * FROM guild_config WHERE guild_id=?').get(i.guild.id);
 const ch=await i.guild.channels.create({name:'ticket-'+i.user.username.toLowerCase().replace(/[^a-z0-9-]/g,'').slice(0,60),type:ChannelType.GuildText,parent:cfg?.ticket_category||undefined,permissionOverwrites:[{id:i.guild.roles.everyone.id,deny:[PermissionFlagsBits.ViewChannel]},{id:i.user.id,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory]}]});
 db.prepare('INSERT INTO tickets(guild_id,channel_id,user_id,created_at) VALUES(?,?,?,?)').run(i.guild.id,ch.id,i.user.id,Date.now());
 const row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket-close').setLabel('Tutup Ticket').setStyle(ButtonStyle.Danger));
 await ch.send({embeds:[embed('🎫 Ticket Dibuat','Jelaskan kebutuhanmu dengan detail. Staff akan membantu.')],components:[row]});
 return ch;
}

client.on('messageCreate',async m=>{if(m.author.bot||!m.guild)return;const a=await moderate(m);if(a?.delete)await m.delete().catch(()=>{});if(a?.timeout)await m.member.timeout(a.timeout,'Auto moderation').catch(()=>{});await level(m)});
client.on('guildMemberAdd',async m=>{const c=db.prepare('SELECT welcome_channel FROM guild_config WHERE guild_id=?').get(m.guild.id),ch=c?.welcome_channel?m.guild.channels.cache.get(c.welcome_channel):null;if(ch?.isTextBased())await ch.send({embeds:[embed('👋 Member Baru','Selamat datang '+m.user.tag+'!')]})});
client.on('guildMemberRemove',async m=>{const c=db.prepare('SELECT goodbye_channel FROM guild_config WHERE guild_id=?').get(m.guild.id),ch=c?.goodbye_channel?m.guild.channels.cache.get(c.goodbye_channel):null;if(ch?.isTextBased())await ch.send({embeds:[embed('👋 Member Keluar','Sampai jumpa '+m.user.tag+'.')]})});
client.on('interactionCreate',async i=>{
 if(i.isButton()&&i.customId==='ticket-create'){const ch=await ticket(i);return i.reply({content:'Ticket dibuat: '+ch,ephemeral:true})}
 if(i.isButton()&&i.customId==='ticket-close'){db.prepare("UPDATE tickets SET status='closed',closed_at=? WHERE channel_id=?").run(Date.now(),i.channel.id);await i.reply({embeds:[embed('🔒 Ticket Ditutup','Ticket ditandai closed.')]});return i.channel.permissionOverwrites.edit(i.user.id,{SendMessages:false}).catch(()=>{})}
 if(!i.isChatInputCommand())return; const n=i.commandName;
 if(n==='ping')return i.reply({embeds:[embed('🏓 Pong',String(i.client.ws.ping)+'ms')]});
 if(n==='ticket'){const row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket-create').setLabel('Buat Ticket').setEmoji('🎫').setStyle(ButtonStyle.Primary));return i.reply({embeds:[embed('🎫 Ticket Center','Gunakan tombol untuk membuka ticket.')],components:[row]})}
 if(n==='feed'){const r=db.prepare('SELECT * FROM feed_sources').all();return i.reply({embeds:[embed('📡 Feed Sources',r.length?r.map(x=>'• '+x.name+' → <#'+x.channel_id+'>').join('\\n'):'Belum dikonfigurasi')]})}
 if(n==='level'){const r=db.prepare('SELECT * FROM levels WHERE guild_id=? AND user_id=?').get(i.guild.id,i.user.id);return i.reply({embeds:[embed('⭐ Level','Level '+(r?.level||0)+' • XP '+(r?.xp||0))]})}
 if(n==='balance'){const b=db.prepare('SELECT balance FROM economy WHERE guild_id=? AND user_id=?').get(i.guild.id,i.user.id)?.balance||0;return i.reply({embeds:[embed('💰 Economy','Saldo: Rp '+b.toLocaleString('id-ID'))]})}
 if(n==='daily'){db.prepare('INSERT INTO economy(guild_id,user_id,balance) VALUES(?,?,1000) ON CONFLICT(guild_id,user_id) DO UPDATE SET balance=balance+1000').run(i.guild.id,i.user.id);return i.reply({embeds:[embed('🎁 Daily','Reward Rp 1.000 diterima.')]})}
 if(n==='serverinfo')return i.reply({embeds:[embed('🏠 Server Info','Nama: '+i.guild.name+'\\nMember: '+i.guild.memberCount)]});
 if(n==='userinfo')return i.reply({embeds:[embed('👤 User Info','Username: '+i.user.tag+'\\nID: '+i.user.id)]});
 if(n==='warn'){const u=i.options.getUser('user')||i.user,reason=i.options.getString('reason')||'Tidak ada alasan';db.prepare('INSERT INTO warnings(guild_id,user_id,reason,moderator_id,created_at) VALUES(?,?,?,?,?)').run(i.guild.id,u.id,reason,i.user.id,Date.now());return i.reply({embeds:[embed('⚠️ Warning','User <@'+u.id+'> diberi warning. Alasan: '+reason)]})}
 if(n==='ban'){const u=i.options.getUser('user')||i.user,m=await i.guild.members.fetch(u.id).catch(()=>null);if(m)await m.ban({reason:'Ban via Nararya Bot Discord'});return i.reply({embeds:[embed('🔨 Ban','User <@'+u.id+'> diban.')]})}
});
client.once('ready',()=>{console.log('Nararya Bot Discord online as '+client.user.tag);feeds();setInterval(feeds,Math.max(30,Number(process.env.SCRAPER_INTERVAL_SECONDS||120))*1000)});
client.login(process.env.DISCORD_TOKEN);
