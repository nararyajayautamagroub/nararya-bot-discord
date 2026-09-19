import 'dotenv/config';
import {REST,Routes,SlashCommandBuilder,ChannelType,PermissionFlagsBits} from 'discord.js';

const choiceModes=[
 {name:'Tebak suara lagu',value:'song'},
 {name:'Tebak suara member JKT48',value:'memberVoice'},
 {name:'Tebak member foto active',value:'activePhoto'},
 {name:'Tebak member foto graduation',value:'graduationPhoto'},
 {name:'Tebak member random',value:'randomMember'},
 {name:'Tebak foto setlist',value:'setlistPhoto'},
 {name:'Tebak lagu dari foto',value:'songPhoto'},
 {name:'Tebak lokasi Google Street View',value:'streetView'}
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


const media=new SlashCommandBuilder().setName('media').setDescription('Download dan transformasi media')
 .addSubcommand(s=>s.setName('video').setDescription('Download video dari URL publik')
  .addStringOption(o=>o.setName('url').setDescription('URL publik').setRequired(true))
  .addStringOption(o=>o.setName('resolution').setDescription('Resolusi maksimum').addChoices(
   {name:'Best available',value:'best'},{name:'2160p',value:'2160p'},{name:'1440p',value:'1440p'},{name:'1080p',value:'1080p'},
   {name:'720p',value:'720p'},{name:'480p',value:'480p'},{name:'360p',value:'360p'}))
  .addStringOption(o=>o.setName('format').setDescription('Format video').addChoices(
   {name:'MP4',value:'mp4'},{name:'WebM',value:'webm'},{name:'MKV',value:'mkv'})))
 .addSubcommand(s=>s.setName('audio').setDescription('Download lagu atau audio dari URL publik')
  .addStringOption(o=>o.setName('url').setDescription('URL publik').setRequired(true))
  .addStringOption(o=>o.setName('format').setDescription('Format audio').addChoices(
   {name:'MP3',value:'mp3'},{name:'M4A',value:'m4a'},{name:'WAV',value:'wav'},{name:'FLAC',value:'flac'})))
 .addSubcommand(s=>s.setName('image').setDescription('Download foto dari URL publik')
  .addStringOption(o=>o.setName('url').setDescription('URL publik').setRequired(true)))
 .addSubcommand(s=>s.setName('vocals').setDescription('Pisahkan vokal dan hasilkan instrumental')
  .addStringOption(o=>o.setName('url').setDescription('URL publik sumber audio/video'))
  .addAttachmentOption(o=>o.setName('file').setDescription('Upload audio/video'))
  .addStringOption(o=>o.setName('format').setDescription('Format instrumental').addChoices(
   {name:'MP3',value:'mp3'},{name:'M4A',value:'m4a'},{name:'WAV',value:'wav'},{name:'FLAC',value:'flac'})))
 .addSubcommand(s=>s.setName('background').setDescription('Hapus background foto atau video')
  .addStringOption(o=>o.setName('type').setDescription('Jenis media').setRequired(true).addChoices(
   {name:'Photo',value:'image'},{name:'Video',value:'video'}))
  .addStringOption(o=>o.setName('url').setDescription('URL publik sumber'))
  .addAttachmentOption(o=>o.setName('file').setDescription('Upload foto/video')))
 .addSubcommand(s=>s.setName('watermark').setDescription('Hapus watermark pada area yang ditentukan')
  .addStringOption(o=>o.setName('type').setDescription('Jenis media').setRequired(true).addChoices(
   {name:'Photo',value:'image'},{name:'Video',value:'video'}))
  .addStringOption(o=>o.setName('url').setDescription('URL publik sumber'))
  .addAttachmentOption(o=>o.setName('file').setDescription('Upload foto/video'))
  .addIntegerOption(o=>o.setName('x').setDescription('Koordinat X').setRequired(true).setMinValue(0))
  .addIntegerOption(o=>o.setName('y').setDescription('Koordinat Y').setRequired(true).setMinValue(0))
  .addIntegerOption(o=>o.setName('width').setDescription('Lebar watermark').setRequired(true).setMinValue(1))
  .addIntegerOption(o=>o.setName('height').setDescription('Tinggi watermark').setRequired(true).setMinValue(1)))
 .addSubcommand(s=>s.setName('settings').setDescription('Atur default resolusi dan format')
  .addStringOption(o=>o.setName('resolution').setDescription('Default resolusi video').addChoices(
   {name:'Best available',value:'best'},{name:'2160p',value:'2160p'},{name:'1440p',value:'1440p'},{name:'1080p',value:'1080p'},
   {name:'720p',value:'720p'},{name:'480p',value:'480p'},{name:'360p',value:'360p'}))
  .addStringOption(o=>o.setName('video_format').setDescription('Default video format').addChoices(
   {name:'MP4',value:'mp4'},{name:'WebM',value:'webm'},{name:'MKV',value:'mkv'}))
  .addStringOption(o=>o.setName('audio_format').setDescription('Default audio format').addChoices(
   {name:'MP3',value:'mp3'},{name:'M4A',value:'m4a'},{name:'WAV',value:'wav'},{name:'FLAC',value:'flac'})))


const verify=new SlashCommandBuilder().setName('verify').setDescription('Sistem verifikasi akun Discord melalui website')
 .addSubcommand(s=>s.setName('start').setDescription('Buat sesi verifikasi dan dapatkan URL website'))
 .addSubcommand(s=>s.setName('code').setDescription('Masukkan kode 4 karakter dari website').addStringOption(o=>o.setName('code').setDescription('Kode verifikasi').setRequired(true).setMinLength(4).setMaxLength(4)))
 .addSubcommand(s=>s.setName('status').setDescription('Lihat status konfigurasi verifikasi'))
 .addSubcommand(s=>s.setName('role').setDescription('Atur role yang diberikan setelah verifikasi').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).addRoleOption(o=>o.setName('role').setDescription('Role verified').setRequired(true)));

const bot=new SlashCommandBuilder().setName('bot').setDescription('Informasi dan developer tools bot')
 .addSubcommand(s=>s.setName('info').setDescription('Lihat runtime dan informasi bot'))
 .addSubcommand(s=>s.setName('features').setDescription('Lihat registry fitur aktif'))
 .addSubcommand(s=>s.setName('health').setDescription('Lihat status kesehatan sistem'));


const news=new SlashCommandBuilder().setName('news').setDescription('Berita Indonesia terbaru dari RSS publik')
 .addSubcommand(s=>s.setName('latest').setDescription('Berita terbaru Indonesia').addStringOption(o=>o.setName('category').setDescription('Kategori berita').addChoices(
  {name:'Terkini',value:'latest'},{name:'Top News',value:'top'},{name:'Ekonomi',value:'economy'},{name:'Finansial',value:'finance'},
  {name:'Bisnis',value:'business'},{name:'Bursa',value:'market'},{name:'Politik',value:'politics'},{name:'Hukum',value:'law'})))
 .addSubcommand(s=>s.setName('sources').setDescription('Lihat sumber RSS berita yang digunakan'));

const market=new SlashCommandBuilder().setName('market').setDescription('Data pasar saham Indonesia')
 .addSubcommand(s=>s.setName('stock').setDescription('Lihat harga saham Indonesia').addStringOption(o=>o.setName('symbol').setDescription('Ticker, misalnya BBCA atau TLKM').setRequired(true)))
 .addSubcommand(s=>s.setName('ihsg').setDescription('Lihat data IHSG'));

const prices=new SlashCommandBuilder().setName('prices').setDescription('Harga energi dan pangan Indonesia')
 .addSubcommand(s=>s.setName('fuel').setDescription('Harga BBM Pertamina'))
 .addSubcommand(s=>s.setName('electricity').setDescription('Tarif listrik PLN'))
 .addSubcommand(s=>s.setName('food').setDescription('Harga pangan strategis'))
 .addSubcommand(s=>s.setName('all').setDescription('Ringkasan semua harga'));

const ramadan=new SlashCommandBuilder().setName('ramadan').setDescription('Ramadan, jadwal imsakiyah dan notifikasi sahur/buka')
 .addSubcommand(s=>s.setName('upcoming').setDescription('Lihat perkiraan Ramadan dan tanggal penting'))
 .addSubcommand(s=>s.setName('today').setDescription('Lihat jadwal imsakiyah hari ini').addStringOption(o=>o.setName('city').setDescription('Nama kota/kabupaten').setRequired(true)))
 .addSubcommand(s=>s.setName('setup').setDescription('Aktifkan notifikasi sahur dan buka puasa').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addStringOption(o=>o.setName('city').setDescription('Nama kota/kabupaten').setRequired(true))
  .addChannelOption(o=>o.setName('channel').setDescription('Channel notifikasi').addChannelTypes(ChannelType.GuildText).setRequired(true)))
 .addSubcommand(s=>s.setName('disable').setDescription('Matikan notifikasi Ramadan').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild))
 .addSubcommand(s=>s.setName('test').setDescription('Tes notifikasi Ramadan').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild));

const commands=[jkt48,jkt48game,sim,utility,economy,moderation,support,feed,media,verify,bot,news,market,prices,ramadan];

const rest=new REST({version:'10'}).setToken(process.env.DISCORD_TOKEN);
await rest.put(Routes.applicationCommands(process.env.CLIENT_ID),{body:commands.map(x=>x.toJSON())});
console.log('Commands deployed:',commands.length);
