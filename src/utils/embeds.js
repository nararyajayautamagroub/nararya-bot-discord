import {EmbedBuilder} from "discord.js";

const EMBED_RED=0xD71920;

export const baseEmbed=(title,description="")=>new EmbedBuilder()
  .setColor(EMBED_RED)
  .setTitle(title)
  .setDescription(description)
  .setTimestamp()
  .setFooter({text:"Nararya Bot Discord"});

export const notificationEmbed=(item,source)=>{
  const embed=baseEmbed("📢 "+source.name,item.title).setURL(item.url);
  if(item.thumbnail)embed.setThumbnail(item.thumbnail);
  return embed.addFields(
    {name:"Sumber",value:String(source.name),inline:true},
    {name:"Waktu",value:item.publishedAt?"<t:"+Math.floor(item.publishedAt/1000)+":R>":"Tidak tersedia",inline:true}
  );
};