function splitEnv(name){
 return String(process.env[name]||'').split(/[|,\n]+/).map(x=>x.trim()).filter(Boolean);
}

function jsonEnv(name){
 try{
  const value=process.env[name];
  if(!value)return [];
  const parsed=JSON.parse(value);
  return Array.isArray(parsed)?parsed:[];
 }catch{return []}
}

function tuple(id,label,kind,url){return [id,label,kind,url]}

const base=[
 tuple('jkt48-web','JKT48 Website','jkt48-web','https://jkt48.com/'),
 tuple('jkt48-events','JKT48 Events','jkt48-events','https://jkt48.com/events'),
 tuple('jkt48-news','JKT48 News','jkt48-news','https://jkt48.com/news'),
 tuple('jkt48-theater','JKT48 Theater','jkt48-theater','https://jkt48.com/theater'),
 tuple('idn-jkt48','IDN JKT48 Live','idn','https://www.idn.app/'),
 tuple('showroom-jkt48','SHOWROOM JKT48','showroom','https://www.showroom-live.com/'),
 tuple('youtube-jkt48','YouTube JKT48','youtube-channel','https://www.youtube.com/@JKT48'),
 tuple('youtube-jkt48-tv','YouTube JKT48 TV','jkt48-tv','process.env.JKT48_TV_URL||'https://www.youtube.com/@JKT48TV'),
 tuple('instagram-jkt48','Instagram JKT48','instagram','https://www.instagram.com/jkt48/'),
 tuple('tiktok-jkt48','TikTok JKT48','tiktok','https://www.tiktok.com/@jkt48'),
 tuple('x-jkt48','X/Twitter JKT48','x','https://x.com/officialJKT48'),
 tuple('threads-jkt48','Threads JKT48','threads','https://www.threads.net/@officialJKT48'),
 tuple('tokopedia-jkt48','Tokopedia JKT48','tokopedia','https://www.tokopedia.com/'),
 tuple('shopee-jkt48','Shopee JKT48','shopee','https://shopee.co.id/'),
];

const costumeYoutube=splitEnv('JKT48_COSTUME_YOUTUBE_URLS');
const costumeInstagram=splitEnv('JKT48_COSTUME_INSTAGRAM_URLS');
const costumeTiktok=splitEnv('JKT48_COSTUME_TIKTOK_URLS');
const memberSocials=jsonEnv('JKT48_MEMBER_SOCIAL_URLS');

for(const [index,url] of costumeYoutube.entries())base.push(tuple('costume-youtube-'+(index+1),'YouTube Costume '+(index+1),'costume-youtube',url));
for(const [index,url] of costumeInstagram.entries())base.push(tuple('costume-instagram-'+(index+1),'Instagram Costume '+(index+1),'costume-instagram',url));
for(const [index,url] of costumeTiktok.entries())base.push(tuple('costume-tiktok-'+(index+1),'TikTok Costume '+(index+1),'costume-tiktok',url));

for(const row of memberSocials){
 if(!row||typeof row!=='object'||!row.url)continue;
 const platform=String(row.platform||'social').toLowerCase();
 const member=String(row.member||row.name||'Member').trim();
 const safe=member.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40)||'member';
 base.push(tuple('member-'+platform+'-'+safe,platform.toUpperCase()+' '+member,platform+'-member',row.url));
}

export const DEFAULT_SOURCES=Object.freeze(base);

export const SOURCE_KINDS=Object.freeze([
 'jkt48-web','jkt48-events','jkt48-news','jkt48-theater',
 'idn','showroom','youtube-channel','jkt48-tv','instagram','instagram-member',
 'tiktok','tiktok-member','x','x-member','twitter','twitter-member',
 'threads','threads-member','tokopedia','shopee',
 'costume-youtube','costume-instagram','costume-tiktok'
]);

export function getDefaultSource(id){
 return DEFAULT_SOURCES.find(x=>x[0]===id)||null;
}

export function sourceSummary(){
 return DEFAULT_SOURCES.map(([id,label,kind,url])=>({id,label,kind,url}));
}
