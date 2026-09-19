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

const sim=new SlashCommandBuilder().setName('sim').setDescription('Tycoon & simulasi ekonomi').addSubcommand(s=>s.setName('profile').setDescription('Profil kota')).addSubcommand(s=>s.setName('daily').setDescription('Daily reward')).addSubcommand(s=>s.setName('bank').setDescription('Deposit ke bank').addIntegerOption(o=>o.setName('amount').setDescription('Jumlah').setRequired(true))).addSubcommand(s=>s.setName('fish').setDescription('Memancing')).addSubcommand(s=>s.setName('build').setDescription('Bangun kota')).addSubcommand(s=>s.setName('gacha').setDescription('Gacha member JKT48'));
const jkt48=new SlashCommandBuilder().setName('jkt48').setDescription('Jadwal, event, theater, birthday dan live JKT48')
 .addSubcommandGroup(g=>g.setName('upcoming').setDescription('Cek yang akan datang')
  .addSubcommand(s=>s.setName('event').setDescription('Upcoming event'))
  .addSubcommand(s=>s.setName('theater').setDescription('Upcoming theater'))
  .addSubcommand(s=>s.setName('setlist').setDescription('Upcoming setlist'))
  .addSubcommand(s=>s.setName('songs').setDescription('Upcoming songs'))
  .addSubcommand(s=>s.setName('live').setDescription('Live yang sedang aktif'))
  .addSubcommand(s=>s.setName('birthday').setDescription('Upcoming birthday'))
  .addSubcommand(s=>s.setName('graduation').setDescription('Upcoming graduation')))
 .addSubcommandGroup(g=>g.setName('latest').setDescription('Cek data terbaru/terakhir')
  .addSubcommand(s=>s.setName('event').setDescription('Latest event'))
  .addSubcommand(s=>s.setName('theater').setDescription('Latest theater'))
  .addSubcommand(s=>s.setName('setlist').setDescription('Latest setlist'))
  .addSubcommand(s=>s.setName('songs').setDescription('Latest songs'))
  .addSubcommand(s=>s.setName('live').setDescription('Latest live'))
  .addSubcommand(s=>s.setName('birthday').setDescription('Latest birthday'))
  .addSubcommand(s=>s.setName('graduation').setDescription('Latest graduation'))
  .addSubcommand(s=>s.setName('live_showroom').setDescription('Latest live SHOWROOM'))
  .addSubcommand(s=>s.setName('live_idn').setDescription('Latest live IDN')));

const member=new SlashCommandBuilder().setName('member').setDescription('Cari profil member JKT48').addStringOption(o=>o.setName('query').setDescription('Nama atau nama panggilan member').setRequired(true));

const members=new SlashCommandBuilder().setName('members').setDescription('Daftar member JKT48 berdasarkan generasi').addIntegerOption(o=>o.setName('generation').setDescription('Generasi JKT48 1-14').setMinValue(1).setMaxValue(14));

const commands=[
 members,
 member,
 jkt48,
 sim,
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
