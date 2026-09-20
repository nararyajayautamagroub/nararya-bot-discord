import 'dotenv/config';
import Database from 'better-sqlite3';
import {Client,GatewayIntentBits,ChannelType,PermissionFlagsBits,EmbedBuilder,ActionRowBuilder,ButtonBuilder,ButtonStyle,SlashCommandBuilder,REST,Routes} from 'discord.js';

const token=process.env.TICKET_BOT_TOKEN;
if(!token)throw new Error('TICKET_BOT_TOKEN belum diatur');
const db=new Database(process.env.TICKET_DATABASE_PATH||'./data/ticket-bot.db');
db.pragma('journal_mode=WAL');
db.exec("CREATE TABLE IF NOT EXISTS ticket_config(guild_id TEXT PRIMARY KEY,category_id TEXT,staff_role_id TEXT,log_channel_id TEXT,enabled INTEGER NOT NULL DEFAULT 1);CREATE TABLE IF NOT EXISTS tickets(id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT NOT NULL,channel_id TEXT UNIQUE NOT NULL,user_id TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'open',claimed_by TEXT,created_at INTEGER NOT NULL,closed_at INTEGER);");

const RED=0xD71920;
const embed=(title,description='',fields=[])=>new EmbedBuilder().setColor(RED).setTitle(title).setDescription(description).addFields(fields).setTimestamp().setFooter({text:'PT. NARARYA JAYA UTAMA GROUB - All Right Reserved'});
const safe=v=>String(v||'').replace(/[^a-z0-9-]/gi,'').slice(0,50)||'user';

async function deploy(){
 const commands=[
  new SlashCommandBuilder().setName('ticket').setDescription('Ticket support terpisah')
   .addSubcommand(s=>s.setName('panel').setDescription('Kirim panel ticket').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild))
   .addSubcommand(s=>s.setName('setup').setDescription('Konfigurasi ticket').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).addChannelOption(o=>o.setName('category').setDescription('Kategori ticket').addChannelTypes(ChannelType.GuildCategory).setRequired(true)).addRoleOption(o=>o.setName('staff_role').setDescription('Role staff').setRequired(true)).addChannelOption(o=>o.setName('log_channel').setDescription('Channel log').addChannelTypes(ChannelType.GuildText)))
   .addSubcommand(s=>s.setName('open').setDescription('Buka ticket'))
   .addSubcommand(s=>s.setName('close').setDescription('Tutup ticket'))
   .addSubcommand(s=>s.setName('claim').setDescription('Claim ticket'))
   .addSubcommand(s=>s.setName('add').setDescription('Tambahkan user').addUserOption(o=>o.setName('user').setDescription('User').setRequired(true)))
   .addSubcommand(s=>s.setName('remove').setDescription('Hapus user').addUserOption(o=>o.setName('user').setDescription('User').setRequired(true))),
  new SlashCommandBuilder().setName('ticketbot').setDescription('Status Ticket Bot')
   .addSubcommand(s=>s.setName('status').setDescription('Status bot'))
 ].map(x=>x.toJSON());
 const rest=new REST({version:'10'}).setToken(token);
 const app=process.env.TICKET_BOT_CLIENT_ID;
 if(!app)throw new Error('TICKET_BOT_CLIENT_ID belum diatur');
 if(process.env.TICKET_BOT_GUILD_ID)await rest.put(Routes.applicationGuildCommands(app,process.env.TICKET_BOT_GUILD_ID),{body:commands});
 else await rest.put(Routes.applicationCommands(app),{body:commands});
}

async function createTicket(i){
 const cfg=db.prepare('SELECT * FROM ticket_config WHERE guild_id=? AND enabled=1').get(i.guild.id);
 if(!cfg)return i.reply({embeds:[embed('⚙️ Ticket Belum Diatur','Admin perlu menjalankan /ticket setup terlebih dahulu.')],ephemeral:true});
 const existing=db.prepare("SELECT * FROM tickets WHERE guild_id=? AND user_id=? AND status='open'").get(i.guild.id,i.user.id);
 if(existing){
  const ch=await i.guild.channels.fetch(existing.channel_id).catch(()=>null);
  return i.reply({embeds:[embed('🎫 Ticket Sudah Ada','Ticket aktif: '+(ch?ch.toString():'channel tidak ditemukan'))],ephemeral:true});
 }
 const overwrites=[
  {id:i.guild.roles.everyone.id,deny:[PermissionFlagsBits.ViewChannel]},
  {id:i.user.id,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory]},
  {id:cfg.staff_role_id,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory]}
 ];
 const channel=await i.guild.channels.create({name:'ticket-'+safe(i.user.username).toLowerCase(),type:ChannelType.GuildText,parent:cfg.category_id,permissionOverwrites:overwrites,reason:'Nararya Ticket Bot'});
 const row=db.prepare('INSERT INTO tickets(guild_id,channel_id,user_id,created_at) VALUES(?,?,?,?)').run(i.guild.id,channel.id,i.user.id,Date.now());
 const buttons=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticketbot-close').setLabel('Tutup Ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger));
 await channel.send({content:'<@'+i.user.id+'>',embeds:[embed('🎫 Ticket #'+row.lastInsertRowid,'Jelaskan kebutuhanmu. Staff akan membantu.')],components:[buttons]});
 return i.reply({embeds:[embed('✅ Ticket Dibuat','Ticket kamu: '+channel)],ephemeral:true});
}

async function closeTicket(i){
 const ticket=db.prepare("SELECT * FROM tickets WHERE channel_id=? AND status='open'").get(i.channel.id);
 if(!ticket)return i.reply({embeds:[embed('ℹ️ Bukan Ticket','Channel ini bukan ticket aktif.')],ephemeral:true});
 const cfg=db.prepare('SELECT * FROM ticket_config WHERE guild_id=?').get(i.guild.id);
 const staff=cfg?.staff_role_id&&i.member.roles.cache.has(cfg.staff_role_id);
 if(i.user.id!==ticket.user_id&&!staff&&!i.member.permissions.has(PermissionFlagsBits.ManageChannels))return i.reply({embeds:[embed('🔒 Tidak Diizinkan','Hanya pembuat ticket atau staff yang dapat menutup ticket.')],ephemeral:true});
 db.prepare("UPDATE tickets SET status='closed',closed_at=? WHERE id=?").run(Date.now(),ticket.id);
 await i.reply({embeds:[embed('🔒 Ticket Ditutup','Ticket dikunci.') ]});
 await i.channel.permissionOverwrites.edit(ticket.user_id,{SendMessages:false}).catch(()=>{});
 if(cfg?.log_channel_id){const log=await i.guild.channels.fetch(cfg.log_channel_id).catch(()=>null);if(log?.isTextBased())await log.send({embeds:[embed('🔒 Ticket Closed','Ticket #'+ticket.id+' ditutup oleh <@'+i.user.id+'>.')]});}
}

const client=new Client({intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMembers]});
client.once('ready',async()=>{console.log('Nararya Ticket Bot online as '+client.user.tag);await deploy().catch(e=>console.error('[ticket deploy]',e.message));});
client.on('interactionCreate',async i=>{
 try{
  if(i.isButton()&&i.customId==='ticketbot-close')return closeTicket(i);
  if(!i.isChatInputCommand())return;
  if(i.commandName==='ticketbot')return i.reply({embeds:[embed('🎫 Ticket Bot Status','Bot ticket berjalan terpisah. Database: **OK**\\nGuild: **'+client.guilds.cache.size+'**')]});
  if(i.commandName!=='ticket')return;
  const sub=i.options.getSubcommand();
  if(sub==='setup'){
   const category=i.options.getChannel('category',true),staff=i.options.getRole('staff_role',true),log=i.options.getChannel('log_channel');
   db.prepare('INSERT INTO ticket_config(guild_id,category_id,staff_role_id,log_channel_id,enabled) VALUES(?,?,?,?,1) ON CONFLICT(guild_id) DO UPDATE SET category_id=excluded.category_id,staff_role_id=excluded.staff_role_id,log_channel_id=excluded.log_channel_id,enabled=1').run(i.guild.id,category.id,staff.id,log?.id||null);
   return i.reply({embeds:[embed('✅ Ticket Config Disimpan','Category: '+category+'\\nStaff: '+staff+(log?'\\nLog: '+log:'') )]});
  }
  if(sub==='panel'){
   const row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticketbot-open').setLabel('Buat Ticket').setEmoji('🎫').setStyle(ButtonStyle.Danger));
   return i.reply({embeds:[embed('🎫 Ticket Center','Gunakan tombol di bawah untuk membuat ticket.')],components:[row]});
  }
  if(sub==='open')return createTicket(i);
  if(sub==='close')return closeTicket(i);
  const ticket=db.prepare("SELECT * FROM tickets WHERE channel_id=? AND status='open'").get(i.channel.id);
  if(!ticket)return i.reply({embeds:[embed('ℹ️ Bukan Ticket','Command ini hanya berlaku di ticket aktif.')],ephemeral:true});
  const cfg=db.prepare('SELECT * FROM ticket_config WHERE guild_id=?').get(i.guild.id);
  if(!cfg?.staff_role_id||!i.member.roles.cache.has(cfg.staff_role_id))return i.reply({embeds:[embed('🔒 Staff Only','Role staff ticket diperlukan.')],ephemeral:true});
  const user=i.options.getUser('user');
  if(sub==='claim'){db.prepare('UPDATE tickets SET claimed_by=? WHERE id=?').run(i.user.id,ticket.id);return i.reply({embeds:[embed('🙋 Ticket Di-claim','Ticket #'+ticket.id+' diambil oleh <@'+i.user.id+'>.') ]});}
  if(sub==='add'){await i.channel.permissionOverwrites.edit(user.id,{ViewChannel:true,SendMessages:true,ReadMessageHistory:true});return i.reply({embeds:[embed('➕ User Ditambahkan','User <@'+user.id+'> ditambahkan.') ]});}
  if(sub==='remove'){await i.channel.permissionOverwrites.edit(user.id,{ViewChannel:false});return i.reply({embeds:[embed('➖ User Dihapus','User <@'+user.id+'> dihapus.') ]});}
 }catch(error){console.error('[ticket]',error);if(!i.replied&&!i.deferred)await i.reply({embeds:[embed('❌ Ticket Error',error.message)],ephemeral:true}).catch(()=>{});}
});
client.login(token);
