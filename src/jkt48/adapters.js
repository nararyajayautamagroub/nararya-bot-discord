import * as cheerio from 'cheerio';
import {stableHash,safePublicUrl,cleanText,parseDate,uniqueByUrl} from '../tools/scraper-toolbox.js';

const UA=process.env.SCRAPER_USER_AGENT||'NararyaBotDiscord/3.0 (+public-feed-monitor)';
const TIMEOUT_MS=Math.max(3000,Number(process.env.SCRAPER_TIMEOUT_MS||15000));
const MAX_ITEMS=Math.min(100,Math.max(5,Number(process.env.SCRAPER_MAX_ITEMS||40)));
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

function hash(value){
 return stableHash(value);
}

function absolute(base,value){return safePublicUrl(value,base)}

function clean(value,max=900){return cleanText(value,max)}

function dateValue(value){
 return parseDate(value);
}

function item({title,url,description='',image=null,publishedAt=Date.now(),sourceType='public',author=null}){
 const safeUrl=absolute(url,url);
 if(!safeUrl)throw new Error('URL item tidak valid');
 return {
  key:hash(safeUrl),
  title:clean(title,240)||'JKT48 update',
  url:safeUrl,
  description:clean(description,900),
  image:image?absolute(safeUrl,image):null,
  publishedAt:dateValue(publishedAt),
  sourceType,
  author:clean(author,120)
 };
}

async function request(url,{accept='text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',timeout=TIMEOUT_MS}={}){
 let last;
 for(let attempt=0;attempt<3;attempt++){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeout);
  try{
   const response=await fetch(url,{headers:{'user-agent':UA,accept},redirect:'follow',signal:controller.signal});
   const body=await response.text();
   if(!response.ok)throw new Error('HTTP '+response.status+' '+response.statusText+' for '+url);
   return {response,body};
  }catch(error){
   last=error;
   if(attempt<2)await sleep(500*(2**attempt));
  }finally{clearTimeout(timer)}
 }
 throw last||new Error('Request gagal');
}

function unique(items){
 const seen=new Set();
 return items.filter(x=>x?.url&&!seen.has(x.url)&&seen.add(x.url)).slice(0,MAX_ITEMS);
}

function meta($,name){
 return $('meta[property="'+name+'"]').attr('content')||
   $('meta[name="'+name+'"]').attr('content')||'';
}

function parseJsonLd($,base,sourceType){
 const out=[];
 $('script[type="application/ld+json"]').each((_,el)=>{
  try{
   const raw=$(el).text();
   const parsed=JSON.parse(raw);
   const rows=Array.isArray(parsed)?parsed:[parsed];
   for(const row of rows){
    if(!row||typeof row!=='object')continue;
    if(row.itemListElement){
     for(const entry of row.itemListElement){
      const target=entry?.item||entry;
      const url=typeof target==='string'?target:target?.url;
      const title=typeof target==='object'?(target.name||target.headline):entry?.name;
      if(url&&title)out.push(item({title,url:entry?.name||title,url: absolute(base,url),description:target?.description||'',image:target?.image,publishedAt:target?.datePublished,sourceType}));
     }
    }else if(row.url&&(row.headline||row.name)){
     out.push(item({title:row.headline||row.name,url:absolute(base,row.url),description:row.description,image:row.image,publishedAt:row.datePublished||row.dateModified,sourceType,author:row.author?.name||row.author}));
    }
   }
  }catch{}
 });
 return out;
}

function parseAnchors($,base,filter,sourceType){
 const out=[];
 $('a[href]').each((_,el)=>{
  const href=$(el).attr('href');
  const url=absolute(base,href);
  const title=clean($(el).attr('aria-label')||$(el).text()||$(el).attr('title'),240);
  if(!url||!title||title.length<4||!filter(url,title,el))return;
  const card=$(el).closest('article,li,[role="article"],div').first();
  const image=card.find('img').first().attr('src')||$(el).find('img').first().attr('src')||null;
  const published=card.find('time').attr('datetime')||card.find('time').text();
  const description=clean(card.text(),900);
  out.push(item({title,url,description,image,publishedAt:published,sourceType}));
 });
 return uniqueByUrl(out,MAX_ITEMS);
}

export async function scrapeHtmlPage(url,{filter=()=>true,sourceType='public'}={}){
 const {body}=await request(url);
 const $=cheerio.load(body);
 const json=parseJsonLd($,url,sourceType);
 const anchors=parseAnchors($,url,filter,sourceType);
 return uniqueByUrl([...json,...anchors],MAX_ITEMS);
}

export async function scrapeJkt48Web(url){
 const section=url.includes('/events')?'event':url.includes('/news')?'news':url.includes('/theater')?'theater':'official';
 const allowed=(href,title)=>{
  if(!href.includes('jkt48.com'))return false;
  if(section==='official')return /jkt48\.com\/(events|news|theater|schedule|members|about|discography|profile|blog)/i.test(href);
  return href.includes('/'+section);
 };
 return scrapeHtmlPage(url,{filter:allowed,sourceType:'jkt48-'+section});
}

function youtubeIdFromHtml(body){
 const patterns=[
  /"channelId":"(UC[a-zA-Z0-9_-]{10,})"/,
  /"externalId":"(UC[a-zA-Z0-9_-]{10,})"/,
  /\/channel\/(UC[a-zA-Z0-9_-]{10,})/
 ];
 for(const re of patterns){const m=body.match(re);if(m)return m[1]}
 return null;
}

async function resolveYoutubeChannelId(url){
 const explicit=new URL(url).searchParams.get('channel_id');
 if(explicit)return explicit;
 const {body}=await request(url);
 return youtubeIdFromHtml(body);
}

export async function scrapeYoutubeRss(url){
 const channelId=await resolveYoutubeChannelId(url);
 if(!channelId)throw new Error('YouTube channel ID tidak ditemukan dari halaman publik');
 const feed='https://www.youtube.com/feeds/videos.xml?channel_id='+encodeURIComponent(channelId);
 const {body}=await request(feed,{accept:'application/atom+xml,application/xml,text/xml'});
 const out=[];
 for(const match of body.matchAll(/<entry>([\s\S]*?)<\/entry>/g)){
  const b=match[1];
  const id=b.match(/<yt:videoId>([^<]+)/)?.[1];
  const title=b.match(/<title>([\s\S]*?)<\/title>/)?.[1];
  const published=b.match(/<published>([^<]+)/)?.[1];
  const updated=b.match(/<updated>([^<]+)/)?.[1];
  const link=b.match(/<link[^>]+rel=["']alternate["'][^>]+href=["']([^"']+)/)?.[1]||
   (id?'https://www.youtube.com/watch?v='+id:null);
  if(!id||!title||!link)continue;
  out.push(item({title:decodeXml(title),url:link,description:decodeXml(title),image:'https://i.ytimg.com/vi/'+id+'/hqdefault.jpg',publishedAt:published||updated,sourceType:'youtube'}));
 }
 return unique(out);
}

function decodeXml(value){
 return String(value||'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
}

function socialFilter(platform){
 const patterns={
  instagram:/instagram\.com\/(p|reel|tv|stories)\//i,
  tiktok:/tiktok\.com\/@[^/]+\/video\//i,
  x:/(?:x|twitter)\.com\/[^/]+\/status\//i,
  threads:/threads\.net\/@?[^/]+\/post\//i
 };
 return patterns[platform]||(()=>true);
}

export async function scrapePublicProfile(url,platform='public'){
 const {body}=await request(url);
 const $=cheerio.load(body);
 const title=meta($,'og:title')||$('title').first().text()||platform+' update';
 const description=meta($,'og:description')||meta($,'description')||'';
 const image=meta($,'og:image')||null;
 const profile=item({title,url,description,image,sourceType:platform});
 const links=parseAnchors($,url,(href)=>socialFilter(platform)(href),platform);
 const json=parseJsonLd($,url,platform);
 return uniqueByUrl([...links,...json,profile],MAX_ITEMS);
}

export async function scrapeInstagram(url){return scrapePublicProfile(url,'instagram')}
export async function scrapeTikTok(url){return scrapePublicProfile(url,'tiktok')}
export async function scrapeX(url){return scrapePublicProfile(url,'x')}
export async function scrapeThreads(url){return scrapePublicProfile(url,'threads')}

export async function scrapeMarketplace(url,platform){
 const {body}=await request(url);
 const $=cheerio.load(body);
 const json=parseJsonLd($,url,platform);
 const anchors=parseAnchors($,url,(href,title)=>/product|produk|item|catalog|shop|detail/i.test(href+' '+title),platform);
 return uniqueByUrl([...json,...anchors],MAX_ITEMS);
}

export async function scrapeLivePage(url,platform='public'){
 const {body}=await request(url);
 const $=cheerio.load(body);
 const lower=body.toLowerCase();
 const liveSignals=[
  /"islivenow"\s*:\s*true/i,
  /"islivecontent"\s*:\s*true/i,
  /"is_live"\s*:\s*true/i,
  /"live_status"\s*:\s*(?:1|true)/i,
  /"isLive"\s*:\s*true/i
 ];
 const hasStructuredLive=liveSignals.some(re=>re.test(body));
 const candidates=parseAnchors($,url,(href,title)=>/live|stream|on.?air|siaran/i.test(href+' '+title),platform);
 const title=clean(meta($,'og:title')||$('title').first().text()||platform+' live',240);
 const image=meta($,'og:image')||null;
 if(!hasStructuredLive&&!candidates.length)return [];
 if(candidates.length)return candidates.map(x=>({...x,live:true})).slice(0,MAX_ITEMS);
 return [item({title,url,description:meta($,'og:description')||'Live terdeteksi dari halaman publik.',image,publishedAt:Date.now(),sourceType:platform})].map(x=>({...x,live:true}));
}

export async function scrapeSource(source){
 const kind=String(source.kind||'public').toLowerCase();
 const url=source.url;
 if(!url)throw new Error('Feed URL kosong');
 if(kind==='jkt48-web'||kind==='jkt48-events'||kind==='jkt48-news'||kind==='jkt48-theater')return scrapeJkt48Web(url);
 if(kind==='youtube'||kind==='youtube-channel'||kind==='jkt48-tv'||kind==='costume-youtube')return scrapeYoutubeRss(url);
 if(kind==='instagram'||kind==='instagram-member'||kind==='costume-instagram')return scrapeInstagram(url);
 if(kind==='tiktok'||kind==='tiktok-member'||kind==='costume-tiktok')return scrapeTikTok(url);
 if(kind==='x'||kind==='x-member'||kind==='twitter'||kind==='twitter-member')return scrapeX(url);
 if(kind==='threads'||kind==='threads-member')return scrapeThreads(url);
 if(kind==='tokopedia')return scrapeMarketplace(url,'tokopedia');
 if(kind==='shopee')return scrapeMarketplace(url,'shopee');
 return scrapePublicProfile(url,kind);
}
