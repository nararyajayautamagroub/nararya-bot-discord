export const FEATURE_REGISTRY=[
 {id:'discord-commands',name:'Slash Command Registry',category:'Discord',description:'Namespace slash command terdaftar untuk JKT48, game, simulasi, utility, economy, moderation, support, feed, media, verification, dan developer tools.',status:'active'},
 {id:'jkt48-members',name:'JKT48 Member Database',category:'JKT48',description:'Sinkronisasi member generasi 1-14 dari sumber JSON publik.',status:'active'},
 {id:'jkt48-upcoming',name:'JKT48 Upcoming',category:'JKT48',description:'Event, theater, setlist, songs, live, birthday, dan graduation.',status:'active'},
 {id:'jkt48-latest',name:'JKT48 Latest',category:'JKT48',description:'Data terbaru event, theater, setlist, songs, live, birthday, graduation, SHOWROOM, dan IDN.',status:'active'},
 {id:'jkt48-feed',name:'JKT48 Platform Feed',category:'Notification',description:'Feed publik untuk JKT48 Website, IDN, SHOWROOM, YouTube, Instagram, TikTok, X/Twitter, Threads, Tokopedia, Shopee, dan kanal costume.',status:'active'},
 {id:'jkt48-quiz',name:'JKT48 Quiz',category:'Game',description:'Mode quiz suara, foto member, setlist, lagu, dan random member.',status:'active'},
 {id:'jkt48-gacha',name:'JKT48 Gacha',category:'Game',description:'Gacha kartu dengan rarity Common hingga Secret dan database terpisah.',status:'active'},
 {id:'jkt48-cards',name:'JKT48 Card Collection',category:'Game',description:'Inventory dan statistik koleksi kartu.',status:'active'},
 {id:'simulation',name:'Simulation Tycoon',category:'Game',description:'Profil kota, daily, bank, fishing, build, dan gacha.',status:'active'},
 {id:'economy',name:'Server Economy',category:'Community',description:'Saldo, daily reward, dan penyimpanan ekonomi per server/user.',status:'active'},
 {id:'leveling',name:'Leveling',category:'Community',description:'XP dan level berdasarkan aktivitas pesan.',status:'active'},
 {id:'moderation',name:'Moderation',category:'Security',description:'Warning, ban, anti-spam, anti-invite, link moderation, dan timeout.',status:'active'},
 {id:'tickets',name:'Support Tickets',category:'Support',description:'Ticket privat dengan role staff dan tombol close.',status:'active'},
 {id:'welcome-goodbye',name:'Welcome / Goodbye',category:'Community',description:'Pesan otomatis saat member masuk atau keluar.',status:'active'},
 {id:'media-download',name:'Media Downloader',category:'Media',description:'Download video, audio, dan image dari sumber publik melalui yt-dlp/direct metadata.',status:'active'},
 {id:'media-resolution',name:'Media Resolution',category:'Media',description:'Pilihan resolusi video dari 360p sampai 2160p/best sesuai sumber.',status:'active'},
 {id:'media-vocals',name:'Vocal Separation',category:'Media',description:'Pemisahan vocal dan instrumental dengan Demucs.',status:'active'},
 {id:'media-background',name:'Background Removal',category:'Media',description:'Penghapusan background image/video dengan rembg.',status:'active'},
 {id:'media-watermark',name:'Watermark Removal',category:'Media',description:'Inpainting watermark pada area koordinat yang diberikan.',status:'active'},
 {id:'media-settings',name:'Media User Settings',category:'Media',description:'Default resolusi dan format media per user.',status:'active'},
 {id:'verification-web',name:'Web Verification',category:'Security',description:'Website verifikasi dengan checkbox I\'m not a robot, ticket sesi, kode sekali pakai, dan expiry.',status:'active'},
 {id:'verification-server-code',name:'Server-bound Verification Code',category:'Security',description:'Kode 4 karakter yang diturunkan dari secret unik setiap server Discord dan nonce sesi.',status:'active'},
 {id:'verification-role',name:'Verification Role',category:'Security',description:'Role Discord opsional yang diberikan setelah kode valid ditukarkan.',status:'active'},
 {id:'verification-rate-limit',name:'Verification Rate Limit',category:'Security',description:'Batas percobaan kode dan expiry untuk mengurangi brute force.',status:'active'},
 {id:'security-docs',name:'Security Policy',category:'Developer',description:'SECURITY.md berisi pelaporan vulnerability dan praktik pengamanan secret.',status:'active'},
 {id:'feature-registry',name:'Feature Registry',category:'Developer',description:'Registry terpusat agar command, dokumentasi, dan website membaca daftar fitur dari sumber yang sama.',status:'active'},
 {id:'bot-info',name:'Bot Info',category:'Developer',description:'Informasi runtime, versi, guild count, dan runtime environment.',status:'active'},
 {id:'bot-features',name:'Bot Feature Catalog',category:'Developer',description:'Menampilkan registry fitur aktif dari bot.',status:'active'},
 {id:'bot-health',name:'Bot Health',category:'Developer',description:'Status uptime, memory, database, dan verification web server.',status:'active'}
];

export function getFeatures({category}={}){
 const rows=category?FEATURE_REGISTRY.filter(x=>x.category.toLowerCase()===String(category).toLowerCase()):FEATURE_REGISTRY;
 return [...rows];
}
