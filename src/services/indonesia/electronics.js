import * as cheerio from 'cheerio';
import {requestText} from '../scrapers/http.js';

export const ELECTRONICS_SOURCES=Object.freeze({
 electronics:'https://www.bandingin.id/kategori/elektronik',
 audio:'https://www.bandingin.id/kategori/audio'
});

const CATEGORY_ALIASES=Object.freeze({
 all:['elektronik','audio','gadget','smartphone','laptop','tablet','tv','monitor','camera','kamera','printer','router','keyboard','mouse','storage','gaming','console','speaker','headphone','earphone'],
 smartphone:['smartphone','iphone','samsung','xiaomi','oppo','vivo','realme','poco','pixel','handphone','hp '],
 laptop:['laptop','notebook','macbook','chromebook'],
 tablet:['tablet','ipad'],
 tv:['televisi','smart tv','tv led','tv oled','android tv'],
 monitor:['monitor'],
 audio:['earphone','headphone','headset','speaker','soundbar','microphone','mikrofon','tws','audio'],
 camera:['kamera','camera','action cam','mirrorless','dslr','webcam'],
 printer:['printer','scanner'],
 router:['router','wifi','modem','access point','mesh'],
 storage:['ssd','hdd','harddisk','flashdisk','memory card','micro sd'],
 gaming:['gaming','playstation','xbox','nintendo','console','controller','joystick'],
 keyboard:['keyboard','mechanical keyboard'],
 mouse:['mouse gaming','mouse wireless','mouse'],
 smartwatch:['smartwatch','smart watch','smartband','fitness band'],
 other:['powerbank','charger','adaptor','kabel','lampu','drone','projector','proyektor']
});

function parsePrice(text){
 const cleaned=String(text||'').replace(/\u00a0/g,' ');
 const match=cleaned.match(/Rp\s*([0-9]{1,3}(?:[.,][0-9]{3})+|[0-9]{3,})/i);
 return match?Number(match[1].replace(/[.,]/g,'')):null;
}

function detectPlatform(text){
 const t=String(text||'').toLowerCase();
 if(t.includes('tokopedia'))return'Tokopedia';
 if(t.includes('shopee'))return'Shopee';
 if(t.includes('lazada'))return'Lazada';
 if(t.includes('tiktok shop'))return'TikTok Shop';
 return'Unknown';
}

function extractProductCandidates($){
 const out=[];
 const seen=new Set();
 $('a[href]').each((_,a)=>{
  const href=$(a).attr('href')||'';
  const text=$(a).text().replace(/\s+/g,' ').trim();
  const price=parsePrice($(a).parent().text())||parsePrice(text);
  if(!price||price<1000||text.length<8)return;
  const title=text.replace(/Rp\s*[0-9.,]+/ig,'').replace(/\s+/g,' ').trim();
  if(title.length<8||/^(lihat|beli|cari|semua produk|home|elektronik)$/i.test(title))return;
  const url=new URL(href,ELECTRONICS_SOURCES.electronics).toString();
  const key=title.toLowerCase()+'|'+price;
  if(seen.has(key))return;
  seen.add(key);
  const parent=$(a).parent().text().replace(/\s+/g,' ');
  out.push({title:title.slice(0,180),price,currency:'IDR',platform:detectPlatform(parent),url,source:'Bandingin.id'});
 });
 return out;
}

async function scrape(url){
 const result=await requestText(url,{timeout:15000});
 if(!result.ok)throw new Error('Electronics source HTTP '+result.status);
 const $=cheerio.load(result.text);
 const items=extractProductCandidates($).slice(0,120);
 return {items,source:url,updatedAt:Date.now(),note:'Harga adalah hasil scraping katalog publik dan dapat berubah saat checkout.'};
}

let cache=new Map();
const TTL=30*60*1000;

export async function getElectronicsPrices({category='all',query='',limit=15}={}){
 const cat=String(category||'all').toLowerCase();
 const normalizedQuery=String(query||'').trim().toLowerCase();
 const key=cat+'|'+normalizedQuery;
 const hit=cache.get(key);
 if(hit&&Date.now()-hit.updatedAt<TTL)return hit;
 const sources=cat==='audio'?[ELECTRONICS_SOURCES.audio]:[ELECTRONICS_SOURCES.electronics,ELECTRONICS_SOURCES.audio];
 const results=await Promise.allSettled(sources.map(scrape));
 const merged=results.flatMap(x=>x.status==='fulfilled'?x.value.items:[]);
 const aliases=CATEGORY_ALIASES[cat]||CATEGORY_ALIASES.all;
 let filtered=merged.filter(x=>{
  const hay=x.title.toLowerCase();
  const categoryMatch=cat==='all'||aliases.some(term=>hay.includes(term));
  const queryMatch=!normalizedQuery||hay.includes(normalizedQuery);
  return categoryMatch&&queryMatch;
 });
 const unique=[...new Map(filtered.map(x=>[x.title.toLowerCase()+'|'+x.price+'|'+x.platform,x])).values()]
   .sort((a,b)=>a.price-b.price)
   .slice(0,Math.min(25,Math.max(1,Number(limit)||15)));
 const data={items:unique,source:sources.join(' + '),updatedAt:Date.now(),category:cat,query:normalizedQuery,scanned:merged.length};
 cache.set(key,data);
 return data;
}
