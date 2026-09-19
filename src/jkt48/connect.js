import {request} from 'undici';
const BASE=process.env.JKT48CONNECT_BASE_URL||'https://v2.jkt48connect.com/api/jkt48';
const KEY=process.env.JKT48CONNECT_API_KEY||'';
export function configured(){return Boolean(KEY)}
async function get(path,params={}){
 if(!KEY)throw new Error('JKT48CONNECT_API_KEY belum dikonfigurasi');
 const u=new URL(BASE.replace(/\/$/,'')+'/'+path.replace(/^\//,''));
 for(const [k,v] of Object.entries(params))if(v!==undefined&&v!==null)u.searchParams.set(k,String(v));
 u.searchParams.set('apikey',KEY);
 const res=await request(u,{method:'GET',headers:{accept:'application/json','user-agent':'Nararya-Bot-Discord/1.0'}});
 if(res.statusCode<200||res.statusCode>=300)throw new Error('JKT48Connect HTTP '+res.statusCode);
 return res.body.json();
}
function list(data){return data?.data||data?.events||data?.theater||data?.birthdays||data?.live||data?.streams||data?.news||data?.results||[]}
export async function events(params={}){return list(await get('events',params))}
export async function theater(params={}){return list(await get('theater',params))}
export async function birthdays(params={}){return list(await get('birthdays',params))}
export async function news(params={}){return list(await get('news',params))}
export async function live(platform){return list(await get(platform))}
export async function recentLive(params={}){return list(await get('recent',params))}
export async function allLive(){const ps=['idn','showroom','youtube'];const rs=await Promise.allSettled(ps.map(x=>live(x)));return rs.flatMap((r,i)=>r.status==='fulfilled'?r.value.map(v=>({...v,platform:ps[i]})):[])}
export function dateOf(x){return x?.start_at||x?.start_time||x?.date_time||x?.datetime||x?.date||x?.scheduled_at||x?.published_at||null}
export function titleOf(x){return x?.title||x?.name||x?.show_name||x?.setlist||x?.room_name||'JKT48'}
export function memberName(x){return x?.member?.name||x?.member_name||'JKT48'}
