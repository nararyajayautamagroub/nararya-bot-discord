import 'dotenv/config';
import {REST,Routes,SlashCommandBuilder,ChannelType,PermissionFlagsBits} from 'discord.js';

const choiceModes=[
 {name:'Tebak suara lagu',value:'song'},
 {name:'Tebak suara member JKT48',value:'memberVoice'},
 {name:'Tebak member foto active',value:'activePhoto'},
 {name:'Tebak member foto graduation',value:'graduationPhoto'},
 {name:'Tebak member random',value:'randomMember'},
 {name:'Tebak foto setlist',value:'setlistPhoto'},
 {name:'Tebak lagu dari foto',value:'songPhoto'}
];
const rarityChoices=[
 {name:'Common',value:'common'},{name:'Uncommon',value:'uncommon'},{name:'Rare',value:'rare'},
 {name:'Epic',value:'epic'},{name:'Legendary',value:'legendary'},{name:'Mythic',value:'mythic'},{name:'Secret',value:'secret'}
];

const feed=new SlashCommandBuilder().setName('feed').setDescription('Kelola sumber notifikasi publik')
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

const utility=new SlashCommandBuilder().setName('utility').setDescription('Perintah umum bot')
 .addSubcommand(s=>s.setName('ping').setDescription('Cek latency bot'))
 .addSubcommand(s=>s.setName('server').setDescription('Lihat informasi server'))
 .addSubcommand(s=>s.setName('user').setDescription('Lihat informasi user').addUserOption(o=>o.setName('target').setDescription('User target')))
 .addSubcommand(s=>s.setName('level').setDescription('Lihat level dan XP'));

const economy=new SlashCommandBuilder().setName('economy').setDescription('Economy server')
 .addSubcommand(s=>s.setName('balance').setDescription('Lihat saldo'))
 .addSubcommand(s=>s.setName('daily').setDescription('Ambil reward harian'));

const moderation=new SlashCommandBuilder().setName('moderation').setDescription('Moderasi server')
 .addSubcommand(s=>s.setName('warn').setDescription('Berikan warning').setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .addUserOption(o=>o.setName('user').setDescription('Target user').setRequired(true))
  .addStringOption(o=>o.setName('reason').setDescription('Alasan warning')))
 .addSubcommand(s=>s.setName('ban').setDescription('Ban member').setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
  .addUserOption(o=>o.setName('user').setDescription('Target user').setRequired(true))
  .addStringOption(o=>o.setName('reason').setDescription('Alasan ban')));

const support=new SlashCommandBuilder().setName('support').setDescription('Pusat bantuan')
 .addSubcommand(s=>s.setName('ticket').setDescription('Buka ticket support'));

const jkt48game=new SlashCommandBuilder().setName('jkt48game').setDescription('Game kartu dan tebak-tebakan JKT48')
 .addSubcommand(s=>s.setName('play').setDescription('Mulai game tebak JKT48').addStringOption(o=>o.setName('mode').setDescription('Mode game').setRequired(true).addChoices(...choiceModes)))
 .addSubcommand(s=>s.setName('gacha').setDescription('Buka card pack JKT48'))
 .addSubcommand(s=>s.setName('inventory').setDescription('Lihat card collection'))
 .addSubcommand(s=>s.setName('leaderboard').setDescription('Lihat leaderboard game'))
 .addSubcommand(s=>s.setName('asset_add').setDescription('Tambah asset quiz ke database').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild.toString())
  .addStringOption(o=>o.setName('mode').setDescription('Mode quiz').setRequired(true).addChoices(...choiceModes))
  .addStringOption(o=>o.setName('answer').setDescription('Jawaban, gunakan | untuk alias').setRequired(true))
  .addStringOption(o=>o.setName('media_url').setDescription('URL media publik').setRequired(true))
  .addStringOption(o=>o.setName('rarity').setDescription('Rarity challenge').setRequired(true).addChoices(...rarityChoices)))
 .addSubcommand(s=>s.setName('asset_list').setDescription('Lihat jumlah asset per mode').addStringOption(o=>o.setName('mode').setDescription('Mode quiz').addChoices(...choiceModes)));

const sim=new SlashCommandBuilder().setName('sim').setDescription('Tycoon dan simulasi ekonomi')
 .addSubcommand(s=>s.setName('profile').setDescription('Profil kota'))
 .addSubcommand(s=>s.setName('daily').setDescription('Ambil reward harian simulasi'))
 .addSubcommand(s=>s.setName('bank').setDescription('Deposit ke bank').addIntegerOption(o=>o.setName('amount').setDescription('Jumlah').setRequired(true)))
 .addSubcommand(s=>s.setName('fish').setDescription('Memancing'))
 .addSubcommand(s=>s.setName('build').setDescription('Bangun kota'))
 .addSubcommand(s=>s.setName('gacha').setDescription('Gacha member JKT48'));

const jkt48=new SlashCommandBuilder().setName('jkt48').setDescription('Pusat data, jadwal, member dan live JKT48')
 .addSubcommand(s=>s.setName('member').setDescription('Cari profil member').addStringOption(o=>o.setName('query').setDescription('Nama atau nama panggilan').setRequired(true)))
 .addSubcommand(s=>s.setName('members').setDescription('Daftar member berdasarkan generasi').addIntegerOption(o=>o.setName('generation').setDescription('Generasi JKT48 1-14').setMinValue(1).setMaxValue(14)))
 .addSubcommandGroup(g=>g.setName('upcoming').setDescription('Jadwal yang akan datang')
  .addSubcommand(s=>s.setName('event').setDescription('Upcoming event'))
  .addSubcommand(s=>s.setName('theater').setDescription('Upcoming theater'))
  .addSubcommand(s=>s.setName('setlist').setDescription('Upcoming setlist'))
  .addSubcommand(s=>s.setName('songs').setDescription('Upcoming songs'))
  .addSubcommand(s=>s.setName('live').setDescription('Live yang sedang aktif'))
  .addSubcommand(s=>s.setName('birthday').setDescription('Upcoming birthday'))
  .addSubcommand(s=>s.setName('graduation').setDescription('Upcoming graduation')))
 .addSubcommandGroup(g=>g.setName('latest').setDescription('Data terbaru')
  .addSubcommand(s=>s.setName('event').setDescription('Latest event'))
  .addSubcommand(s=>s.setName('theater').setDescription('Latest theater'))
  .addSubcommand(s=>s.setName('setlist').setDescription('Latest setlist'))
  .addSubcommand(s=>s.setName('songs').setDescription('Latest songs'))
  .addSubcommand(s=>s.setName('live').setDescription('Latest live'))
  .addSubcommand(s=>s.setName('birthday').setDescription('Latest birthday'))
  .addSubcommand(s=>s.setName('graduation').setDescription('Latest graduation'))
  .addSubcommand(s=>s.setName('live_showroom').setDescription('Latest live SHOWROOM'))
  .addSubcommand(s=>s.setName('live_idn').setDescription('Latest live IDN')));

const commands=[jkt48,jkt48game,sim,utility,economy,moderation,support,feed];

const rest=new REST({version:'10'}).setToken(process.env.DISCORD_TOKEN);
await rest.put(Routes.applicationCommands(process.env.CLIENT_ID),{body:commands.map(x=>x.toJSON())});
console.log('Commands deployed:',commands.length);
