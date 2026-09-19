import crypto from 'node:crypto';
import { fetch } from 'undici';
import * as cheerio from 'cheerio';

const UA=process.env.SCRAPER_USER_AGENT||'NararyaBotDiscord/2.0 (+public-feed-monitor)';
const timeout=Number(process.env.SCRAPER_TIMEOUT_MS||15000);
async function html(url){
 const res=await fetch(url,{headers:{'user-agent':UA,accept:'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'},signal:AbortSignal.timeout(timeout)});
 if(!res.ok)throw new Error('HTTP '+res.status);
 return await res.text();
}
const key=url=>crypto.createHash('sha256').update(url).digest('hex');
const abs=(base,href)=>{try{return new URL(href,base).href}catch{return null}};
const norm=(title,url,description='',image=null,publishedAt=Date.now())=>({key:key(url),title:title.replace(/\s+/g,' ').trim().slice(0,240),url,description:description.replace(/\s+/g,' ').trim().slice(0,900),image,publishedAt});
function anchors(body,base,filter,limit=30){
 const $=cheerio.load(body),out=[],seen=new Set();
 $('a[href]').each((_,el)=>{
  const title=$(el).text().replace(/\s+/g,' ').trim(),url=abs(base,$(el).attr('href'));
  if(!url||title.length<5||seen.has(url)||!filter(url,title))return;
  seen.add(url);
  const image=$(el).find('img').attr('src')?abs(base,$(el).find('img').attr('src')):null;
  out.push(norm(title,url,title,image));
 });
 return out.slice(0,limit);
}
export async function scrapeJkt48Web(url){
 const body=await html(url);
 const section=url.includes('/events')?'event':url.includes('/news')?'news':url.includes('/theater')?'theater':'official';
 return anchors(body,url,(href)=>href.includes('jkt48.com')&&(section==='official'||href.includes('/events')||href.includes('/news')||href.includes('/theater')),40).map(x=>({...x,sourceType:section}));
}
export async function scrapePublicProfile(url,platform){
 const body=await html(url),$=cheerio.load(body);
 const title=$('meta[property="og:title"]').attr('content')||$('title').text()||platform+' update';
 const description=$('meta[property="og:description"]').attr('content')||$('meta[name="description"]').attr('content')||'';
 const image=$('meta[property="og:image"]').attr('content')||null;
 return [norm(title,url,description,image)];
}
export async function scrapeYoutubeRss(url){
 const id=new URL(url).searchParams.get('channel_id');
 if(!id)return scrapePublicProfile(url,'YouTube');
 const res=await fetch('https://www.youtube.com/feeds/videos.xml?channel_id='+encodeURIComponent(id),{headers:{'user-agent':UA},signal:AbortSignal.timeout(timeout)});
 if(!res.ok)throw new Error('YouTube RSS HTTP '+res.status);
 const xml=await res.text(),out=[];
 for(const m of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)){
  const b=m[1],video=b.match(/<yt:videoId>([^<]+)/)?.[1],title=b.match(/<title>([\s\S]*?)<\/title>/)?.[1],published=b.match(/<published>([^<]+)/)?.[1],link=b.match(/<link rel="alternate" href="([^"]+)/)?.[1];
  if(video&&title&&link)out.push(norm(title,link,title,'https://i.ytimg.com/vi/'+video+'/hqdefault.jpg',published?Date.parse(published):Date.now()));
 }
 return out;
}
export async function scrapeSource(source){
 const u=source.url.toLowerCase();
 if(source.kind==='jkt48-web')return scrapeJkt48Web(source.url);
 if(source.kind==='youtube'&&u.includes('channel_id='))return scrapeYoutubeRss(source.url);
 return scrapePublicProfile(source.url,source.kind||'public');
}
