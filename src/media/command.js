import fs from 'node:fs/promises';
import path from 'node:path';
import {AttachmentBuilder} from 'discord.js';
import {VIDEO_FORMATS,AUDIO_FORMATS} from './utils.js';

const cleanup=async file=>{
 try{await fs.rm(file,{force:true});}catch{}
};

function sourceFrom(i){
 const url=i.options.getString('url');
 const attachment=i.options.getAttachment('file');
 if(!url&&!attachment)throw new Error('Provide either a public URL or a Discord attachment.');
 return {url,attachment};
}

function formatSize(bytes){
 if(bytes<1024*1024)return (bytes/1024).toFixed(1)+' KB';
 return (bytes/(1024*1024)).toFixed(2)+' MB';
}

function resultEmbed(embed,result,title){
 return embed(title,'Job ID: '+result.jobId+'\\nOutput size: **'+formatSize(result.size)+'**\\n\\nThe processed file is attached to this response.');
}

export async function handleMediaCommand(i,{mediaService,embed,colors}){
 const sub=i.options.getSubcommand(true);
 const guildId=i.guild.id;
 const userId=i.user.id;
 const ctx={guildId,userId};

 if(sub==='settings'){
  const resolution=i.options.getString('resolution');
  const videoFormat=i.options.getString('video_format');
  const audioFormat=i.options.getString('audio_format');
  if(!resolution&&!videoFormat&&!audioFormat){
   const s=mediaService.getSettings(guildId,userId);
   return i.reply({embeds:[embed('Media Settings',
    'Default resolution: **'+s.resolution+'**\\nVideo format: **'+s.video_format+'**\\nAudio format: **'+s.audio_format+'**',
    {color:colors.info})]});
  }
  mediaService.setSettings(guildId,userId,{resolution:resolution||'1080p',video_format:videoFormat||'mp4',audio_format:audioFormat||'mp3'});
  const s=mediaService.getSettings(guildId,userId);
  return i.reply({embeds:[embed('Media Settings Updated',
   'Default resolution: **'+s.resolution+'**\\nVideo format: **'+s.video_format+'**\\nAudio format: **'+s.audio_format+'**',
   {color:colors.success})]});
 }

 await i.deferReply();

 try{
  if(['video','audio','image'].includes(sub)){
   const source=i.options.getString('url',true);
   const settings=mediaService.getSettings(guildId,userId);
   const kind=sub;
   const resolution=kind==='video'?(i.options.getString('resolution')||settings.resolution):'best';
   let format=kind==='video'?(i.options.getString('format')||settings.video_format):kind==='audio'?(i.options.getString('format')||settings.audio_format):'auto';
   if(kind==='audio'&&!AUDIO_FORMATS.includes(format))throw new Error('Unsupported audio format: '+format);
   if(kind==='video'&&!VIDEO_FORMATS.includes(format))throw new Error('Unsupported video format: '+format);
   const result=await mediaService.download({url:source,kind,resolution,format},{...ctx});
   await i.editReply({
    embeds:[resultEmbed(embed,result,'Media '+kind.charAt(0).toUpperCase()+kind.slice(1)+' Download')],
    files:[new AttachmentBuilder(result.path)]
   });
   await cleanup(path.dirname(result.path));
   return;
  }

  const source=sourceFrom(i);

  if(sub==='vocals'||sub==='instrumental'){
   const settings=mediaService.getSettings(guildId,userId);
   const format=i.options.getString('format')||settings.audio_format;
   if(!AUDIO_FORMATS.includes(format))throw new Error('Unsupported audio format: '+format);
   const result=await mediaService.removeVocals({...source,format,kind:'video'},{...ctx});
   await i.editReply({embeds:[resultEmbed(embed,result,'Vocal Removal')],files:[new AttachmentBuilder(result.path)]});
   await cleanup(path.dirname(result.path));
   return;
  }

  if(sub==='background'){
   const mediaType=i.options.getString('type',true);
   const result=await mediaService.removeBackground({...source,mediaType,kind:mediaType},{...ctx});
   await i.editReply({embeds:[resultEmbed(embed,result,'Background Removal')],files:[new AttachmentBuilder(result.path)]});
   await cleanup(path.dirname(result.path));
   return;
  }

  if(sub==='watermark'){
   const mediaType=i.options.getString('type',true);
   const rect={
    x:i.options.getInteger('x',true),
    y:i.options.getInteger('y',true),
    width:i.options.getInteger('width',true),
    height:i.options.getInteger('height',true)
   };
   if(rect.x<0||rect.y<0||rect.width<=0||rect.height<=0)throw new Error('Watermark coordinates must be non-negative and width/height must be greater than zero.');
   const result=await mediaService.removeWatermark({...source,mediaType,kind:mediaType,...rect},{...ctx});
   await i.editReply({embeds:[resultEmbed(embed,result,'Watermark Removal')],files:[new AttachmentBuilder(result.path)]});
   await cleanup(path.dirname(result.path));
   return;
  }

  throw new Error('Unknown media operation.');
 }catch(error){
  return i.editReply({embeds:[embed('Media Operation Failed',String(error?.message||error),{color:colors.error})]});
 }
}
