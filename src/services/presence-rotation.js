import {ActivityType} from "discord.js";
function parse(raw,fallback){try{const list=JSON.parse(raw||"[]");if(Array.isArray(list)&&list.length)return list.map(String).filter(Boolean).slice(0,20);}catch{}return [fallback||"Nararya Bot"];}
export function createPresenceRotation({client,botControl,intervalMs=45000}={}){
 let timer=null,index=0;
 const apply=async()=>{if(!client?.user)return;const settings=Object.fromEntries((botControl?.settings?.()||[]).map(x=>[x.key,x.value]));const list=parse(settings.activity_rotation,settings.activity||"Nararya Bot");const name=list[index%list.length];index=(index+1)%list.length;client.user.setPresence({status:settings.maintenance==="true"?"dnd":"online",activities:[{name,type:ActivityType.Playing}]});};
 return {start:async()=>{if(timer)return;await apply().catch(()=>{});timer=setInterval(()=>apply().catch(()=>{}),Math.max(15000,Number(intervalMs)||45000));},stop:()=>{if(timer)clearInterval(timer);timer=null;},apply};
}
