import {
  findRestaurants,
  findRestaurantMenu,
  searchCachedRestaurantItems,
  refreshRestaurantCity,
  refreshRestaurantMenu,
  restaurantSourceStatus,
  restaurantDataDisclaimer,
  filterMenuItems,
    parseRestaurantOptions,
  sanitizeEmbedText,
  buildRestaurantSourceField
} from './prices.js';
import {formatRupiah,formatRange,pageSlice} from '../../tools/toolbox.js';

function asOptions(interaction){
 return {
  city:interaction.options.getString('city'),
  restaurant:interaction.options.getString('restaurant'),
  query:interaction.options.getString('query'),
  category:interaction.options.getString('category'),
  minPrice:interaction.options.getNumber('min_price'),
  maxPrice:interaction.options.getNumber('max_price'),
  page:interaction.options.getInteger('page')||1,
  limit:interaction.options.getInteger('limit')||10,
  maxPages:interaction.options.getInteger('pages')||1
 };
}

function searchLines(rows){
 return rows.map((row,index)=>{
  const range=formatRange(row.minPrice,row.maxPrice);
  const categories=row.categories?.slice(0,4).join(', ');
  return '**'+(index+1)+'. '+sanitizeEmbedText(row.name,100)+'**\n'+
    (row.address?'📍 '+sanitizeEmbedText(row.address,160)+'\n':'')+
    '💰 '+range+(categories?' • '+categories:'')+'\n'+
    '🔗 '+row.url;
 });
}

function menuLines(items){
 return items.map((row,index)=>{
  return '**'+(index+1)+'. '+sanitizeEmbedText(row.name,150)+'**'+
    '\n💰 **'+formatRupiah(row.price)+'**'+
    (row.category?' • '+sanitizeEmbedText(row.category,80):'');
 });
}

function combinedLines(rows){
 return rows.map((row,index)=>{
  return '**'+(index+1)+'. '+sanitizeEmbedText(row.restaurant_name||'Restaurant',90)+' • '+sanitizeEmbedText(row.name,110)+'**'+
    '\n💰 **'+formatRupiah(row.price)+'**'+
    (row.category?' • '+sanitizeEmbedText(row.category,70):'')+
    '\n🔗 '+row.url;
 });
}

export async function handleRestaurantPricesCommand(interaction,{db,embed}={}){
 const sub=interaction.options.getSubcommand(true);
 if(sub==='status'){
  const result=await restaurantSourceStatus();
  return interaction.reply({
   embeds:[embed(
    result.ok?'🍽️ Restaurant Price Source OK':'⚠️ Restaurant Price Source Error',
    'Source: **'+result.source+'**\nStatus HTTP: **'+result.status+'**\nURL: '+result.url+
    '\nChecked: '+new Date(result.checkedAt).toLocaleString('id-ID',{timeZone:process.env.BOT_TIMEZONE||'Asia/Jakarta'})+
    (result.error?'\nError: '+result.error:'')+
    '\n\n'+restaurantDataDisclaimer(),
    {color:result.ok?0x22C55E:0xEF4444,fields:[buildRestaurantSourceField()]}
   )]
  });
 }

 if(sub==='search'){
  const input=parseRestaurantOptions(asOptions(interaction));
  const result=await findRestaurants(input);
  const body=searchLines(result.items);
  if(!body.length){
   return interaction.reply({
    embeds:[embed('🍽️ Restoran Tidak Ditemukan',
      'Tidak menemukan restoran yang cocok di kota **'+input.city+'**.'+
      '\n\n'+restaurantDataDisclaimer(),
      {color:0xF59E0B}
    )],
    ephemeral:true
   });
  }
  return interaction.reply({
   embeds:[embed(
    '🍽️ Daftar Restoran & Kisaran Harga',
    body.join('\n\n'),
    {color:0xFF6200,fields:[
      {name:'Kota',value:input.city,inline:true},
      {name:'Halaman',value:String(result.page)+'/'+String(result.pages),inline:true},
      {name:'Hasil',value:String(result.total),inline:true},
      {name:'Filter',value:[
        input.query?'Query: '+input.query:null,
        input.category?'Kategori: '+input.category:null,
        input.minPrice!==null?'Min: '+formatRupiah(input.minPrice):null,
        input.maxPrice!==null?'Max: '+formatRupiah(input.maxPrice):null
      ].filter(Boolean).join(' • ')||'Tanpa filter'},
      {name:'Sumber',value:'MenuKuliner.net',inline:true},
      {name:'Catatan',value:restaurantDataDisclaimer(),inline:false}
    ]}
   )]
  });
 }

 if(sub==='city'){
  const input=parseRestaurantOptions(asOptions(interaction));
  const result=await findRestaurants({city:input.city,page:input.page,limit:input.limit,maxPages:1});
  return interaction.reply({
   embeds:[embed(
    '🏙️ Direktori Harga Restoran '+input.city,
    searchLines(result.items).join('\n\n')||'Tidak ada data.',
    {color:0x06B6D4,fields:[
      {name:'Halaman',value:result.page+'/'+result.pages,inline:true},
      {name:'Total terdeteksi',value:String(result.total),inline:true},
      {name:'Sumber',value:'MenuKuliner.net',inline:true}
    ]}
   )]
  });
 }

 if(sub==='menu'){
  const url=interaction.options.getString('url',true);
  const query=interaction.options.getString('query')||'';
  const category=interaction.options.getString('category')||'';
  const minPrice=interaction.options.getNumber('min_price');
  const maxPrice=interaction.options.getNumber('max_price');
  const page=interaction.options.getInteger('page')||1;
  const result=await findRestaurantMenu(url,{db});
  const filtered=filterMenuItems(result.items,{query,category,minPrice,maxPrice});
  const paged=pageSlice(filtered,page,12);
  const body=menuLines(paged.items);
  if(!body.length)return interaction.reply({embeds:[embed('🍽️ Menu Kosong','Tidak ada menu yang cocok dengan filter yang diberikan.',{color:0xF59E0B})],ephemeral:true});
  return interaction.reply({
   embeds:[embed(
    '🍽️ '+sanitizeEmbedText(result.name||'Restaurant Menu',180),
    body.join('\n\n'),
    {color:0xFF6200,url:result.url,fields:[
      {name:'📍 Lokasi',value:sanitizeEmbedText(result.address||result.city||'Tidak tersedia',180),inline:true},
      {name:'💰 Kisaran',value:formatRange(result.minPrice,result.maxPrice),inline:true},
      {name:'📄 Halaman',value:paged.page+'/'+paged.pages,inline:true},
      {name:'🔎 Filter',value:[
       query?'Menu: '+query:null,
       category?'Kategori: '+category:null,
       minPrice!==null?'Min: '+formatRupiah(minPrice):null,
       maxPrice!==null?'Max: '+formatRupiah(maxPrice):null
      ].filter(Boolean).join(' • ')||'Tanpa filter'},
      buildRestaurantSourceField()
    ]}
   )]
  });
 }

 if(sub==='prices'){
  const input=parseRestaurantOptions(asOptions(interaction));
  const restaurants=await findRestaurants({...input,limit:Math.min(input.limit,8),maxPages:Math.min(input.maxPages,2)});
  const sourceRows=restaurants.items.slice(0,8);
  const allItems=[];
  const failed=[];
  for(const restaurant of sourceRows){
   try{
    const menu=await findRestaurantMenu(restaurant.url,{db});
    const filtered=filterMenuItems(menu.items,{
      query:input.query,
      category:input.category,
      minPrice:input.minPrice,
      maxPrice:input.maxPrice
    }).slice(0,25);
    for(const item of filtered)allItems.push({
      restaurant_name:restaurant.name,
      name:item.name,
      category:item.category,
      price:item.price,
      url:restaurant.url
    });
   }catch(error){
    failed.push(restaurant.name+' — '+error.message);
   }
  }
  const paged=pageSlice(
    allItems.sort((a,b)=>(a.price??Infinity)-(b.price??Infinity)),
    input.page,
    Math.min(input.limit,15)
  );
  const body=combinedLines(paged.items);
  return interaction.reply({
   embeds:[embed(
    '🍴 Harga Menu Restoran Indonesia',
    body.length?body.join('\n\n'):'Belum ada item menu yang berhasil dibaca.',
    {color:0x8B5CF6,fields:[
      {name:'Kota',value:input.city,inline:true},
      {name:'Restoran dipindai',value:String(sourceRows.length),inline:true},
      {name:'Item menu',value:String(allItems.length),inline:true},
      {name:'Halaman',value:paged.page+'/'+paged.pages,inline:true},
      {name:'Sumber',value:'MenuKuliner.net',inline:true},
      {name:'Catatan',value:restaurantDataDisclaimer()},
      ...(failed.length?[{name:'Sumber gagal dibaca',value:failed.slice(0,5).join('\n')}]:[])
    ]}
   )]
  });
 }

 if(sub==='all'){
  const input=parseRestaurantOptions({
   query:interaction.options.getString('query'),
   category:interaction.options.getString('category'),
   minPrice:interaction.options.getNumber('min_price'),
   maxPrice:interaction.options.getNumber('max_price'),
   page:interaction.options.getInteger('page')||1,
   limit:interaction.options.getInteger('limit')||15
  });
  const result=searchCachedRestaurantItems(db,input);
  const body=combinedLines(result.items);
  if(!body.length){
   return interaction.reply({embeds:[embed('🍽️ Belum Ada Data Terindeks','Belum ada harga menu restoran yang tersimpan di cache nasional. Gunakan **/restaurantprices search** atau **/restaurantprices refresh** untuk membangun indeks.',{color:0xF59E0B})],ephemeral:true});
  }
  return interaction.reply({embeds:[embed(
   '🇮🇩 Semua Harga Menu yang Terindeks',
   body.join('\\n\\n'),
   {color:0x8B5CF6,fields:[
    {name:'Halaman',value:result.page+'/'+result.pages,inline:true},
    {name:'Total terindeks',value:String(result.total),inline:true},
    {name:'Filter',value:[input.query?'Menu: '+input.query:null,input.category?'Kategori: '+input.category:null,input.minPrice!==null?'Min: '+formatRupiah(input.minPrice):null,input.maxPrice!==null?'Max: '+formatRupiah(input.maxPrice):null].filter(Boolean).join(' • ')||'Semua'},
    {name:'Catatan',value:restaurantDataDisclaimer()}
   ]}
  )]});
 }

 if(sub==='refresh'){
  const city=interaction.options.getString('city');
  const url=interaction.options.getString('url');
  const pages=interaction.options.getInteger('pages')||1;
  if(url){
   const result=await refreshRestaurantMenu({db,url,city});
   return interaction.reply({
    embeds:[embed(
     '🔄 Menu Restoran Diperbarui',
     '**'+(result.name||'Restaurant')+'**\n'+
     'Item terbaca: **'+result.items.length+'**\n'+
     'Waktu parser: **'+result.elapsedMs+' ms**\n'+
     '\n'+restaurantDataDisclaimer(),
     {color:0x22C55E,url:result.url}
    )],
    ephemeral:true
   });
  }
  const result=await refreshRestaurantCity({db,city:city||'jakarta',pages});
  return interaction.reply({
   embeds:[embed(
    '🔄 Direktori Restoran Diperbarui',
    'Kota: **'+result.city+'**\nHalaman: **'+result.pages+'**\nRestoran terbaca: **'+result.restaurants+'**\nDurasi: **'+result.elapsedMs+' ms**',
    {color:0x22C55E}
   )],
   ephemeral:true
  });
 }

 return interaction.reply({embeds:[embed('🍽️ Restaurant Prices','Subcommand tidak dikenali.',{color:0xEF4444})],ephemeral:true});
}
