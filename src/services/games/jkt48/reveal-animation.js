import {rarityInfo} from './index.js';

const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const frame=(title,description,color)=>({
 title,description,color,timestamp:new Date().toISOString(),
 author:{name:'BOT NARARYA GROUB'},
 footer:{text:'PT NARARYA JAYA UTAMA GROUB - All Right Reserved'}
});

const REVEAL_PROFILES={
 common:{
  intro:650,scan:650,reveal:700,final:0,
  frames:[['🔒 **CARD SEALED**','Rarity sedang dihitung...'],['🔍 **CARD SCANNING**','Menganalisis kartu...'],['⚪ **COMMON**','Kartu terbuka.']]
 },
 uncommon:{
  intro:700,scan:700,reveal:750,final:0,
  frames:[['🔒 **CARD SEALED**','Rarity sedang dihitung...'],['🔍 **CARD SCANNING**','Menganalisis kartu...'],['✨ **SIGNAL FOUND**','Ada sesuatu di dalam kartu...'],['🟢 **UNCOMMON**','Kartu terbuka!']]
 },
 rare:{
  intro:750,scan:750,reveal:800,final:0,
  frames:[['🔒 **CARD SEALED**','Rarity sedang dihitung...'],['🔍 **CARD SCANNING**','Menganalisis kartu...'],['✨ **ENERGY DETECTED**','Kekuatan kartu meningkat...'],['💫 **RARITY LOCKED**','Hampir terbuka...'],['🔵 **RARE**','Kartu terbuka!']]
 },
 epic:{
  intro:800,scan:800,reveal:850,final:250,
  frames:[['🔒 **CARD SEALED**','Rarity sedang dihitung...'],['🔍 **CARD SCANNING**','Menganalisis kartu...'],['✨ **ENERGY DETECTED**','Gelombang energi semakin kuat...'],['💥 **CARD SURGE**','Kartu bergetar hebat...'],['🌀 **RIFT OPENING**','Rarity tinggi terdeteksi...'],['🟣 **EPIC**','Kartu terbuka!!']]
 },
 legendary:{
  intro:850,scan:850,reveal:900,final:350,
  frames:[['🔒 **CARD SEALED**','Rarity sedang dihitung...'],['🔍 **CARD SCANNING**','Menganalisis kartu...'],['✨ **LEGENDARY SIGNAL**','Sinyal luar biasa terdeteksi...'],['⚡ **POWER SURGE**','Energi kartu melonjak!'],['🔥 **CARD OVERLOAD**','Segel kartu mulai pecah...'],['👑 **LEGENDARY AURA**','Aura legendaris muncul...'],['🟠 **LEGENDARY**','KARTU TERBUKA!!!']]
 },
 mythic:{
  intro:900,scan:900,reveal:950,final:450,
  frames:[['🔒 **CARD SEALED**','Rarity sedang dihitung...'],['🔍 **CARD SCANNING**','Menganalisis kartu...'],['🌌 **MYTHIC SIGNAL**','Sinyal sangat langka terdeteksi...'],['⚡ **ENERGY SPIKE**','Energi melonjak drastis!'],['💥 **SYSTEM WARNING**','Tekanan rarity sangat tinggi...'],['🔥 **MYTHIC CHARGE**','Segel kedua pecah...'],['🌠 **CELESTIAL REVEAL**','Cahaya memenuhi kartu...'],['🔴 **MYTHIC**','KARTU MYTHIC TERBUKA!!!']]
 },
 secret:{
  intro:1000,scan:1000,reveal:1100,final:700,
  frames:[['🔒 **CARD SEALED**','Rarity sedang dihitung...'],['🔍 **CARD SCANNING**','Menganalisis kartu...'],['🛰️ **ANOMALY DETECTED**','Data kartu tidak biasa...'],['🌌 **UNKNOWN ENERGY**','Sistem tidak dapat menentukan rarity...'],['⚠️ **SYSTEM OVERLOAD**','Energi kartu melampaui batas...'],['💥 **FIRST SEAL BROKEN**','Satu segel telah pecah...'],['✨ **SECOND SEAL BROKEN**','Kartu mulai memancarkan cahaya...'],['🌠 **SECRET SIGNAL**','Sinyal yang hampir tidak pernah muncul...'],['🌈 **FINAL SEAL**','Seluruh segel kartu terbuka...'],['🌈 **SECRET**','SECRET CARD TERUNGKAP!!!']]
 }
};

function profileFor(rarity){
 return REVEAL_PROFILES[rarity]||REVEAL_PROFILES.common;
}

async function animate(send,edit,{title='🎴 Card Reveal',prefix='',rarity,finalDescription,finalImage=null}){
 const info=rarityInfo[rarity]||rarityInfo.common;
 const profile=profileFor(rarity);
 const frames=profile.frames;
 let message=await send({
  embeds:[frame(title+' • Ⅰ',prefix+frames[0][0]+'\\n\\n'+frames[0][1],0x475569)]
 });
 for(let index=1;index<frames.length;index++){
  const [headline,body]=frames[index];
  const delay=index===1?profile.intro:(index===frames.length-1?profile.final:profile.reveal);
  await wait(delay);
  await edit(message,{embeds:[frame(title+' • '+(index+1),prefix+headline+'\\n\\n'+body,index===frames.length-1?info.color:0x64748B)]});
 }
 const final=frame(
  title+' • '+info.emoji+' '+info.label,
  finalDescription||'🎴 Kartu berhasil dibuka.',
  info.color
 );
 if(finalImage)final.image={url:finalImage};
 return edit(message,{embeds:[final]});
}

export function getRevealDuration(rarity){
 const profile=profileFor(rarity);
 const frameDelay=(profile.frames.length-2)*profile.reveal;
 return profile.intro+profile.scan+Math.max(0,frameDelay)+profile.final;
}

export async function revealAnimation(interaction,opts={}){
 return animate(
  payload=>interaction.reply({...payload,ephemeral:opts.ephemeral,fetchReply:true}),
  (_message,payload)=>interaction.editReply(payload),
  opts
 );
}

export async function revealChannel(channel,opts={}){
 return animate(
  payload=>channel.send(payload),
  (message,payload)=>message.edit(payload),
  opts
 );
}
