import {rarityInfo} from './index.js';

const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const frame=(title,description,color)=>({title,description,color,timestamp:new Date().toISOString(),footer:{text:'PT NARARYA JAYA UTAMA GROUB - All Right Reserved'}});

async function animate(edit,send,title,prefix,rarity,finalDescription,finalImage=null){
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

export async function revealAnimation(interaction,opts){
 return animate(
  message=>interaction.editReply(message),
  payload=>interaction.reply({...payload,ephemeral:opts.ephemeral,fetchReply:true}),
  opts.title||'🎴 Card Reveal',opts.prefix||'',opts.rarity,opts.finalDescription||'',opts.finalImage||null
 );
}

export async function revealChannel(channel,opts){
 return animate(
  message=>message.edit.bind(message),
  payload=>channel.send(payload),
  opts.title||'🎴 Card Reveal',opts.prefix||'',opts.rarity,opts.finalDescription||'',opts.finalImage||null
 );
}
