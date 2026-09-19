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
const assetModes=choiceModes;
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
 .addSubcommand(s=>s.setName('asset_list').setDescription('Lihat jumlah asset per mode').addStringOption(o=>o.setName('mode').setDescription('Mode quiz').addChoices(...assetModes)));

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

const help=new SlashCommandBuilder().setName('help').setDescription('Bantuan dan katalog semua fitur bot')
 .addStringOption(o=>o.setName('category').setDescription('Filter kategori fitur').addChoices(
  {name:'Semua',value:'all'},{name:'Discord',value:'Discord'},{name:'JKT48',value:'JKT48'},{name:'Notification',value:'Notification'},
  {name:'Game',value:'Game'},{name:'Community',value:'Community'},{name:'Security',value:'Security'},{name:'Support',value:'Support'},
  {name:'Media',value:'Media'},{name:'Developer',value:'Developer'},{name:'Indonesia',value:'Indonesia'},{name:'Ramadan',value:'Ramadan'}))
 .addIntegerOption(o=>o.setName('page').setDescription('Halaman bantuan').setMinValue(1));

const setup=new SlashCommandBuilder().setName('setup').setDescription('Konfigurasi global bot (owner bot saja)')
 .addSubcommand(s=>s.setName('overview').setDescription('Lihat seluruh status konfigurasi fitur'))
 .addSubcommand(s=>s.setName('welcome').setDescription('Atur channel welcome/onboarding').addChannelOption(o=>o.setName('channel').setDescription('Channel welcome').addChannelTypes(ChannelType.GuildText).setRequired(true)))
 .addSubcommand(s=>s.setName('log').setDescription('Atur channel log audit').addChannelOption(o=>o.setName('channel').setDescription('Channel log').addChannelTypes(ChannelType.GuildText).setRequired(true)));

const electronics=new SlashCommandBuilder().setName('electronics').setDescription('Cek harga produk elektronik Indonesia')
 .addStringOption(o=>o.setName('category').setDescription('Kategori elektronik').addChoices(
  {name:'Semua',value:'all'},{name:'Smartphone',value:'smartphone'},{name:'Laptop',value:'laptop'},{name:'Tablet',value:'tablet'},
  {name:'TV',value:'tv'},{name:'Monitor',value:'monitor'},{name:'Audio',value:'audio'},{name:'Kamera',value:'camera'},
  {name:'Printer',value:'printer'},{name:'Router/WiFi',value:'router'},{name:'Storage',value:'storage'},{name:'Gaming',value:'gaming'},
  {name:'Keyboard',value:'keyboard'},{name:'Mouse',value:'mouse'},{name:'Smartwatch',value:'smartwatch'},{name:'Lainnya',value:'other'}))
 .addStringOption(o=>o.setName('query').setDescription('Nama atau model produk yang dicari'))
 .addIntegerOption(o=>o.setName('limit').setDescription('Jumlah hasil 1-25').setMinValue(1).setMaxValue(25));

const game=new SlashCommandBuilder().setName('game').setDescription('Game umum bot')
 .addSubcommand(s=>s.setName('streetview').setDescription('Tebak lokasi dari foto Google Street View'))
 .addSubcommand(s=>s.setName('status').setDescription('Lihat cooldown dan sesi game aktif'));

const disaster=new SlashCommandBuilder().setName('disaster').setDescription('Informasi kebencanaan Indonesia')
 .addSubcommand(s=>s.setName('status').setDescription('Status sumber dan kejadian bencana terbaru'))
 .addSubcommand(s=>s.setName('latest').setDescription('Kejadian bencana terbaru').addStringOption(o=>o.setName('type').setDescription('Jenis').addChoices(
  {name:'Semua',value:'all'},{name:'Gempa',value:'earthquake'},{name:'Tsunami',value:'tsunami'},{name:'Gunung Api',value:'volcano'},{name:'Bencana Umum',value:'bnpb'})))
 .addSubcommand(s=>s.setName('earthquake').setDescription('Gempa bumi terbaru'))
 .addSubcommand(s=>s.setName('tsunami').setDescription('Status potensi tsunami'))
 .addSubcommand(s=>s.setName('volcano').setDescription('Status aktivitas gunung api'))
 .addSubcommand(s=>s.setName('general').setDescription('Bencana umum dari BNPB'))
 .addSubcommand(s=>s.setName('setup').setDescription('Aktifkan notifikasi bencana').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addChannelOption(o=>o.setName('channel').setDescription('Channel notifikasi').addChannelTypes(ChannelType.GuildText).setRequired(true))
  .addNumberOption(o=>o.setName('min_magnitude').setDescription('Minimum magnitudo gempa').setMinValue(0).setMaxValue(10)))
 .addSubcommand(s=>s.setName('disable').setDescription('Matikan notifikasi bencana').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild));

const status=new SlashCommandBuilder().setName('status').setDescription('Status sistem dan scraper')
 .addSubcommand(s=>s.setName('system').setDescription('Status runtime dan database'))
 .addSubcommand(s=>s.setName('scrapers').setDescription('Status pemeriksaan URL scraper'))
 .addSubcommand(s=>s.setName('data').setDescription('Audit database, URL, dan scraper'))
 .addSubcommand(s=>s.setName('disasters').setDescription('Status sumber kebencanaan'))
 .addSubcommand(s=>s.setName('sources').setDescription('Daftar sumber data aktif'));

const upcoming=new SlashCommandBuilder().setName('upcoming').setDescription('Informasi yang akan datang')
 .addSubcommand(s=>s.setName('ramadan').setDescription('Perkiraan Ramadan berikutnya'))
 .addSubcommand(s=>s.setName('disasters').setDescription('Status peringatan bencana resmi'));

const settingbot=new SlashCommandBuilder().setName('settingbot').setDescription('Pengaturan global bot (owner bot saja)')
 .addSubcommand(s=>s.setName('status').setDescription('Lihat pengaturan global bot'))
 .addSubcommand(s=>s.setName('maintenance').setDescription('Aktifkan/nonaktifkan maintenance').addBooleanOption(o=>o.setName('enabled').setDescription('Status maintenance').setRequired(true)))
 .addSubcommand(s=>s.setName('activity').setDescription('Atur activity/status bot').addStringOption(o=>o.setName('text').setDescription('Teks activity').setRequired(true).setMaxLength(100)))
 .addSubcommand(s=>s.setName('rotation').setDescription('Atur rotasi Playing status').addStringOption(o=>o.setName('texts').setDescription('Teks dipisahkan koma atau |').setRequired(true).setMaxLength(1000)))
 .addSubcommand(s=>s.setName('reset').setDescription('Reset pengaturan global bot'));

const blacklistserver=new SlashCommandBuilder().setName('blacklistserver').setDescription('Kelola blacklist server global (owner bot saja)')
 .addSubcommand(s=>s.setName('add').setDescription('Blacklist server').addStringOption(o=>o.setName('server_id').setDescription('Discord server ID').setRequired(true)).addStringOption(o=>o.setName('reason').setDescription('Alasan blacklist').setMaxLength(250)))
 .addSubcommand(s=>s.setName('remove').setDescription('Hapus server dari blacklist').addStringOption(o=>o.setName('server_id').setDescription('Discord server ID').setRequired(true)))
 .addSubcommand(s=>s.setName('list').setDescription('Lihat blacklist server'));

const blacklistusers=new SlashCommandBuilder().setName('blacklistusers').setDescription('Kelola blacklist user global (owner bot saja)')
 .addSubcommand(s=>s.setName('add').setDescription('Blacklist user').addStringOption(o=>o.setName('user_id').setDescription('Discord user ID').setRequired(true)).addStringOption(o=>o.setName('reason').setDescription('Alasan blacklist').setMaxLength(250)))
 .addSubcommand(s=>s.setName('remove').setDescription('Hapus user dari blacklist').addStringOption(o=>o.setName('user_id').setDescription('Discord user ID').setRequired(true)))
 .addSubcommand(s=>s.setName('list').setDescription('Lihat blacklist user'));

const restaurantprices=new SlashCommandBuilder().setName('restaurantprices').setDescription('Harga menu dan makanan restoran Indonesia')
 .addSubcommand(s=>s.setName('search').setDescription('Cari restoran dan kisaran harga').addStringOption(o=>o.setName('city').setDescription('Kota, contoh jakarta atau depok').setRequired(true)).addStringOption(o=>o.setName('query').setDescription('Nama restoran atau menu')).addStringOption(o=>o.setName('category').setDescription('Kategori menu')).addNumberOption(o=>o.setName('min_price').setDescription('Harga minimum').setMinValue(0)).addNumberOption(o=>o.setName('max_price').setDescription('Harga maksimum').setMinValue(0)).addIntegerOption(o=>o.setName('page').setDescription('Halaman').setMinValue(1).setMaxValue(50)).addIntegerOption(o=>o.setName('limit').setDescription('Jumlah hasil').setMinValue(1).setMaxValue(15)))
 .addSubcommand(s=>s.setName('menu').setDescription('Lihat semua menu dan harga satu restoran').addStringOption(o=>o.setName('url').setDescription('URL halaman menu MenuKuliner.net').setRequired(true)).addStringOption(o=>o.setName('query').setDescription('Cari nama menu')).addStringOption(o=>o.setName('category').setDescription('Filter kategori')).addNumberOption(o=>o.setName('min_price').setDescription('Harga minimum').setMinValue(0)).addNumberOption(o=>o.setName('max_price').setDescription('Harga maksimum').setMinValue(0)).addIntegerOption(o=>o.setName('page').setDescription('Halaman menu').setMinValue(1).setMaxValue(50)))
 .addSubcommand(s=>s.setName('prices').setDescription('Gabungkan harga menu dari beberapa restoran di kota').addStringOption(o=>o.setName('city').setDescription('Kota').setRequired(true)).addStringOption(o=>o.setName('query').setDescription('Cari menu')).addStringOption(o=>o.setName('category').setDescription('Kategori menu')).addNumberOption(o=>o.setName('min_price').setDescription('Harga minimum').setMinValue(0)).addNumberOption(o=>o.setName('max_price').setDescription('Harga maksimum').setMinValue(0)).addIntegerOption(o=>o.setName('page').setDescription('Halaman').setMinValue(1).setMaxValue(20)).addIntegerOption(o=>o.setName('limit').setDescription('Item per halaman').setMinValue(1).setMaxValue(15)).addIntegerOption(o=>o.setName('pages').setDescription('Halaman direktori yang dipindai').setMinValue(1).setMaxValue(2)))
 .addSubcommand(s=>s.setName('city').setDescription('Lihat direktori restoran suatu kota').addStringOption(o=>o.setName('city').setDescription('Kota').setRequired(true)).addIntegerOption(o=>o.setName('page').setDescription('Halaman').setMinValue(1).setMaxValue(50)).addIntegerOption(o=>o.setName('limit').setDescription('Jumlah hasil').setMinValue(1).setMaxValue(15)))
 .addSubcommand(s=>s.setName('refresh').setDescription('Refresh direktori atau satu halaman menu').addStringOption(o=>o.setName('city').setDescription('Kota untuk refresh direktori')).addStringOption(o=>o.setName('url').setDescription('URL restoran untuk refresh menu')).addIntegerOption(o=>o.setName('pages').setDescription('Jumlah halaman kota').setMinValue(1).setMaxValue(6)))
 .addSubcommand(s=>s.setName('status').setDescription('Cek kesehatan sumber harga restoran'));

const owner=new SlashCommandBuilder().setName('owner').setDescription('Kontrol owner bot').addSubcommand(s=>s.setName('dashboard').setDescription('Dashboard owner')).addSubcommand(s=>s.setName('broadcast').setDescription('Broadcast global').addStringOption(o=>o.setName('text').setDescription('Pesan').setRequired(true).setMaxLength(1500))).addSubcommand(s=>s.setName('rotation').setDescription('Atur rotasi Playing status').addStringOption(o=>o.setName('texts').setDescription('Teks dipisahkan koma atau |').setRequired(true).setMaxLength(1000))).addSubcommand(s=>s.setName('maintenance').setDescription('Maintenance global').addBooleanOption(o=>o.setName('enabled').setDescription('Status').setRequired(true))).addSubcommand(s=>s.setName('toggle').setDescription('Toggle command global').addStringOption(o=>o.setName('command').setDescription('Nama command').setRequired(true)).addBooleanOption(o=>o.setName('enabled').setDescription('Status').setRequired(true))).addSubcommand(s=>s.setName('schedule').setDescription('Jadwalkan announcement').addStringOption(o=>o.setName('text').setDescription('Pesan').setRequired(true)).addIntegerOption(o=>o.setName('delay_seconds').setDescription('Delay detik').setMinValue(5).setMaxValue(604800).setRequired(true)))
const security=new SlashCommandBuilder().setName('security').setDescription('Security center server')
 .addSubcommand(s=>s.setName('status').setDescription('Lihat status security'))
 .addSubcommand(s=>s.setName('setup').setDescription('Atur security').addStringOption(o=>o.setName('key').setDescription('Fitur').setRequired(true).addChoices({name:'Raid',value:'raid'},{name:'Nuke',value:'nuke'},{name:'Mention',value:'mention'},{name:'Lock',value:'lock'})).addBooleanOption(o=>o.setName('enabled').setDescription('Status').setRequired(true)))
 .addSubcommand(s=>s.setName('trust').setDescription('Lihat trust score').addUserOption(o=>o.setName('user').setDescription('Target').setRequired(true)))
 .addSubcommand(s=>s.setName('incident').setDescription('Catat incident').addStringOption(o=>o.setName('type').setDescription('Jenis').setRequired(true)).addStringOption(o=>o.setName('detail').setDescription('Detail').setRequired(true)))
 .addSubcommand(s=>s.setName('lockdown').setDescription('Server lockdown').addBooleanOption(o=>o.setName('enabled').setDescription('Status').setRequired(true)));
const serverconfig=new SlashCommandBuilder().setName('serverconfig').setDescription('Konfigurasi server').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
 .addSubcommand(s=>s.setName('view').setDescription('Lihat konfigurasi'))
 .addSubcommand(s=>s.setName('set').setDescription('Simpan konfigurasi').addStringOption(o=>o.setName('key').setDescription('Key').setRequired(true)).addStringOption(o=>o.setName('value').setDescription('Value').setRequired(true)))
 .addSubcommand(s=>s.setName('rules').setDescription('Kirim rules embed').addStringOption(o=>o.setName('text').setDescription('Isi rules').setRequired(true).setMaxLength(3500)))
 .addSubcommand(s=>s.setName('stats').setDescription('Dashboard server'))
 .addSubcommand(s=>s.setName('autorole').setDescription('Atur auto role').addRoleOption(o=>o.setName('role').setDescription('Role').setRequired(true)))
 .addSubcommand(s=>s.setName('autoroleremove').setDescription('Atur auto role remove').addBooleanOption(o=>o.setName('enabled').setDescription('Status').setRequired(true)))
 .addSubcommand(s=>s.setName('automod').setDescription('Atur mention threshold').addIntegerOption(o=>o.setName('mention_threshold').setDescription('Jumlah mention').setMinValue(2).setMaxValue(20).setRequired(true)));
const modcase=new SlashCommandBuilder().setName('modcase').setDescription('Riwayat dan case moderasi').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
 .addSubcommand(s=>s.setName('history').setDescription('Lihat riwayat warning').addUserOption(o=>o.setName('user').setDescription('Target').setRequired(true)))
 .addSubcommand(s=>s.setName('reset').setDescription('Reset warning').addUserOption(o=>o.setName('user').setDescription('Target').setRequired(true)))
 .addSubcommand(s=>s.setName('remove').setDescription('Hapus case').addUserOption(o=>o.setName('user').setDescription('Target').setRequired(true)).addIntegerOption(o=>o.setName('case_id').setDescription('Case ID').setMinValue(1).setRequired(true)));
const indonesia=new SlashCommandBuilder().setName('indonesia').setDescription('Utility data Indonesia')
 .addSubcommand(s=>s.setName('time').setDescription('Waktu WIB WITA WIT'))
 .addSubcommand(s=>s.setName('weather').setDescription('Cuaca kota').addStringOption(o=>o.setName('city').setDescription('Kota').setRequired(true)))
 .addSubcommand(s=>s.setName('currency').setDescription('Konversi mata uang').addStringOption(o=>o.setName('from').setDescription('Dari').setRequired(true)).addStringOption(o=>o.setName('to').setDescription('Ke').setRequired(true)).addNumberOption(o=>o.setName('amount').setDescription('Jumlah').setRequired(true).setMinValue(0)))
 .addSubcommand(s=>s.setName('gold').setDescription('Harga emas publik'))
 .addSubcommand(s=>s.setName('fuel').setDescription('Perbandingan BBM'))
 .addSubcommand(s=>s.setName('electricity').setDescription('Kalkulator listrik').addNumberOption(o=>o.setName('kwh').setDescription('kWh').setMinValue(0).setRequired(true)).addNumberOption(o=>o.setName('tariff').setDescription('Tarif per kWh').setMinValue(0).setRequired(true)))
 .addSubcommand(s=>s.setName('toll').setDescription('Informasi tarif tol'))
 .addSubcommand(s=>s.setName('holiday').setDescription('Hari libur Indonesia').addIntegerOption(o=>o.setName('year').setDescription('Tahun').setMinValue(2000).setMaxValue(2100)));
const financeExtra=new SlashCommandBuilder().setName('finance').setDescription('Fitur finance komunitas')
 .addSubcommand(s=>s.setName('transfer').setDescription('Transfer saldo').addUserOption(o=>o.setName('user').setDescription('Penerima').setRequired(true)).addIntegerOption(o=>o.setName('amount').setDescription('Jumlah').setMinValue(1).setRequired(true)))
 .addSubcommand(s=>s.setName('history').setDescription('Riwayat transaksi'))
 .addSubcommand(s=>s.setName('leaderboard').setDescription('Leaderboard saldo'))
 .addSubcommand(s=>s.setName('shop').setDescription('Lihat shop'))
 .addSubcommand(s=>s.setName('inventory').setDescription('Lihat inventory'))
 .addSubcommand(s=>s.setName('streak').setDescription('Daily streak'))
 .addSubcommand(s=>s.setName('bank').setDescription('Tambah kas server').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).addIntegerOption(o=>o.setName('amount').setDescription('Jumlah').setMinValue(1).setRequired(true)));
const games=new SlashCommandBuilder().setName('games').setDescription('Game tambahan')
 .addSubcommand(s=>s.setName('number').setDescription('Tebak angka 1-10').addIntegerOption(o=>o.setName('guess').setDescription('Tebakan').setMinValue(1).setMaxValue(10).setRequired(true)))
 .addSubcommand(s=>s.setName('trivia').setDescription('Trivia').addStringOption(o=>o.setName('answer').setDescription('Jawaban').setRequired(true)))
 .addSubcommand(s=>s.setName('wordchain').setDescription('Sambung kata').addStringOption(o=>o.setName('word').setDescription('Kata').setRequired(true)))
 .addSubcommand(s=>s.setName('hangman').setDescription('Hangman').addStringOption(o=>o.setName('answer').setDescription('Jawaban').setRequired(true)))
 .addSubcommand(s=>s.setName('rps').setDescription('Suit').addStringOption(o=>o.setName('choice').setDescription('Pilihan').setRequired(true).addChoices({name:'Batu',value:'batu'},{name:'Gunting',value:'gunting'},{name:'Kertas',value:'kertas'})))
 .addSubcommand(s=>s.setName('dice').setDescription('Tebak dadu').addIntegerOption(o=>o.setName('guess').setDescription('Tebakan').setMinValue(1).setMaxValue(6).setRequired(true)))
 .addSubcommand(s=>s.setName('daily').setDescription('Daily challenge'))
 .addSubcommand(s=>s.setName('leaderboard').setDescription('Leaderboard game'));
const community=new SlashCommandBuilder().setName('community').setDescription('Fitur komunitas')
 .addSubcommand(s=>s.setName('poll').setDescription('Buat polling').addStringOption(o=>o.setName('question').setDescription('Pertanyaan').setRequired(true)).addStringOption(o=>o.setName('options').setDescription('Pilihan dipisahkan |').setRequired(true)))
 .addSubcommand(s=>s.setName('remind').setDescription('Buat reminder').addIntegerOption(o=>o.setName('delay_seconds').setDescription('Delay detik').setMinValue(10).setMaxValue(604800).setRequired(true)).addStringOption(o=>o.setName('text').setDescription('Isi reminder').setRequired(true)))
 .addSubcommand(s=>s.setName('suggest').setDescription('Kirim suggestion').addStringOption(o=>o.setName('text').setDescription('Isi saran').setRequired(true).setMaxLength(1000)))
 .addSubcommand(s=>s.setName('profile').setDescription('Lihat profile card'))
 .addSubcommand(s=>s.setName('star').setDescription('Catat starboard').addStringOption(o=>o.setName('message_id').setDescription('Message ID').setRequired(true)).addIntegerOption(o=>o.setName('stars').setDescription('Jumlah star').setMinValue(1).setMaxValue(999).setRequired(true)));
const commands=[jkt48,jkt48game,sim,utility,economy,financeExtra,moderation,support,feed,media,verify,bot,news,market,prices,ramadan,game,games,indonesia,community,security,serverconfig,modcase,disaster,status,upcoming,help,setup,electronics,restaurantprices,settingbot,owner,blacklistserver,blacklistusers];

const rest=new REST({version:'10'}).setToken(process.env.DISCORD_TOKEN);
await rest.put(Routes.applicationCommands(process.env.CLIENT_ID),{body:commands.map(x=>x.toJSON())});
console.log('Commands deployed:',commands.length);
