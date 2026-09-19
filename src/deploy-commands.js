import 'dotenv/config';
import {REST,Routes,SlashCommandBuilder,ChannelType} from 'discord.js';

const feed=new SlashCommandBuilder().setName('feed').setDescription('Kelola notifikasi JKT48')
 .addSubcommand(s=>s.setName('list').setDescription('Lihat semua feed'))
 .addSubcommand(s=>s.setName('add').setDescription('Tambah feed publik')
  .addStringOption(o=>o.setName('name').setDescription('Nama feed').setRequired(true))
  .addStringOption(o=>o.setName('url').setDescription('URL publik sumber').setRequired(true))
  .addChannelOption(o=>o.setName('channel').setDescription('Channel Discord tujuan').addChannelTypes(ChannelType.GuildText).setRequired(true))
  .addStringOption(o=>o.setName('kind').setDescription('Jenis adapter').setRequired(true).addChoices(
   {name:'JKT48 Website',value:'jkt48-web'},{name:'IDN',value:'idn'},{name:'SHOWROOM',value:'showroom'},{name:'YouTube',value:'youtube'},
   {name:'Instagram',value:'instagram'},{name:'TikTok',value:'tiktok'},{name:'X/Twitter',value:'x'},{name:'Threads',value:'threads'},
   {name:'Tokopedia',value:'tokopedia'},{name:'Shopee',value:'shopee'},{name:'Costume YouTube',value:'costume-youtube'},
   {name:'Costume Instagram',value:'costume-instagram'},{name:'Costume TikTok',value:'costume-tiktok'})))
 .addSubcommand(s=>s.setName('remove').setDescription('Hapus feed').addIntegerOption(o=>o.setName('id').setDescription('ID feed').setRequired(true)))
 .addSubcommand(s=>s.setName('test').setDescription('Tes scraper feed').addIntegerOption(o=>o.setName('id').setDescription('ID feed').setRequired(true)));

const jkt48game=new SlashCommandBuilder().setName('jkt48game').setDescription('Game tebak-tebakan dan gacha JKT48')
 .addSubcommand(s=>s.setName('play').setDescription('Mulai game tebak JKT48').addStringOption(o=>o.setName('mode').setDescription('Mode game').setRequired(true).addChoices(
  {name:'Tebak suara lagu',value:'song'},{name:'Tebak suara member JKT48',value:'memberVoice'},{name:'Tebak member foto active',value:'activePhoto'},{name:'Tebak member foto graduation',value:'graduationPhoto'},{name:'Tebak member random',value:'randomMember'},{name:'Tebak foto setlist',value:'setlistPhoto'},{name:'Tebak lagu dari foto',value:'songPhoto'})))
 .addSubcommand(s=>s.setName('gacha').setDescription('Gacha member JKT48'))
 .addSubcommand(s=>s.setName('inventory').setDescription('Lihat koleksi gacha'))
 .addSubcommand(s=>s.setName('leaderboard').setDescription('Lihat leaderboard game'));
const commands=[
 jkt48game,
 new SlashCommandBuilder().setName('ping').setDescription('Cek latency'),
 feed,
 new SlashCommandBuilder().setName('ticket').setDescription('Buka ticket support'),
 new SlashCommandBuilder().setName('level').setDescription('Lihat level'),
 new SlashCommandBuilder().setName('balance').setDescription('Lihat saldo'),
 new SlashCommandBuilder().setName('daily').setDescription('Ambil reward harian'),
 new SlashCommandBuilder().setName('serverinfo').setDescription('Info server'),
 new SlashCommandBuilder().setName('userinfo').setDescription('Info user').addUserOption(o=>o.setName('user').setDescription('Target user')),
 new SlashCommandBuilder().setName('warn').setDescription('Beri warning').setDefaultMemberPermissions('ModerateMembers')
  .addUserOption(o=>o.setName('user').setDescription('Target user').setRequired(true))
  .addStringOption(o=>o.setName('reason').setDescription('Alasan')),
 new SlashCommandBuilder().setName('ban').setDescription('Ban member').setDefaultMemberPermissions('BanMembers')
  .addUserOption(o=>o.setName('user').setDescription('Target user').setRequired(true))
  .addStringOption(o=>o.setName('reason').setDescription('Alasan'))
];
const rest=new REST({version:'10'}).setToken(process.env.DISCORD_TOKEN);
await rest.put(Routes.applicationCommands(process.env.CLIENT_ID),{body:commands.map(x=>x.toJSON())});
console.log('Commands deployed:',commands.length);
