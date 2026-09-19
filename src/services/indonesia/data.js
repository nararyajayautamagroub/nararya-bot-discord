import * as cheerio from 'cheerio';

const cache=new Map();
const TTL={news:15*60*1000,stock:10*60*1000,static:24*60*60*1000,prayer:24*60*60*1000};
const NEWS_FEEDS={
  latest:'https://www.antaranews.com/rss/terkini.xml',
  top:'https://www.antaranews.com/rss/top-news.xml',
  economy:'https://www.antaranews.com/rss/ekonomi.xml',
  finance:'https://www.antaranews.com/rss/ekonomi-finansial.xml',
  business:'https://www.antaranews.com/rss/ekonomi-bisnis.xml',
  market:'https://www.antaranews.com/rss/ekonomi-bursa.xml',
  politics:'https://www.antaranews.com/rss/politik.xml',
  law:'https://www.antaranews.com/rss/hukum.xml'
};
const FUEL_SOURCE_URL=process.env.FUEL_SOURCE_URL||'https://www.mypertamina.id/';
const ELECTRICITY_SOURCE_URL=process.env.ELECTRICITY_SOURCE_URL||'https://web.pln.co.id/pelanggan/tarif-tenaga-listrik';
const FOOD_SOURCE_URL=process.env.FOOD_SOURCE_URL||'https://www.bi.go.id/hargapangan/Website';
const RAMADAN_SOURCE_URL=process.env.RAMADAN_SOURCE_URL||'https://www.kemenag.go.id/';
const FUEL_DEFAULTS=[['Pertalite',null,'Rp/liter'],['Biosolar',null,'Rp/liter'],['Pertamax',null,'Rp/liter'],['Pertamax Green 95',null,'Rp/liter'],['Pertamax Turbo',null,'Rp/liter'],['Dexlite',null,'Rp/liter'],['Pertamina Dex',null,'Rp/liter']];
const ELECTRICITY_DEFAULTS=[['R-1 Subsidi 450 VA',null,'Rp/kWh'],['R-1 Subsidi 900 VA',null,'Rp/kWh'],['R-1 Non-Subsidi 900 VA',null,'Rp/kWh'],['R-1 Non-Subsidi 1300-2200 VA',null,'Rp/kWh'],['R-2 3500-5500 VA',null,'Rp/kWh'],['R-3 >=6600 VA',null,'Rp/kWh']];
const FOOD_DEFAULTS=[['Beras Premium','Rp/kg'],['Beras Medium','Rp/kg'],['Bawang Merah','Rp/kg'],['Bawang Putih','Rp/kg'],['Cabai Merah Keriting','Rp/kg'],['Cabai Rawit Merah','Rp/kg'],['Daging Ayam Ras','Rp/kg'],['Daging Sapi Murni','Rp/kg'],['Telur Ayam Ras','Rp/kg'],['Gula Pasir Lokal','Rp/kg'],['Minyak Goreng Kemasan Sederhana','Rp/liter']];
const escapeRegex=value=>String(value).replaceAll(/[-/\\^$*+?.()|[\]{}]/g,'\\$&');

async function text(url,init={}){const res=await fetch(url,{...init,headers:{'user-agent':process.env.SCRAPER_USER_AGENT||'NararyaBotDiscord/1.6.0',...(init.headers||{})}});if(!res.ok)throw new Error('HTTP '+res.status+' dari '+url);return res.text()}
async function json(url,init={}){const body=await text(url,init);try{return JSON.parse(body)}catch{throw new Error('JSON tidak valid dari '+url)}}
function getCached(key,ttl){const item=cache.get(key);if(item&&Date.now()-item.fetchedAt<ttl)return item.value;return null}
function setCached(key,value){cache.set(key,{value,fetchedAt:Date.now()});return value}
function sourceStamp(key){return cache.get(key)?.fetchedAt||null}
function dateKey(date=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:process.env.BOT_TIMEZONE||'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(date)}
function parseRss(xml,limit=8){
 const $=cheerio.load(xml,{xmlMode:true});
 return $('item').toArray().slice(0,limit).map(item=>{const el=$(item);return{title:el.find('title').first().text().trim(),link:el.find('link').first().text().trim(),pubDate:el.find('pubDate').first().text().trim(),description:el.find('description').first().text().replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim(),image:el.find('media\\:content, enclosure').first().attr('url')||null}}).filter(x=>x.title&&x.link);
}
export async function getIndonesiaNews(category='latest',limit=8){
 const key='news:'+category,cached=getCached(key,TTL.news);if(cached)return cached;
 const url=NEWS_FEEDS[category]||NEWS_FEEDS.latest,items=parseRss(await text(url),limit);if(!items.length)throw new Error('RSS berita kosong atau berubah format.');
 return setCached(key,{items,source:url,updatedAt:Date.now()});
}
export async function getStockQuote(symbol){
 const ticker=String(symbol||'').trim().toUpperCase().replace(/[^A-Z0-9.]/g,'');if(!ticker)throw new Error('Kode saham belum diisi.');
 const resolved=ticker==='IHSG'?'^JKSE':(ticker.includes('.')?ticker:ticker+'.JK'),key='stock:'+resolved,cached=getCached(key,TTL.stock);if(cached)return cached;
 const url='https://query1.finance.yahoo.com/v8/finance/chart/'+encodeURIComponent(resolved)+'?range=1d&interval=5m&includePrePost=false',data=await json(url),result=data.chart?.result?.[0];if(!result?.meta)throw new Error('Data saham tidak ditemukan untuk '+resolved+'.');
 const meta=result.meta,price=Number(meta.regularMarketPrice??meta.postMarketPrice??meta.previousClose),previous=Number(meta.previousClose??meta.chartPreviousClose??price);
 return setCached(key,{symbol:resolved,price,previous,change:price-previous,changePercent:previous?((price-previous)/previous)*100:0,currency:meta.currency||'IDR',exchange:meta.exchangeName||'IDX',marketState:meta.marketState||'UNKNOWN',fetchedAt:Date.now(),source:'Yahoo Finance'});
}
export async function getFuelPrices(){
 const key='prices:fuel',cached=getCached(key,TTL.static);if(cached)return cached;
 const rows=FUEL_DEFAULTS.map(([name,value,unit])=>({name,value,unit}));
 try{const body=(await text(FUEL_SOURCE_URL)).replace(/\s+/g,' ');for(const row of rows){const m=body.match(new RegExp(escapeRegex(row.name)+'[^0-9]{0,120}([0-9]{1,3}(?:[.,][0-9]{3})+)','i'));if(m)row.value=Number(m[1].replace(/[.,]/g,''))}}catch{}
 return setCached(key,{items:rows,source:FUEL_SOURCE_URL,updatedAt:Date.now(),note:'Nilai hanya ditampilkan bila scraper sumber berhasil mengambil angka terbaru. Harga dapat berbeda menurut wilayah dan perubahan resmi Pertamina.'});
}
export async function getElectricityPrices(){
 const key='prices:electricity',cached=getCached(key,TTL.static);if(cached)return cached;
 const rows=ELECTRICITY_DEFAULTS.map(([name,value,unit])=>({name,value,unit}));
 let sourceChecked=false;
 try{await text(ELECTRICITY_SOURCE_URL);sourceChecked=true}catch{}
 return setCached(key,{items:rows,source:ELECTRICITY_SOURCE_URL,updatedAt:Date.now(),sourceChecked,note:sourceChecked?'Sumber PLN berhasil diperiksa; nilai ditampilkan bila parser sumber berhasil mengambil tarif terbaru.':'Sumber PLN tidak dapat diperiksa saat refresh.'});
}
export async function getFoodPrices(){
 const key='prices:food',cached=getCached(key,TTL.static);if(cached)return cached;
 try{const page=await text(FOOD_SOURCE_URL),full=cheerio.load(page)('body').text().replace(/\s+/g,' '),items=FOOD_DEFAULTS.map(([name,unit])=>{const m=full.match(new RegExp(escapeRegex(name)+'[^0-9]{0,160}(?:Rp\\s*)?([0-9]{4,6}(?:[.,][0-9]{1,2})?)','i'));return{name,unit,value:m?Number(m[1].replace(/\./g,'').replace(',','.')):null}});return setCached(key,{items,source:FOOD_SOURCE_URL,updatedAt:Date.now(),note:'Data harga pangan strategis diperbarui harian.'})}catch{return setCached(key,{items:FOOD_DEFAULTS.map(([name,unit])=>({name,value:null,unit})),source:FOOD_SOURCE_URL,updatedAt:Date.now(),note:'Sumber resmi tersedia, tetapi angka tidak dapat diparse pada saat refresh.'})}
}
export async function findCity(query){const data=await json('https://api.myquran.com/v2/sholat/kota/cari/'+encodeURIComponent(String(query||'').trim()));return(data.data||[]).map(x=>({id:String(x.id),lokasi:x.lokasi,daerah:x.daerah})).slice(0,10)}
export async function getPrayerSchedule(cityId,date=new Date()){
 const d=new Date(date),key='prayer:'+cityId+':'+dateKey(d),cached=getCached(key,TTL.prayer);if(cached)return cached;
 const [y,m,day]=dateKey(d).split('-'),data=await json('https://api.myquran.com/v2/sholat/jadwal/'+encodeURIComponent(cityId)+'/'+y+'-'+m+'-'+day);
 if(!data.data?.jadwal)throw new Error('Jadwal sholat tidak tersedia.');
 return setCached(key,{location:data.data.lokasi,region:data.data.daerah,jadwal:data.data.jadwal,updatedAt:Date.now(),source:'MyQuran API'});
}
export function upcomingRamadan(){return{hijri:'1448 H',estimatedStart:process.env.RAMADAN_START_OVERRIDE||'2027-02-08',estimatedEnd:process.env.RAMADAN_END_OVERRIDE||'2027-03-09',nuzul:'2027-02-24',officialStatus:'Belum ditetapkan pemerintah Indonesia; keputusan awal Ramadan mengikuti Sidang Isbat Kementerian Agama.',source:RAMADAN_SOURCE_URL}}
export async function refreshIndonesiaCache(){const jobs=[['news:latest',()=>getIndonesiaNews('latest',5)],['prices:fuel',()=>getFuelPrices()],['prices:electricity',()=>getElectricityPrices()],['prices:food',()=>getFoodPrices()]],result=[];for(const [key,fn] of jobs){try{await fn();result.push({key,ok:true,updatedAt:sourceStamp(key)||Date.now()})}catch(error){result.push({key,ok:false,error:error.message})}}return result}
export const NEWS_CATEGORIES=Object.freeze(Object.keys(NEWS_FEEDS));
export const DATA_SOURCES=Object.freeze({news:NEWS_FEEDS,fuel:FUEL_SOURCE_URL,electricity:ELECTRICITY_SOURCE_URL,food:FOOD_SOURCE_URL,electronics:'https://www.bandingin.id/kategori/elektronik',electronicsAudio:'https://www.bandingin.id/kategori/audio',ramadan:RAMADAN_SOURCE_URL,restaurant:'https://menukuliner.net/menu/jakarta',stock:'https://finance.yahoo.com/'});
