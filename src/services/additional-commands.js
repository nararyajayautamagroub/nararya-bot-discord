import {createStreetViewQuestion} from './games/streetview.js';
import {rollRarity,rarityInfo} from './games/rarity.js';
import {startSession} from './games/jkt48/quiz-system.js';
import {getIndonesiaNews,getStockQuote,getFuelPrices,getElectricityPrices,getFoodPrices,upcomingRamadan,DATA_SOURCES} from './indonesia/data.js';
import {getElectronicsPrices} from './indonesia/electronics.js';
import {FEATURE_REGISTRY} from '../config/features.js';
import {AttachmentBuilder} from 'discord.js';
import {DISASTER_URLS,recentDisasters,disasterStatus,configureDisaster} from './disasters/index.js';

export function createAdditionalCommandHandler({db,jkt48QuizDb,client,embed,gameCooldowns,gameCooldownMs,quizTimeoutMs,scraperOrchestrator,getAuditStatus,onQuizStarted}){
 const cooldown=(guildId,userId)=>{
  const key=guildId+':'+userId;
  const last=gameCooldowns.get(key)||0;
  const remaining=gameCooldownMs-(Date.now()-last);
  if(remaining>0)return remaining;
  gameCooldowns.set(key,Date.now());
  return 0;
 };
 const infoGameStatus=(guildId,userId)=>{
  const active=jkt48QuizDb.prepare("SELECT mode,started_at,expires_at FROM quiz_sessions WHERE guild_id=? AND user_id=? AND status='active' ORDER BY id DESC LIMIT 1").get(guildId,userId);
  const last=gameCooldowns.get(guildId+':'+userId)||0;
  return {active,remaining:Math.max(0,gameCooldownMs-(Date.now()-last))};
 };
 return async function handle(i){
  const n=i.commandName;
  if(n==='help'){
   const category=i.options.getString('category')||'all';
   const page=i.options.getInteger('page')||1;
   const categories=[...new Set(FEATURE_REGISTRY.map(x=>x.category))];
   const rows=category==='all'?FEATURE_REGISTRY:FEATURE_REGISTRY.filter(x=>x.category.toLowerCase()===category.toLowerCase());
   const pageSize=8,totalPages=Math.max(1,Math.ceil(rows.length/pageSize)),safePage=Math.min(Math.max(1,page),totalPages);
   const slice=rows.slice((safePage-1)*pageSize,safePage*pageSize);
   const body=slice.length?slice.map((x,n)=>'**'+(((safePage-1)*pageSize)+n+1)+'. '+x.name+'**\n'+x.description).join('\n\n'):'Tidak ada fitur untuk kategori tersebut.';
   return i.reply({embeds:[embed('📚 BOT NARARYA GROUB • Help',body+'\n\n**Kategori:** '+category+'\n**Halaman:** '+safePage+'/'+totalPages+'\n\nGunakan /help category:<kategori> untuk memfilter.',{color:0xFF6200,fields:[{name:'Kategori tersedia',value:categories.join(' • ')||'General'},{name:'Command utama',value:'/bot • /status • /setup • /news • /market • /prices • /electronics • /ramadan • /disaster • /game • /jkt48 • /jkt48game • /media • /feed'}]})]});
  }

  if(n==='setup'){
   const sub=i.options.getSubcommand(true);
   if(sub==='overview'){
    const cfg=db.prepare('SELECT * FROM guild_config WHERE guild_id=?').get(i.guild.id)||{};
    const ramadan=db.prepare('SELECT * FROM ramadan_configs WHERE guild_id=?').get(i.guild.id);
    const disaster=db.prepare('SELECT * FROM disaster_configs WHERE guild_id=?').get(i.guild.id);
    return i.reply({embeds:[embed('⚙️ Setup • Server Configuration',
     '**Welcome:** '+(cfg.welcome_channel?'<#'+cfg.welcome_channel+'>':'Otomatis / belum diatur')+
     '\n**Log:** '+(cfg.log_channel?'<#'+cfg.log_channel+'>':'Belum diatur')+
     '\n**Feed:** '+(cfg.feed_channel?'<#'+cfg.feed_channel+'>':'Belum diatur')+
     '\n**Ramadan:** '+(ramadan?.enabled?'✅ Aktif • '+ramadan.city_name:'❌ Nonaktif / belum diatur')+
     '\n**Disaster:** '+(disaster?.enabled?'✅ Aktif • <#'+disaster.channel_id+'>':'❌ Nonaktif / belum diatur')+
     '\n\n**Total fitur:** '+FEATURE_REGISTRY.length,
     {color:0x3B82F6,fields:[{name:'Data scraper',value:'✅ Pemeriksaan URL 10 detik'},{name:'Berita',value:'✅ Background refresh 24 jam'},{name:'Harga elektronik',value:'✅ Scraper 30 menit'},{name:'JKT48',value:'✅ Menggunakan sumber repository/sumber JKT48 yang dikonfigurasi'}]})]});
   }
   if(sub==='welcome'){
    const channel=i.options.getChannel('channel',true);
    db.prepare('UPDATE guild_config SET welcome_channel=? WHERE guild_id=?').run(channel.id,i.guild.id);
    return i.reply({embeds:[embed('✅ Welcome Channel Disimpan','Pesan member masuk dan onboarding guild akan menggunakan <#'+channel.id+'>.',{color:0x22C55E})]});
   }
   if(sub==='log'){
    const channel=i.options.getChannel('channel',true);
    db.prepare('UPDATE guild_config SET log_channel=? WHERE guild_id=?').run(channel.id,i.guild.id);
    return i.reply({embeds:[embed('✅ Log Channel Disimpan','Laporan audit scraper dan error data akan dikirim ke <#'+channel.id+'> bila ada temuan baru.',{color:0x22C55E})]});
   }
  }

  if(n==='electronics'){
   const category=i.options.getString('category')||'all';
   const query=i.options.getString('query')||'';
   const limit=i.options.getInteger('limit')||15;
   try{
    const data=await getElectronicsPrices({category,query,limit});
    const body=data.items.length?data.items.map((x,n)=>
      '**'+(n+1)+'. '+x.title+'**\n💰 **Rp'+Number(x.price).toLocaleString('id-ID')+'**'+
      (x.platform!=='Unknown'?' • '+x.platform:'')+'\n'+(x.url?'[Lihat produk]('+x.url+')':'')
    ).join('\n\n'):'Tidak ada produk yang cocok dari katalog publik saat ini.';
    return i.reply({embeds:[embed('🔌 Harga Elektronik Indonesia',body,{color:0x06B6D4,fields:[
      {name:'Kategori',value:category,inline:true},
      {name:'Pencarian',value:query||'Semua produk',inline:true},
      {name:'Item dipindai',value:String(data.scanned),inline:true},
      {name:'Sumber',value:data.source},
      {name:'Pembaruan',value:new Date(data.updatedAt).toLocaleString('id-ID',{timeZone:process.env.BOT_TIMEZONE||'Asia/Jakarta'})+' WIB'}
    ]})]});
   }catch(error){
    return i.reply({embeds:[embed('❌ Harga Elektronik Tidak Tersedia',error.message,{color:0xEF4444})],ephemeral:true});
   }
  }
  if(n==='game'){
   const sub=i.options.getSubcommand(true);
   if(sub==='status'){
    const state=infoGameStatus(i.guild.id,i.user.id);
    return i.reply({embeds:[embed('🎮 Game Status','Cooldown: **'+(state.remaining?Math.ceil(state.remaining/1000):0)+' detik**\nSesi aktif: **'+(state.active?state.active.mode:'Tidak ada')+'**'+(state.active?'\nWaktu tersisa: **'+Math.max(0,Math.ceil((state.active.expires_at-Date.now())/1000))+' detik**':'')+'\nBatas jawaban: **1 menit**')]});
   }
   if(sub==='streetview'){
    const left=cooldown(i.guild.id,i.user.id);
    if(left)return i.reply({embeds:[embed('⏳ Game Cooldown','Tunggu **'+Math.ceil(left/1000)+' detik** sebelum memainkan game lagi.',{color:0xF59E0B})],ephemeral:true});
    try{
     const question=await createStreetViewQuestion();
     const rarity=rollRarity();
     const active=startSession(jkt48QuizDb,{guildId:i.guild.id,userId:i.user.id,channelId:i.channel.id,mode:'streetView',answer:question.answers.join('|'),mediaUrl:null,rarity,durationMs:quizTimeoutMs});
     if(active&&onQuizStarted)onQuizStarted(active);
     return i.reply({embeds:[embed('🌍 Tebak Lokasi Google Street View','Tebak **kota atau negara** dari foto Street View.\n\n⏱️ Waktu: **1 menit**\n🎴 Rarity: **'+rarityInfo[rarity].label+'**\n\nMode ini adalah game lokasi umum, tidak berfokus pada JKT48.',{color:0x3B82F6,image:'attachment://streetview.jpg'})],files:[new AttachmentBuilder(question.buffer,{name:'streetview.jpg'})]});
    }catch(error){return i.reply({embeds:[embed('❌ Street View Tidak Tersedia',error.message,{color:0xEF4444})],ephemeral:true})}
   }
  }

  if(n==='disaster'){
   const sub=i.options.getSubcommand(true);
   if(sub==='status'){
    const state=disasterStatus(db);
    const sources=state.sources.map(x=>'• **'+x.source+'** • '+(x.last_error?'ERROR: '+x.last_error:'OK')+' • '+x.last_items+' item').join('\n')||'Belum ada refresh.';
    const recent=state.recent.slice(0,8).map(x=>'• **'+x.disaster_type+'** • '+x.title+' • 📍 '+x.location).join('\n')||'Belum ada kejadian tersimpan.';
    return i.reply({embeds:[embed('🚨 Status Kebencanaan','**Sumber:**\n'+sources+'\n\n**Kejadian terbaru:**\n'+recent,{color:0xEF4444})]});
   }
   const typeMap={latest:'',earthquake:'earthquake',tsunami:'tsunami',volcano:'volcano',general:'bnpb'};
   if(['latest','earthquake','tsunami','volcano','general'].includes(sub)){
    const selected=sub==='latest'?(i.options.getString('type')||'all'):sub;
    const rows=selected==='all'?recentDisasters(db,{limit:10}):recentDisasters(db,{type:typeMap[selected]||selected,limit:10});
    const body=rows.length?rows.map((x,n)=>'**'+(n+1)+'. '+x.disaster_type+'**\n📍 '+(x.location||'Indonesia')+'\n🕐 '+(x.event_time||'Tidak tersedia')+'\n'+x.title).join('\n\n'):'Belum ada data kejadian.';
    return i.reply({embeds:[embed('🚨 Informasi Bencana',body,{color:0xEF4444})]});
   }
   if(sub==='setup'){
    const channel=i.options.getChannel('channel',true);
    const minMagnitude=i.options.getNumber('min_magnitude')||0;
    configureDisaster(db,{guildId:i.guild.id,channelId:channel.id,minMagnitude});
    return i.reply({embeds:[embed('✅ Notifikasi Bencana Aktif','Channel: '+channel+'\nMinimum magnitudo: **M'+minMagnitude+'**\nSumber: BMKG, BNPB dan MAGMA.',{color:0x22C55E})]});
   }
   if(sub==='disable'){
    db.prepare('UPDATE disaster_configs SET enabled=0,updated_at=? WHERE guild_id=?').run(Date.now(),i.guild.id);
    return i.reply({embeds:[embed('🔕 Notifikasi Bencana Dimatikan','Notifikasi kebencanaan server ini dinonaktifkan.',{color:0xF59E0B})]});
   }
  }

  if(n==='status'){
   const sub=i.options.getSubcommand(true);
   if(sub==='system'){
    const mem=process.memoryUsage();
    let dbOk=false;try{db.prepare('SELECT 1').get();dbOk=true}catch{}
    return i.reply({embeds:[embed('🩺 System Status','Database: **'+(dbOk?'OK':'ERROR')+'**\nGuild: **'+i.client.guilds.cache.size+'**\nNode: **'+process.version+'**\nRSS: **'+Math.round(mem.rss/1024/1024)+' MB**\nUptime: **'+Math.floor(process.uptime())+' detik**',{color:dbOk?0x22C55E:0xEF4444})]});
   }
   if(sub==='scrapers'){
    const rows=scraperOrchestrator.status();
    const body=rows.slice(0,30).map(x=>'• **'+x.key+'** → HTTP '+(x.last_status||0)+' • '+(x.last_latency_ms||0)+'ms • '+(x.last_error||'OK')).join('\n')||'Belum ada sumber.';
    return i.reply({embeds:[embed('🔎 Scraper Status','Pengecekan URL dijalankan setiap **10 detik**.\n'+body,{color:0x3B82F6})]});
   }
   if(sub==='data'){
    const state=getAuditStatus(db);
    const summary=state.findings.map(x=>'• **'+x.status+'**: '+x.count).join('\n')||'Belum ada hasil audit.';
    const missing=state.missing.slice(0,8).map(x=>'• **'+x.db_name+'.'+x.table_name+'.'+x.column_name+'**\nURL: '+x.url+'\nMetode: '+x.method+'\nSaran: '+x.suggestion+(x.error?'\nError: '+x.error:'')).join('\n\n')||'Tidak ada data URL yang bermasalah.';
    return i.reply({embeds:[embed('🧪 Data Audit','Urutan pipeline: **database → scraper/URL → validasi → audit sumber**.\nAudit berjalan setiap **10 detik**.\n\n**Ringkasan**\n'+summary+'\n\n**Temuan yang perlu diperbaiki**\n'+missing,{color:state.missing.length?0xF59E0B:0x22C55E})]});
   }
   if(sub==='disasters'){
    const state=disasterStatus(db);
    const body=state.sources.map(x=>'• **'+x.source+'** • '+(x.last_error?'ERROR':'OK')+' • '+x.last_items+' item').join('\n')||'Belum ada refresh bencana.';
    return i.reply({embeds:[embed('🚨 Disaster Source Status',body,{color:0xEF4444})]});
   }
   if(sub==='sources'){
    return i.reply({embeds:[embed('🌐 Active Data Sources',Object.entries(DATA_SOURCES.news).map(([k,v])=>'• **'+k+'** → '+v).join('\n')+'\n\n• BMKG → '+DISASTER_URLS.earthquake+'\n• BMKG Tsunami → '+DISASTER_URLS.tsunami+'\n• BNPB → '+DISASTER_URLS.bnpb+'\n• MAGMA → '+DISASTER_URLS.magma,{color:0x3B82F6})]});
   }
  }

  if(n==='upcoming'){
   const sub=i.options.getSubcommand(true);
   if(sub==='ramadan'){
    const r=upcomingRamadan();
    return i.reply({embeds:[embed('🌙 Upcoming Ramadan '+r.hijri,'Perkiraan mulai: **'+r.estimatedStart+'**\nPerkiraan akhir: **'+r.estimatedEnd+'**\nNuzulul Qur’an: **'+r.nuzul+'**\n\n'+r.officialStatus,{color:0x8B5CF6})]});
   }
   if(sub==='disasters'){
    return i.reply({embeds:[embed('🚨 Upcoming Disaster Status','Bot tidak membuat prediksi waktu atau lokasi bencana. Command ini hanya menampilkan peringatan dan kejadian resmi yang sudah dipublikasikan sumber pemerintah.',{color:0xF59E0B})]});
   }
  }
  return null;
 };
}

export {DATA_SOURCES};
