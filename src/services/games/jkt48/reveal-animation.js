import {rarityInfo} from './index.js';

const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const frame=(title,description,color)=>({title,description,color,timestamp:new Date().toISOString(),footer:{text:'PT NARARYA JAYA UTAMA GROUB - All Right Reserved'}});

async function animate(send,edit,{title='🎴 Card Reveal',prefix='',rarity,finalDescription,finalImage=null}){
 const info=rarityInfo[rarity]||rarityInfo.common;
 const message=await send({embeds:[frame(title+' • Ⅰ',prefix+'🔒 **CARD SEALED**\n\nRarity sedang dihitung...',0x475569)]});
 await wait(600);
 await edit(message,{embeds:[frame(title+' • Ⅱ',prefix+'✨ **CARD SCANNING**\n\n🎴 Sistem sedang membuka kartu...',0x64748B)]});
 await wait(600);
 await edit(message,{embeds:[frame(title+' • Ⅲ',prefix+info.emoji+' **RARITY DETECTED**\n\n'+info.label,info.color)]});
 await wait(650);
 const final=frame(title+' • '+info.emoji+' '+info.label,finalDescription,info.color);
 if(finalImage)final.image={url:finalImage};
 return edit(message,{embeds:[final]});
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
