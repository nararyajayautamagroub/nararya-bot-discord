import {rarityInfo} from './index.js';

const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

export async function revealAnimation(interaction,{title='🎴 Card Reveal',prefix='',rarity,finalDescription,finalImage=null,ephemeral=false}){
 const info=rarityInfo[rarity]||rarityInfo.common;
 const make=(titleText,description,color)=>({title:titleText,description,color,timestamp:new Date().toISOString(),footer:{text:'PT NARARYA JAYA UTAMA GROUB - All Right Reserved'}});
 await interaction.reply({embeds:[make(title+' • Ⅰ',prefix+'🔒 **CARD SEALED**\\n\\nRarity sedang dihitung...',0x475569)],ephemeral,fetchReply:true});
 await wait(600);
 await interaction.editReply({embeds:[make(title+' • Ⅱ',prefix+'✨ **CARD SCANNING**\\n\\n🎴 Sistem sedang membuka kartu...',0x64748B)]});
 await wait(600);
 await interaction.editReply({embeds:[make(title+' • Ⅲ',prefix+info.emoji+' **RARITY DETECTED**\\n\\n'+info.label,info.color)]});
 await wait(650);
 const final=make(title+' • '+info.emoji+' '+info.label,finalDescription,info.color);
 if(finalImage)final.image={url:finalImage};
 return interaction.editReply({embeds:[final]});
}
