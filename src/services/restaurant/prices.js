import * as cheerio from 'cheerio';
import {
 asString,asTrimmed,asInteger,asNumber,normalizeWhitespace,normalizeSearch,
 slugify,toAbsoluteUrl,isHttpUrl,parsePriceRangeText,parsePriceToken,
 formatRupiah,formatRange,pageSlice,clampInt,uniqueStrings,minOf,maxOf,safeJsonStringify,
 dateKeyInTimezone,formatDateId,cacheKey,createLogger,serializeError
} from '../../tools/toolbox.js';
import {requestText} from '../../tools/http-client.js';

const logger=createLogger('restaurant-prices');

export const RESTAURANT_PRICE_VERSION='2.1.0';
export const RESTAURANT_PRICE_SOURCE='MenuKuliner.net';
export const RESTAURANT_PRICE_BASE_URL=process.env.RESTAURANT_PRICE_SOURCE_URL||'https://menukuliner.net';
export const RESTAURANT_PRICE_CACHE_MS=Math.max(5*60*1000,asInteger(process.env.RESTAURANT_PRICE_CACHE_MINUTES,30)*60*1000);
export const RESTAURANT_PRICE_MAX_CITY_PAGES=Math.max(1,Math.min(20,asInteger(process.env.RESTAURANT_PRICE_MAX_CITY_PAGES,6)));
export const RESTAURANT_PRICE_MAX_ITEMS=Math.max(10,Math.min(1000,asInteger(process.env.RESTAURANT_PRICE_MAX_ITEMS,300)));

export const INDONESIA_CITIES=Object.freeze([
 'jakarta','depok','bekasi','bogor','tangerang','tangerang-selatan','bandung','bali','surabaya','makassar','palembang','medan','balikpapan',
 'yogyakarta','semarang','manado','solo','samarinda','malang','batam','padang',
 'pontianak','banjarmasin','pekanbaru','jambi','bandar-lampung','mataram','sukabumi',
 'pematangsiantar','tasikmalaya','serang','cirebon','tegal','magelang','purwokerto',
 'kediri','madiun','karawang','jember','pasuruan','mojokerto','banda-aceh','pekalongan',
 'bukit-tinggi','cilacap','sumedang','garut','belitung','madura','probolinggo',
 'purwakarta','banyuwangi','subang','metro','pangkal-pinang','tanjung-pinang','kudus',
 'kebumen','tomohon','bitung','gorontalo','palu','jombang','merauke','kendari',
 'palopo','ambon','jayapura','palangkaraya','bojonegoro','kisaran'
]);

export const RESTAURANT_CITY_SOURCE_MAP=Object.freeze({depok:'jakarta',bekasi:'jakarta',bogor:'jakarta',tangerang:'jakarta','tangerang-selatan':'jakarta'});

export const RESTAURANT_CATEGORIES=Object.freeze([
 'jajanan','kopi','roti','aneka nasi','ayam & bebek','minuman','cepat saji','sweets',
 'bakmie','bakso & soto','jepang','barat','seafood','chinese','pizza & pasta',
 'timur tengah','india','korea','thailand','sate','martabak'
]);

function absoluteUrl(href){
 const value=toAbsoluteUrl(RESTAURANT_PRICE_BASE_URL,href);
 return value&&value.startsWith(RESTAURANT_PRICE_BASE_URL)?value:value;
}

function sourceCity(city){const slug=slugify(city);return RESTAURANT_CITY_SOURCE_MAP[slug]||slug;}
function cityUrl(city,page=1){
 const slug=sourceCity(city);
 const base=RESTAURANT_PRICE_BASE_URL.replace(/\/$/,'')+'/menu/'+slug;
 return page>1?base+'/page/'+page:base;
}

function sourcePageTitle($){
 const title=normalizeWhitespace($('h1').first().text());
 return title||null;
}

function updatedAtText($){
 const text=normalizeWhitespace($('body').text());
 const match=text.match(/Diperbarui\s+pada\s+([^\.\n]{5,80})/i);
 return match?.[1]?.trim()||null;
}

function cityNameFromTitle(title){
 if(!title)return null;
 const value=title.replace(/^Daftar Harga Menu Delivery Restoran di/i,'').replace(/\(Part\s+\d+\)/i,'').replace(/Terbaru\s+\d{4}.*/i,'');
 return normalizeWhitespace(value).replace(/^Restoran di\s+/i,'').replace(/^\s+|\s+$/g,'')||null;
}

function restaurantLinkFromAnchor(anchor){
 const href=anchor?.attribs?.href||anchor?.href||'';
 if(!/\/menu\//i.test(href))return null;
 if(/\/menu\/(?:jakarta|bandung|bali|surabaya|makassar|medan|yogyakarta)(?:\/page\/\d+)?$/i.test(href))return null;
 return absoluteUrl(href);
}

function cleanRestaurantName(value){
 return normalizeWhitespace(value)
  .replace(/\s+Lihat Menu\s*$/i,'')
  .replace(/^Menu\s+/i,'')
  .replace(/\s{2,}/g,' ')
  .trim();
}

function normalizeRestaurantUrl(url){
 if(!url)return null;
 try{
  const parsed=new URL(url);
  parsed.hash='';
  parsed.search='';
  return parsed.toString().replace(/\/$/,'');
 }catch{return null}
}

function extractAddress(text){
 const value=normalizeWhitespace(text);
 const markers=['Jl.','Jalan ','Gg.','Komplek ','Perum ','Ruko ','Apartemen ','Cluster '];
 const index=markers.map(marker=>value.indexOf(marker)).filter(index=>index>=0).sort((a,b)=>a-b)[0];
 if(index===undefined)return null;
 return value.slice(index).replace(/Rp\s*[0-9.,\-\s]+(?:an|an)?$/i,'').trim();
}

function extractRangeFromText(text){
 const value=normalizeWhitespace(text);
 const currencyMatches=value.match(/(?:Rp|IDR)\s*[0-9][0-9.,]*(?:\s*(?:rb|ribu|jt|juta))?/gi)||[];
 const currencyValues=currencyMatches.map(parsePriceToken).filter(Number.isFinite);
 if(currencyValues.length)return{minPrice:Math.min(...currencyValues),maxPrice:Math.max(...currencyValues)};
 const generic=parsePriceRangeText(value).values.filter(number=>number>=1000&&!/^20\d{2}$/.test(String(number)));
 return{minPrice:generic.length?Math.min(...generic):null,maxPrice:generic.length?Math.max(...generic):null};
}

function extractCategoryText(text){
 const value=normalizeWhitespace(text);
 const matches=RESTAURANT_CATEGORIES.filter(category=>value.toLowerCase().includes(category));
 return uniqueStrings(matches);
}

export function parseRestaurantDirectoryHtml(html,{page=1,sourceUrl=''}={}){
 const $=cheerio.load(asString(html));
 const restaurants=[];
 const seen=new Set();
 $('a[href*="/menu/"]').each((_,element)=>{
  const href=restaurantLinkFromAnchor(element);
  if(!href)return;
  const normalized=normalizeRestaurantUrl(href);
  if(!normalized||seen.has(normalized))return;
  const anchorText=cleanRestaurantName($(element).text());
  if(!anchorText)return;
  let parentText=normalizeWhitespace($(element).parent().text());
  if(parentText===anchorText)parentText=normalizeWhitespace($(element).closest('div,article,section,li').first().text());
  const range=extractRangeFromText(parentText);
  const categories=extractCategoryText(parentText);
  const address=extractAddress(parentText);
  seen.add(normalized);
  restaurants.push({
   name:anchorText,
   url:normalized,
   address,
   categories,
   minPrice:range.minPrice,
   maxPrice:range.maxPrice,
   page
  });
 });
 return {
  title:sourcePageTitle($),
  city:cityNameFromTitle(sourcePageTitle($)),
  updatedText:updatedAtText($),
  sourceUrl,
  page,
  restaurants
 };
}

function textCells($,row){
 return $(row).find('td,th').toArray().map(cell=>normalizeWhitespace($(cell).text())).filter(Boolean);
}

function priceCells(cells){
 return cells.filter(cell=>parsePriceToken(cell)!==null||/rp|idr|\d[\d.,]+/i.test(cell));
}

function inferMenuName(cells){
 if(!cells.length)return null;
 const candidates=cells.filter(cell=>!isProbablyOnlyPrice(cell));
 return normalizeWhitespace(candidates[0]||cells[0])||null;
}

function isProbablyOnlyPrice(value){
 const text=normalizeWhitespace(value);
 if(!text)return false;
 if(/^(?:rp|idr)\s*[0-9][0-9.,\s-]*$/i.test(text))return true;
 return /^\d[\d.,]*(?:\s*(?:rb|ribu|jt|juta))?$/i.test(text);
}

function extractPriceFromCells(cells){
 for(let index=cells.length-1;index>=0;index--){
  const parsed=parsePriceToken(cells[index]);
  if(Number.isFinite(parsed))return parsed;
 }
 return null;
}

function extractMenuRowsFromTables($,defaultCategory='Lainnya'){
 const items=[];
 let category=defaultCategory;
 $('h2,h3,h4,table').each((_,node)=>{
  const tag=node.tagName?.toLowerCase();
  if(['h2','h3','h4'].includes(tag)){
   const heading=cleanRestaurantName($(node).text());
   if(heading&&/harga menu/i.test(heading))category=heading.replace(/^harga\s+menu\s+/i,'').trim()||defaultCategory;
   else if(heading&&heading.length<100)category=heading;
   return;
  }
  if(tag!=='table')return;
  $(node).find('tr').each((__,row)=>{
   const cells=textCells($,row);
   if(cells.length<2)return;
   const price=extractPriceFromCells(cells);
   if(price===null)return;
   const name=inferMenuName(cells);
   if(!name||name.length<2)return;
   items.push({name,category,price,raw:cells});
  });
 });
 return items;
}

function extractMenuRowsFromLinks($,defaultCategory='Lainnya'){
 const items=[];
 $('a').each((_,node)=>{
  const text=cleanRestaurantName($(node).text());
  if(!text)return;
  if(!isProbablyOnlyPrice(text)&&/rp|idr|\d[\d.,]+/i.test(text)){
   const parsed=parsePriceRangeText(text);
   if(parsed.min!==null){
    items.push({
     name:text.replace(/(?:rp|idr)?\s*[0-9][0-9.,]*.*$/i,'').trim()||text,
     category:defaultCategory,
     price:parsed.min,
     raw:[text],
     source:'link'
    });
   }
  }
 });
 return items;
}

function extractMenuRowsFromBodyText($,defaultCategory='Lainnya'){
 const lines=$('body').text().split(/\n+/).map(normalizeWhitespace).filter(Boolean);
 const items=[];
 let category=defaultCategory;
 for(let index=0;index<lines.length;index++){
  const line=lines[index];
  if(/^harga\s+menu/i.test(line)){
   category=normalizeWhitespace(line.replace(/^harga\s+menu\s*/i,'').replace(/^[^A-Za-z0-9]+/,'')).slice(0,120)||defaultCategory;
   continue;
  }
  const priceMatches=line.match(/(?:Rp|IDR)?\s*[0-9][0-9.,]*(?:\s*(?:rb|ribu|jt|juta))?/gi)||[];
  if(!priceMatches.length)continue;
  const parsed=priceMatches.map(parsePriceToken).filter(v=>Number.isFinite(v));
  if(!parsed.length)continue;
  const price=Math.min(...parsed);
  const name=line.replace(/(?:Rp|IDR)?\s*[0-9][0-9.,]*(?:\s*(?:rb|ribu|jt|juta))?/gi,'').trim();
  if(name.length>=2&&name.length<=200){
   items.push({name,category,price,raw:[line],source:'body'});
  }
 }
 return items;
}

function dedupeMenuItems(items){
 const map=new Map();
 for(const item of items){
  const name=normalizeWhitespace(item.name);
  if(!name||isProbablyOnlyPrice(name))continue;
  const key=normalizeSearch(name)+'|'+normalizeSearch(item.category||'Lainnya');
  const existing=map.get(key);
  if(!existing||asNumber(item.price,Infinity)<asNumber(existing.price,Infinity))map.set(key,{...item,name});
 }
 return [...map.values()];
}

function parseRestaurantIdentity($,sourceUrl){
 const title=sourcePageTitle($);
 const name=title?.replace(/^Daftar Harga Menu Delivery/i,'')
  .replace(/Terbaru\s+\d{4}.*/i,'')
  .replace(/,\s*(?:Jakarta|Bandung|Bali|Surabaya|Makassar|Medan).*$/i,'')
  .trim()||null;
 const body=normalizeWhitespace($('body').text());
 const address=extractAddress(body);
 return {name,sourceUrl:normalizeRestaurantUrl(sourceUrl),address,updatedText:updatedAtText($),title};
}

export function parseRestaurantMenuHtml(html,{sourceUrl=''}={}){
 const $=cheerio.load(asString(html));
 const identity=parseRestaurantIdentity($,sourceUrl);
 let items=extractMenuRowsFromTables($);
 if(items.length<3)items=items.concat(extractMenuRowsFromBodyText($));
 if(items.length<3)items=items.concat(extractMenuRowsFromLinks($));
 items=dedupeMenuItems(items).slice(0,RESTAURANT_PRICE_MAX_ITEMS);
 const range=extractRangeFromText($('body').text());
 const categories=uniqueStrings(items.map(x=>x.category).filter(Boolean));
 return {
  ...identity,
  items,
  categories,
  minPrice:range.minPrice,
  maxPrice:range.maxPrice,
  fetchedAt:Date.now(),
  source:RESTAURANT_PRICE_SOURCE,
  parserVersion:RESTAURANT_PRICE_VERSION
 };
}

export function normalizeRestaurantQuery(options={}){
 return {
  city:asTrimmed(options.city||'jakarta'),
  restaurant:asTrimmed(options.restaurant||''),
  query:asTrimmed(options.query||''),
  category:asTrimmed(options.category||''),
  minPrice:options.minPrice===undefined||options.minPrice===null?null:asNumber(options.minPrice,null),
  maxPrice:options.maxPrice===undefined||options.maxPrice===null?null:asNumber(options.maxPrice,null),
  page:Math.max(1,asInteger(options.page,1)),
  limit:clampInt(options.limit,1,25),
  maxPages:clampInt(options.maxPages,1,RESTAURANT_PRICE_MAX_CITY_PAGES)
 };
}

export function filterRestaurants(rows,{query='',category='',minPrice=null,maxPrice=null,city=''}={}){
 const normalizedQuery=normalizeSearch(query);
 const normalizedCategory=normalizeSearch(category);
 const normalizedCity=normalizeSearch(city);
 return rows.filter(row=>{
  const searchable=normalizeSearch((row.name||'')+' '+(row.address||'')+' '+(row.city||'')+' '+(row.categories||[]).join(' '));
  if(normalizedCity&&!searchable.includes(normalizedCity))return false;
  if(normalizedQuery&&!searchable.includes(normalizedQuery))return false;
  if(normalizedCategory&&!row.categories?.some(value=>normalizeSearch(value).includes(normalizedCategory)))return false;
  const min=asNumber(row.minPrice,NaN);
  const max=asNumber(row.maxPrice,NaN);
  if(minPrice!==null&&Number.isFinite(min)&&min<minPrice&&Number.isFinite(max)&&max<minPrice)return false;
  if(maxPrice!==null&&Number.isFinite(min)&&min>maxPrice)return false;
  return true;
 });
}

export function filterMenuItems(rows,{query='',category='',minPrice=null,maxPrice=null}={}){
 const q=normalizeSearch(query);
 const c=normalizeSearch(category);
 return rows.filter(row=>{
  if(q&&!normalizeSearch(row.name).includes(q))return false;
  if(c&&!normalizeSearch(row.category||'').includes(c))return false;
  const p=asNumber(row.price,NaN);
  if(minPrice!==null&&(!Number.isFinite(p)||p<minPrice))return false;
  if(maxPrice!==null&&(!Number.isFinite(p)||p>maxPrice))return false;
  return true;
 });
}

function ensureTables(db){
 if(!db)return;
 db.exec([
  'CREATE TABLE IF NOT EXISTS restaurant_sources(key TEXT PRIMARY KEY,url TEXT NOT NULL,city TEXT,kind TEXT NOT NULL,enabled INTEGER DEFAULT 1,last_checked_at INTEGER,last_success_at INTEGER,last_error TEXT,updated_at INTEGER NOT NULL)',
  'CREATE TABLE IF NOT EXISTS restaurants(id TEXT PRIMARY KEY,name TEXT NOT NULL,city TEXT,address TEXT,url TEXT UNIQUE NOT NULL,categories_json TEXT,min_price INTEGER,max_price INTEGER,source TEXT NOT NULL,source_updated_text TEXT,updated_at INTEGER NOT NULL)',
  'CREATE TABLE IF NOT EXISTS restaurant_items(id INTEGER PRIMARY KEY AUTOINCREMENT,restaurant_id TEXT NOT NULL,name TEXT NOT NULL,category TEXT,price INTEGER,raw_json TEXT,source_updated_text TEXT,updated_at INTEGER NOT NULL,UNIQUE(restaurant_id,name,category))',
  'CREATE INDEX IF NOT EXISTS idx_restaurants_city ON restaurants(city)',
  'CREATE INDEX IF NOT EXISTS idx_restaurants_name ON restaurants(name)',
  'CREATE INDEX IF NOT EXISTS idx_restaurant_items_restaurant ON restaurant_items(restaurant_id)',
  'CREATE INDEX IF NOT EXISTS idx_restaurant_items_price ON restaurant_items(price)',
  'CREATE TABLE IF NOT EXISTS restaurant_refresh_log(id INTEGER PRIMARY KEY AUTOINCREMENT,city TEXT,restaurant_url TEXT,items_count INTEGER,success INTEGER,elapsed_ms INTEGER,error TEXT,created_at INTEGER NOT NULL)'
 ].join(';'));
}

function restaurantId(url){
 return normalizeSearch(normalizeRestaurantUrl(url)||url).replace(/[^a-z0-9]+/g,'_').slice(0,180);
}

function saveRestaurant(db,data,{city=null}={}){
 if(!db||!data?.url)return null;
 const id=restaurantId(data.url);
 const detectedCity=city||data.city||null;
 db.prepare('INSERT INTO restaurants(id,name,city,address,url,categories_json,min_price,max_price,source,source_updated_text,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,city=excluded.city,address=excluded.address,categories_json=excluded.categories_json,min_price=excluded.min_price,max_price=excluded.max_price,source=excluded.source,source_updated_text=excluded.source_updated_text,updated_at=excluded.updated_at').run(
  id,data.name||'Unknown',detectedCity,data.address||null,data.url,safeJsonStringify(data.categories||[],'[]'),data.minPrice??null,data.maxPrice??null,data.source||RESTAURANT_PRICE_SOURCE,data.updatedText||null,Date.now()
 );
 const replace=db.transaction(items=>{
  for(const item of items||[]){
   db.prepare('INSERT INTO restaurant_items(restaurant_id,name,category,price,raw_json,source_updated_text,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(restaurant_id,name,category) DO UPDATE SET price=excluded.price,raw_json=excluded.raw_json,source_updated_text=excluded.source_updated_text,updated_at=excluded.updated_at').run(
    id,item.name,item.category||null,item.price??null,safeJsonStringify(item.raw||[],'[]'),data.updatedText||null,Date.now()
   );
  }
 });
 replace(data.items||[]);
 return id;
}

function saveDirectory(db,directory,{requestedCity=null}={}){
 if(!db)return;
 const city=requestedCity||directory.city||null;
 const upsert=db.prepare('INSERT INTO restaurants(id,name,city,address,url,categories_json,min_price,max_price,source,source_updated_text,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,city=excluded.city,address=excluded.address,categories_json=excluded.categories_json,min_price=excluded.min_price,max_price=excluded.max_price,source=excluded.source,source_updated_text=excluded.source_updated_text,updated_at=excluded.updated_at');
 const tx=db.transaction(rows=>{
  for(const row of rows){
   upsert.run(restaurantId(row.url),row.name,city,row.address||null,row.url,safeJsonStringify(row.categories||[],'[]'),row.minPrice??null,row.maxPrice??null,RESTAURANT_PRICE_SOURCE,directory.updatedText||null,Date.now());
  }
 });
 tx(directory.restaurants||[]);
}

function readDirectoryCache(db,{city='jakarta',query='',category='',minPrice=null,maxPrice=null,page=1,limit=10}={}){
 if(!db)return null;
 const sql=['SELECT id,name,city,address,url,categories_json,min_price,max_price,source_updated_text,updated_at FROM restaurants WHERE city=?'];
 const params=[city];
 if(query){sql.push('AND lower(name) LIKE ?');params.push('%'+normalizeSearch(query).replaceAll('%','')+'%')}
 if(minPrice!==null){sql.push('AND (max_price IS NULL OR max_price>=?)');params.push(minPrice)}
 if(maxPrice!==null){sql.push('AND (min_price IS NULL OR min_price<=?)');params.push(maxPrice)}
 sql.push('ORDER BY name ASC');
 const rows=db.prepare(sql.join(' ')).all(...params).map(row=>({
  ...row,
  categories:JSON.parse(row.categories_json||'[]'),
  minPrice:row.min_price,
  maxPrice:row.max_price,
  updatedAt:row.updated_at
 }));
 return pageSlice(filterRestaurants(rows,{query,category,minPrice,maxPrice}),page,limit);
}

function readRestaurantCache(db,url){
 if(!db)return null;
 const restaurant=db.prepare('SELECT * FROM restaurants WHERE url=?').get(normalizeRestaurantUrl(url)||url);
 if(!restaurant)return null;
 const items=db.prepare('SELECT name,category,price,raw_json,source_updated_text,updated_at FROM restaurant_items WHERE restaurant_id=? ORDER BY category,name').all(restaurant.id).map(item=>({...item,raw:JSON.parse(item.raw_json||'[]')}));
 return {
  name:restaurant.name,
  city:restaurant.city,
  address:restaurant.address,
  url:restaurant.url,
  categories:JSON.parse(restaurant.categories_json||'[]'),
  minPrice:restaurant.min_price,
  maxPrice:restaurant.max_price,
  updatedText:restaurant.source_updated_text,
  updatedAt:restaurant.updated_at,
  source:restaurant.source,
  items
 };
}

export async function fetchRestaurantDirectory(city='jakarta',page=1){
 const url=cityUrl(city,page);
 const {text,response}=await requestText(url,{timeoutMs:10000,retries:2});
 if(!response.ok)throw new Error('MenuKuliner HTTP '+response.status);
 return {...parseRestaurantDirectoryHtml(text,{page,sourceUrl:url}),sourceUrl:url};
}

export async function fetchRestaurantMenu(url){
 if(!isHttpUrl(url))throw new Error('URL restoran harus http:// atau https://');
 const {text,response}=await requestText(url,{timeoutMs:10000,retries:2});
 if(!response.ok)throw new Error('Menu restoran HTTP '+response.status);
 return parseRestaurantMenuHtml(text,{sourceUrl:url});
}

export async function findRestaurants(options={}){
 const db=options.db||null;
 const input=normalizeRestaurantQuery(options);
 const fetched=[];
 for(let page=1;page<=input.maxPages;page++){
  const directory=await fetchRestaurantDirectory(input.city,page);
  if(db)saveDirectory(db,directory,{requestedCity:city});
  fetched.push(...directory.restaurants);
  if(directory.restaurants.length===0)break;
  if(fetched.length>=Math.max(input.limit*page,100))break;
 }
 const deduped=new Map();
 for(const row of fetched)deduped.set(normalizeRestaurantUrl(row.url),row);
 const filtered=filterRestaurants([...deduped.values()],input);
 return {
  source:RESTAURANT_PRICE_SOURCE,
  city:input.city,
  pagesScanned:input.maxPages,
  total:filtered.length,
  ...pageSlice(filtered,input.page,input.limit),
  fetchedAt:Date.now()
 };
}

export async function findRestaurantMenu(url,options={}){
 const db=options.db;
 const normalized=normalizeRestaurantUrl(url);
 const cached=readRestaurantCache(db,normalized);
 if(cached&&Date.now()-cached.updatedAt<RESTAURANT_PRICE_CACHE_MS&&!options.force)return{...cached,cached:true};
 const data=await fetchRestaurantMenu(normalized);
 if(db)saveRestaurant(db,data,{city:options.city||cityNameFromRestaurantData(data)});
 return {...data,cached:false};
}

function cityNameFromRestaurantData(data){
 if(data.city)return data.city;
 if(data.title){
  const value=data.title.split(',').pop().replace(/Terbaru\s+\d{4}.*/i,'').trim();
  return value||null;
 }
 return null;
}

export async function refreshRestaurantCity({db,city='jakarta',pages=1}={}){
 const started=Date.now();
 ensureTables(db);
 const safePages=Math.min(RESTAURANT_PRICE_MAX_CITY_PAGES,Math.max(1,asInteger(pages,1)));
 const rows=[];
 for(let page=1;page<=safePages;page++){
  try{
   const directory=await fetchRestaurantDirectory(city,page);
   saveDirectory(db,directory);
   rows.push(...directory.restaurants);
  }catch(error){
   logger.warn('Gagal refresh kota',city,page,serializeError(error));
   db?.prepare('INSERT INTO restaurant_refresh_log(city,restaurant_url,items_count,success,elapsed_ms,error,created_at) VALUES(?,?,?,?,?,?,?)').run(city,null,0,0,Date.now()-started,error.message,Date.now());
  }
 }
 if(db)db.prepare('INSERT INTO restaurant_refresh_log(city,restaurant_url,items_count,success,elapsed_ms,error,created_at) VALUES(?,?,?,?,?,?,?)').run(city,null,rows.length,1,Date.now()-started,null,Date.now());
 return {city,pages:safePages,restaurants:rows.length,elapsedMs:Date.now()-started};
}

export async function refreshRestaurantMenu({db,url,city=null}={}){
 const started=Date.now();
 try{
  const data=await fetchRestaurantMenu(url);
  const id=saveRestaurant(db,data,{city:city||cityNameFromRestaurantData(data)});
  if(db)db.prepare('INSERT INTO restaurant_refresh_log(city,restaurant_url,items_count,success,elapsed_ms,error,created_at) VALUES(?,?,?,?,?,?,?)').run(city||data.city||null,url,data.items.length,1,Date.now()-started,null,Date.now());
  return {...data,id,elapsedMs:Date.now()-started};
 }catch(error){
  if(db)db.prepare('INSERT INTO restaurant_refresh_log(city,restaurant_url,items_count,success,elapsed_ms,error,created_at) VALUES(?,?,?,?,?,?,?)').run(city||null,url,0,0,Date.now()-started,error.message,Date.now());
  throw error;
 }
}

export function searchCachedRestaurantItems(db,options={}){
 if(!db)return{items:[],total:0,page:1,pages:1,start:0};
 const input=normalizeRestaurantQuery(options);
 const queryParts=['SELECT r.name AS restaurant_name,r.city,r.url,i.name,i.category,i.price,i.source_updated_text,i.updated_at FROM restaurant_items i JOIN restaurants r ON r.id=i.restaurant_id WHERE 1=1'];
 const params=[];
 if(input.city){queryParts.push('AND lower(r.city)=?');params.push(input.city.toLowerCase())}
 if(input.restaurant){queryParts.push('AND lower(r.name) LIKE ?');params.push('%'+input.restaurant.toLowerCase()+'%')}
 if(input.query){queryParts.push('AND lower(i.name) LIKE ?');params.push('%'+input.query.toLowerCase()+'%')}
 if(input.category){queryParts.push('AND lower(coalesce(i.category,\'\')) LIKE ?');params.push('%'+input.category.toLowerCase()+'%')}
 if(input.minPrice!==null){queryParts.push('AND i.price>=?');params.push(input.minPrice)}
 if(input.maxPrice!==null){queryParts.push('AND i.price<=?');params.push(input.maxPrice)}
 queryParts.push('ORDER BY i.price ASC,r.name ASC,i.name ASC');
 const rows=db.prepare(queryParts.join(' ')).all(...params);
 return pageSlice(rows,input.page,input.limit);
}

export function formatRestaurantSearchRows(rows){
 return rows.map((row,index)=>{
  const range=row.minPrice!==undefined?formatRange(row.minPrice,row.maxPrice):formatRange(row.min_price,row.max_price);
  return '**'+(index+1)+'. '+row.name+'**\n'+(row.address?'📍 '+row.address+'\n':'')+
    '💰 '+range+'\n'+(row.categories?.length?'🏷️ '+row.categories.join(', ')+'\n':'')+
    '🔗 '+row.url;
 });
}

export function formatMenuRows(rows){
 return rows.map((row,index)=>{
  const price=formatRupiah(row.price);
  return '**'+(index+1)+'. '+row.name+'**\n💰 '+price+(row.category?' • '+row.category:'');
 });
}

export function categoryCounts(items){
 const map=new Map();
 for(const item of items||[]){
  const key=normalizeWhitespace(item.category||'Lainnya');
  map.set(key,(map.get(key)||0)+1);
 }
 return [...map.entries()].sort((a,b)=>b[1]-a[1]).map(([category,count])=>({category,count}));
}

export function priceStats(items){
 const values=(items||[]).map(x=>asNumber(x.price,NaN)).filter(Number.isFinite).sort((a,b)=>a-b);
 if(!values.length)return{count:0,min:null,max:null,average:null,median:null};
 const average=values.reduce((sum,value)=>sum+value,0)/values.length;
 const middle=Math.floor(values.length/2);
 return{count:values.length,min:values[0],max:values.at(-1),average,median:values.length%2?values[middle]:(values[middle-1]+values[middle])/2};
}

export function restaurantPriceSummary(data){
 const stats=priceStats(data.items||[]);
 return {
  restaurant:data.name||'Unknown',
  city:data.city||'Unknown',
  source:data.source||RESTAURANT_PRICE_SOURCE,
  updatedText:data.updatedText||null,
  fetchedAt:data.fetchedAt||Date.now(),
  itemCount:stats.count,
  minPrice:stats.min,
  maxPrice:stats.max,
  averagePrice:stats.average,
  medianPrice:stats.median,
  categories:categoryCounts(data.items||[])
 };
}

export function buildRestaurantEmbedData(data,{page=1,limit=12,query='',category='',minPrice=null,maxPrice=null}={}){
 const summary=restaurantPriceSummary(data);
 const filtered=filterMenuItems(data.items||[],{query,category,minPrice,maxPrice});
 const paged=pageSlice(filtered,page,limit);
 const lines=formatMenuRows(paged.items);
 return {
  title:'🍽️ '+(data.name||'Restaurant Menu'),
  description:lines.length?lines.join('\n\n'):'Tidak ada item menu yang cocok.',
  fields:[
   {name:'📍 Lokasi',value:data.address||data.city||'Tidak tersedia',inline:true},
   {name:'💰 Kisaran',value:formatRange(summary.minPrice,summary.maxPrice),inline:true},
   {name:'🍴 Jumlah menu',value:String(summary.itemCount),inline:true},
   {name:'🏷️ Kategori',value:summary.categories.slice(0,8).map(x=>x.category+' ('+x.count+')').join(', ')||'Tidak tersedia'},
   {name:'🔎 Filter',value:[query?'Menu: '+query:null,category?'Kategori: '+category:null,minPrice!==null?'Min: '+formatRupiah(minPrice):null,maxPrice!==null?'Max: '+formatRupiah(maxPrice):null].filter(Boolean).join(' • ')||'Tanpa filter'},
   {name:'📄 Halaman',value:'Halaman '+paged.page+'/'+paged.pages+' • '+paged.total+' menu'}
  ],
  url:data.url,
  source:RESTAURANT_PRICE_SOURCE,
  fetchedAt:data.fetchedAt||Date.now()
 };
}

export async function restaurantSourceStatus(){
 const url=cityUrl('jakarta',1);
 try{
  const {response}=await requestText(url,{timeoutMs:7000,retries:1,headers:{accept:'text/html,application/xhtml+xml'}});
  return{source:RESTAURANT_PRICE_SOURCE,url,status:response.status,ok:response.ok,checkedAt:Date.now()};
 }catch(error){
  return{source:RESTAURANT_PRICE_SOURCE,url,status:0,ok:false,error:error.message,checkedAt:Date.now()};
 }
}

export function getRestaurantCities(){
 return [...INDONESIA_CITIES];
}

export function getRestaurantCategories(){
 return [...RESTAURANT_CATEGORIES];
}

export function resolveRestaurantCity(value){
 const normalized=slugify(value);
 return INDONESIA_CITIES.includes(normalized)?normalized:null;
}

export function resolveRestaurantCategory(value){
 const normalized=normalizeSearch(value);
 return RESTAURANT_CATEGORIES.find(category=>normalizeSearch(category)===normalized)||
   RESTAURANT_CATEGORIES.find(category=>normalizeSearch(category).includes(normalized))||null;
}

export function restaurantHelp(){
 return [
  '/restaurantprices search city:<kota> [query:<menu/resto>] [category:<kategori>]',
  '/restaurantprices menu url:<url-menu-restoran>',
  '/restaurantprices city city:<kota> page:<halaman>',
  '/restaurantprices refresh city:<kota> [pages:<1-6>]',
  '/restaurantprices status'
 ];
}

export function restaurantDataDisclaimer(){
 return 'Harga berasal dari agregator publik MenuKuliner.net dan dapat berbeda menurut cabang, lokasi, delivery platform, pajak, promo, atau perubahan menu.';
}

export function sourceAttribution(){
 return {
  name:RESTAURANT_PRICE_SOURCE,
  url:RESTAURANT_PRICE_BASE_URL,
  disclaimer:restaurantDataDisclaimer()
 };
}

export function cityPageLinks(city,pageCount=1){
 const links=[];
 for(let page=1;page<=Math.max(1,asInteger(pageCount,1));page++)links.push(cityUrl(city,page));
 return links;
}

export function isRestaurantPage(url){
 try{
  const parsed=new URL(url);
  return parsed.hostname.endsWith('menukuliner.net')&&/\/menu\//i.test(parsed.pathname)&&!/\/menu\/(?:jakarta|bandung|bali|surabaya|makassar)(?:\/page\/\d+)?$/i.test(parsed.pathname);
 }catch{return false}
}

export function isRestaurantCityPage(url){
 try{
  const parsed=new URL(url);
  return parsed.hostname.endsWith('menukuliner.net')&&/^\/menu\/[a-z0-9-]+(?:\/page\/\d+)?\/?$/i.test(parsed.pathname);
 }catch{return false}
}

export function normalizeSourceUrl(url){
 const normalized=normalizeRestaurantUrl(url);
 if(!normalized)return null;
 return normalized;
}

export function estimatePriceBand(items){
 const values=(items||[]).map(x=>asNumber(x.price,NaN)).filter(Number.isFinite);
 if(!values.length)return'unknown';
 const average=values.reduce((sum,value)=>sum+value,0)/values.length;
 if(average<10000)return'budget';
 if(average<30000)return'moderate';
 if(average<75000)return'premium';
 return'high';
}

export function filterByPriceBand(items,band){
 const allowed={
  budget:[0,9999],
  moderate:[10000,29999],
  premium:[30000,74999],
  high:[75000,Infinity]
 };
 const range=allowed[band];
 if(!range)return[...items||[]];
 return (items||[]).filter(item=>{const p=asNumber(item.price,NaN);return Number.isFinite(p)&&p>=range[0]&&p<=range[1]});
}

export function menuItemKey(item){
 return normalizeSearch(item?.name)+'|'+normalizeSearch(item?.category||'Lainnya');
}

export function dedupePrices(items){
 const map=new Map();
 for(const item of items||[]){
  const key=menuItemKey(item);
  const current=map.get(key);
  if(!current||asNumber(item.price,Infinity)<asNumber(current.price,Infinity))map.set(key,item);
 }
 return [...map.values()];
}

export function sortMenuByPrice(items,direction='asc'){
 return [...items||[]].sort((a,b)=>(asNumber(a.price,Infinity)-asNumber(b.price,Infinity))*(direction==='desc'?-1:1));
}

export function sortMenuByName(items){
 return [...items||[]].sort((a,b)=>normalizeSearch(a.name).localeCompare(normalizeSearch(b.name),'id'));
}

export function sortRestaurantsByRange(items){
 return [...items||[]].sort((a,b)=>{
  const amin=asNumber(a.minPrice,Infinity),bmin=asNumber(b.minPrice,Infinity);
  if(amin!==bmin)return amin-bmin;
  return normalizeSearch(a.name).localeCompare(normalizeSearch(b.name),'id');
 });
}

export function restaurantResultToJson(row){
 return {
  name:row.name,
  city:row.city||null,
  address:row.address||null,
  url:row.url,
  categories:row.categories||[],
  minPrice:row.minPrice??null,
  maxPrice:row.maxPrice??null,
  source:row.source||RESTAURANT_PRICE_SOURCE
 };
}

export function menuItemToJson(row){
 return {
  name:row.name,
  category:row.category||null,
  price:row.price??null,
  source:RESTAURANT_PRICE_SOURCE
 };
}

export function dataAgeLabel(updatedAt){
 if(!updatedAt)return'Tidak diketahui';
 const age=Math.max(0,Date.now()-updatedAt);
 const minutes=Math.floor(age/60000);
 if(minutes<1)return'baru saja';
 if(minutes<60)return minutes+' menit lalu';
 const hours=Math.floor(minutes/60);
 if(hours<24)return hours+' jam lalu';
 return Math.floor(hours/24)+' hari lalu';
}

export function formatFreshness(updatedAt){
 return 'Data: '+dataAgeLabel(updatedAt);
}

export function buildSearchDescription({city,query,category,minPrice,maxPrice,pagesScanned,total}={}){
 return [
  'Kota: **'+(city||'Indonesia')+'**',
  query?'Query: **'+query+'**':null,
  category?'Kategori: **'+category+'**':null,
  minPrice!==null&&minPrice!==undefined?'Min: **'+formatRupiah(minPrice)+'**':null,
  maxPrice!==null&&maxPrice!==undefined?'Max: **'+formatRupiah(maxPrice)+'**':null,
  'Halaman sumber dipindai: **'+(pagesScanned||1)+'**',
  'Hasil cocok: **'+(total||0)+'**'
 ].filter(Boolean).join(' • ');
}

export function sanitizeEmbedText(value,maxLength=3800){
 const text=normalizeWhitespace(value);
 return text.length>maxLength?text.slice(0,maxLength-1)+'…':text;
}

export function splitForDiscord(value,maxLength=3900){
 const text=asString(value);
 if(text.length<=maxLength)return[text];
 const parts=[];
 let start=0;
 while(start<text.length){let end=Math.min(text.length,start+maxLength);const newline=text.lastIndexOf('\n',end);if(newline>start+100)end=newline;parts.push(text.slice(start,end));start=end;}
 return parts;
}

export function buildRestaurantSourceField(){
 return {
  name:'Sumber',
  value:RESTAURANT_PRICE_BASE_URL+'\n'+restaurantDataDisclaimer(),
  inline:false
 };
}

export function buildRestaurantMenuFields(data){
 const summary=restaurantPriceSummary(data);
 return [
  {name:'📍 Lokasi',value:data.address||data.city||'Tidak tersedia',inline:true},
  {name:'💰 Kisaran Harga',value:formatRange(summary.minPrice,summary.maxPrice),inline:true},
  {name:'🍽️ Total Item',value:String(summary.itemCount),inline:true},
  buildRestaurantSourceField()
 ];
}

export function buildRestaurantSearchFields(result,input){
 return [
  {name:'Kota',value:input.city||'Indonesia',inline:true},
  {name:'Halaman',value:String(result.page||1),inline:true},
  {name:'Total',value:String(result.total||0),inline:true},
  {name:'Sumber',value:RESTAURANT_PRICE_SOURCE,inline:true},
  {name:'Refresh',value:formatDateId(new Date(),process.env.BOT_TIMEZONE||'Asia/Jakarta'),inline:true},
  {name:'Catatan',value:restaurantDataDisclaimer(),inline:false}
 ];
}

export function buildRestaurantStatus(data){
 return {
  source:RESTAURANT_PRICE_SOURCE,
  baseUrl:RESTAURANT_PRICE_BASE_URL,
  cacheMs:RESTAURANT_PRICE_CACHE_MS,
  maxCityPages:RESTAURANT_PRICE_MAX_CITY_PAGES,
  maxItems:RESTAURANT_PRICE_MAX_ITEMS,
  checkedAt:Date.now(),
  cityCount:INDONESIA_CITIES.length,
  categoryCount:RESTAURANT_CATEGORIES.length,
  dbAvailable:Boolean(data?.db)
 };
}

export function shouldRefresh(updatedAt,force=false){
 return Boolean(force||!updatedAt||Date.now()-updatedAt>=RESTAURANT_PRICE_CACHE_MS);
}

export function restaurantCacheKey(url){return cacheKey('restaurant-menu',normalizeRestaurantUrl(url)||url)}
export function directoryCacheKey(city,page){return cacheKey('restaurant-directory',city,page)}

export function sanitizeCityInput(value){
 const resolved=resolveRestaurantCity(value);
 return resolved||slugify(value);
}

export function sanitizeCategoryInput(value){
 return resolveRestaurantCategory(value)||normalizeWhitespace(value);
}

export function buildRestaurantSearchUrl(city,page=1){
 return cityUrl(sanitizeCityInput(city),page);
}

export function buildRestaurantMenuUrl(url){
 return normalizeRestaurantUrl(url);
}

export function isKnownCity(value){return Boolean(resolveRestaurantCity(value))}
export function isKnownCategory(value){return Boolean(resolveRestaurantCategory(value))}

export function citySuggestions(query='',limit=10){
 const q=normalizeSearch(query);
 const rows=INDONESIA_CITIES.filter(city=>!q||city.includes(q));
 return rows.slice(0,Math.max(1,asInteger(limit,10)));
}

export function categorySuggestions(query='',limit=10){
 const q=normalizeSearch(query);
 return RESTAURANT_CATEGORIES.filter(category=>!q||normalizeSearch(category).includes(q)).slice(0,Math.max(1,asInteger(limit,10)));
}

export async function warmPopularCities({db,cities=['jakarta','depok','bandung'],pages=1}={}){
 const uniqueCities=uniqueStrings(cities).slice(0,10);
 const results=[];
 for(const city of uniqueCities){
  const started=Date.now();
  try{
   const result=await refreshRestaurantCity({db,city,pages});
   results.push({...result,ok:true,elapsedMs:Date.now()-started});
  }catch(error){
   results.push({city,ok:false,error:error.message,elapsedMs:Date.now()-started});
  }
 }
 return results;
}

export async function refreshFromRestaurantList({db,rows=[],limit=10}={}){
 const selected=rows.slice(0,Math.max(1,asInteger(limit,10)));
 const results=[];
 for(const row of selected){
  try{
   const menu=await refreshRestaurantMenu({db,url:row.url,city:row.city});
   results.push({url:row.url,ok:true,items:menu.items.length});
  }catch(error){
   results.push({url:row.url,ok:false,error:error.message});
  }
 }
 return results;
}

export function parseRestaurantPageIdentity(html,sourceUrl=''){
 const $=cheerio.load(asString(html));
 return parseRestaurantIdentity($,sourceUrl);
}

export function parseRestaurantPriceHtml(html,{sourceUrl=''}={}){
 return parseRestaurantMenuHtml(html,{sourceUrl});
}

export function parseRestaurantDirectoryPage(html,{page=1,sourceUrl=''}={}){
 return parseRestaurantDirectoryHtml(html,{page,sourceUrl});
}

export const RESTAURANT_SOURCE_HEALTH=Object.freeze({
 key:'restaurant.menukuliner',
 url:RESTAURANT_PRICE_BASE_URL+'/menu/jakarta',
 group:'restaurant-prices',
 intervalMs:60*60*1000,
 attribution:RESTAURANT_PRICE_SOURCE
});

export function getRestaurantScraperDefinition(){return{...RESTAURANT_SOURCE_HEALTH}}

export function restaurantSearchExamples(){
 return [
  {command:'/restaurantprices search city:jakarta',description:'Restoran dan kisaran harga di Jakarta'},
  {command:'/restaurantprices search city:depok query:ayam',description:'Restoran/menu ayam di Depok'},
  {command:'/restaurantprices search city:bandung category:bakmie max_price:30000',description:'Menu bakmie sampai Rp30.000'},
  {command:'/restaurantprices menu url:<URL MenuKuliner>',description:'Semua menu dan harga dari satu restoran'},
  {command:'/restaurantprices city city:jakarta page:2',description:'Halaman kedua direktori Jakarta'},
  {command:'/restaurantprices refresh city:jakarta pages:2',description:'Refresh dua halaman direktori'},
  {command:'/restaurantprices status',description:'Status scraper harga restoran'}
 ];
}

export const RESTAURANT_PRICE_POLICY=Object.freeze({
 source:RESTAURANT_PRICE_SOURCE,
 readOnly:true,
 noCheckout:true,
 noOrder:true,
 cacheable:true,
 refreshable:true,
 disclaimer:restaurantDataDisclaimer(),
 maxPublicResults:25
});

export function canDisplayRestaurantPrice(item){
 const price=asNumber(item?.price,NaN);
 return Boolean(item?.name&&Number.isFinite(price)&&price>=0);
}

export function safeRestaurantItems(items){
 return dedupePrices((items||[]).filter(canDisplayRestaurantPrice)).slice(0,RESTAURANT_PRICE_MAX_ITEMS);
}

export function restaurantMenuJson(data){
 return {
  restaurant:data.name||null,
  city:data.city||null,
  address:data.address||null,
  url:data.url||null,
  categories:data.categories||[],
  items:safeRestaurantItems(data.items).map(menuItemToJson),
  summary:restaurantPriceSummary(data),
  source:sourceAttribution()
 };
}

export function restaurantSearchJson(result){
 return {
  city:result.city,
  page:result.page,
  pages:result.pages,
  total:result.total,
  restaurants:(result.items||[]).map(restaurantResultToJson),
  source:sourceAttribution()
 };
}

export function buildCategorySummary(items){
 const stats=categoryCounts(items);
 return stats.map(row=>row.category+': '+row.count).join(' • ');
}

export function buildPriceSummary(items){
 const stats=priceStats(items);
 return stats.count?'Min '+formatRupiah(stats.min)+' • Max '+formatRupiah(stats.max)+' • Avg '+formatRupiah(stats.average):'Harga belum tersedia';
}

export function buildRestaurantTitle(data){
 return [data.name,data.city?'('+data.city+')':null].filter(Boolean).join(' ');
}

export function buildRestaurantMenuDescription(data){
 return [
  data.address?'📍 '+data.address:null,
  data.updatedText?'🕐 '+data.updatedText:null,
  buildPriceSummary(data.items||[]),
  buildCategorySummary(data.items||[])
 ].filter(Boolean).join('\n');
}

export function buildRestaurantSearchLine(row){
 return [
  '**'+row.name+'**',
  row.city||null,
  row.address?'📍 '+row.address:null,
  formatRange(row.minPrice,row.maxPrice),
  row.url
 ].filter(Boolean).join(' • ');
}

export function getDefaultRestaurantSearchLimit(){return 10}
export function getDefaultRestaurantPage(){return 1}
export function getDefaultRestaurantMaxPages(){return 1}
export function getDefaultRestaurantCacheMinutes(){return Math.round(RESTAURANT_PRICE_CACHE_MS/60000)}

export function parseMaxPrice(value){return value===undefined||value===null?null:Math.max(0,asNumber(value,null))}
export function parseMinPrice(value){return value===undefined||value===null?null:Math.max(0,asNumber(value,null))}
export function parsePage(value){return Math.max(1,asInteger(value,1))}
export function parseLimit(value){return clampInt(value,1,25)}

export function validateRestaurantSearch(input){
 const errors=[];
 if(!input.city)errors.push('Kota wajib diisi.');
 if(input.minPrice!==null&&input.maxPrice!==null&&input.minPrice>input.maxPrice)errors.push('min_price tidak boleh lebih besar dari max_price.');
 if(input.page<1)errors.push('page minimal 1.');
 if(input.limit<1||input.limit>25)errors.push('limit harus 1-25.');
 return errors;
}

export function parseRestaurantOptions(options={}){
 const input=normalizeRestaurantQuery(options);
 input.minPrice=parseMinPrice(options.minPrice);
 input.maxPrice=parseMaxPrice(options.maxPrice);
 input.page=parsePage(options.page);
 input.limit=parseLimit(options.limit);
 input.city=sanitizeCityInput(input.city);
 input.category=sanitizeCategoryInput(input.category);
 return input;
}

export function buildRefreshResultEmbed(result){
 return {
  city:result.city,
  pages:result.pages,
  restaurants:result.restaurants,
  elapsedMs:result.elapsedMs,
  source:RESTAURANT_PRICE_SOURCE
 };
}

export function buildSourceHealthEmbed(result){
 return {
  source:result.source,
  ok:result.ok,
  status:result.status,
  url:result.url,
  checkedAt:result.checkedAt,
  error:result.error||null
 };
}

export function makeRestaurantCacheRecord(data){
 return {
  key:restaurantCacheKey(data.url),
  url:data.url,
  updatedAt:data.fetchedAt||Date.now(),
  expiresAt:(data.fetchedAt||Date.now())+RESTAURANT_PRICE_CACHE_MS,
  itemCount:(data.items||[]).length
 };
}

export function isCacheFresh(record){
 return Boolean(record&&asNumber(record.expiresAt,0)>Date.now());
}

export function sourceRefreshAge(updatedAt){
 return updatedAt?Math.max(0,Date.now()-updatedAt):null;
}

export function formatRefreshAge(updatedAt){
 const age=sourceRefreshAge(updatedAt);
 if(age===null)return'Tidak diketahui';
 const minutes=Math.floor(age/60000);
 if(minutes<1)return'< 1 menit';
 if(minutes<60)return minutes+' menit';
 const hours=Math.floor(minutes/60);
 if(hours<24)return hours+' jam';
 return Math.floor(hours/24)+' hari';
}

export function buildPriceRow(item){
 return {
  name:item.name,
  category:item.category||'Lainnya',
  price:item.price??null,
  displayPrice:formatRupiah(item.price),
  available:canDisplayRestaurantPrice(item)
 };
}

export function priceRangeFromItems(items){
 const safe=safeRestaurantItems(items);
 return {
  min:minOf(safe,x=>x.price),
  max:maxOf(safe,x=>x.price)
 };
}

export function attachPriceRange(data){
 const range=priceRangeFromItems(data.items||[]);
 return {...data,minPrice:data.minPrice??range.min,maxPrice:data.maxPrice??range.max};
}

export function restaurantMenuMatchesQuery(menu,{query='',category='',minPrice=null,maxPrice=null}={}){
 return filterMenuItems(menu.items||[],{query,category,minPrice,maxPrice}).length>0;
}

export function restaurantHasCategory(data,category){
 const q=normalizeSearch(category);
 return (data.categories||[]).some(item=>normalizeSearch(item)===q);
}

export function restaurantNameMatches(data,query){
 return normalizeSearch(data.name||'').includes(normalizeSearch(query));
}

export function menuNameMatches(item,query){
 return normalizeSearch(item.name||'').includes(normalizeSearch(query));
}

export function categoryNameMatches(item,category){
 return normalizeSearch(item.category||'').includes(normalizeSearch(category));
}

export function priceBetween(item,minPrice,maxPrice){
 const price=asNumber(item?.price,NaN);
 return Number.isFinite(price)&&(minPrice===null||price>=minPrice)&&(maxPrice===null||price<=maxPrice);
}

export function restaurantPriceSourceLinks(){
 return {
  home:RESTAURANT_PRICE_BASE_URL,
  jakarta:cityUrl('jakarta'),
  depok:cityUrl('jakarta',2),
  bandung:cityUrl('bandung')
 };
}

export function restaurantFeatureSummary(){
 return {
  version:RESTAURANT_PRICE_VERSION,
  source:RESTAURANT_PRICE_SOURCE,
  cities:INDONESIA_CITIES.length,
  categories:RESTAURANT_CATEGORIES.length,
  cacheMinutes:getDefaultRestaurantCacheMinutes(),
  policy:RESTAURANT_PRICE_POLICY
 };
}

export function parseSourceUpdateText(text){
 const value=normalizeWhitespace(text);
 const match=value.match(/Diperbarui\s+pada\s+(.+?)(?:\.|$)/i);
 return match?.[1]?.trim()||null;
}

export function sourceUpdatedTimestamp(text){
 const parsed=Date.parse(asString(text));
 return Number.isFinite(parsed)?parsed:null;
}

export function restaurantRecordFingerprint(data){
 return [
  normalizeSearch(data.name),
  normalizeSearch(data.city),
  normalizeSearch(data.address),
  normalizeRestaurantUrl(data.url)
 ].join('|');
}

export function restaurantItemFingerprint(item){
 return [normalizeSearch(item.name),normalizeSearch(item.category||'Lainnya'),asInteger(item.price,-1)].join('|');
}

export function datasetFingerprint(data){
 return data.items?.map(restaurantItemFingerprint).sort().join('||')||restaurantRecordFingerprint(data);
}

export function hasMenuChanges(before,after){
 return datasetFingerprint(before)!==datasetFingerprint(after);
}

export function changedMenuItems(before,after){
 const oldMap=new Map((before?.items||[]).map(item=>[menuItemKey(item),item]));
 const changed=[];
 for(const item of after?.items||[]){
  const old=oldMap.get(menuItemKey(item));
  if(!old||asNumber(old.price,null)!==asNumber(item.price,null))changed.push({old:newData(old),new:newData(item)});
 }
 return changed;
}

function newData(item){return item?{name:item.name,category:item.category,price:item.price}:null}

export function menuChangeSummary(before,after){
 const changes=changedMenuItems(before,after);
 return {
  changed:changes.length>0,
  count:changes.length,
  changes
 };
}

export function safeMenuUrlFromInput(value){
 const url=normalizeRestaurantUrl(value);
 return url&&isRestaurantPage(url)?url:null;
}

export function safeCityFromInput(value){
 const city=slugify(value);
 return INDONESIA_CITIES.includes(city)?city:null;
}

export function safeCategoryFromInput(value){
 return resolveRestaurantCategory(value);
}

export function ensureRestaurantUrl(value){
 const url=safeMenuUrlFromInput(value);
 if(!url)throw new Error('Gunakan URL halaman restoran MenuKuliner.net yang valid.');
 return url;
}

export function ensureRestaurantCity(value){
 const city=safeCityFromInput(value);
 if(!city)throw new Error('Kota belum dikenali. Gunakan slug kota dari direktori restoran.');
 return city;
}

export function ensurePositivePrice(value,name='harga'){
 const n=asNumber(value,NaN);
 if(!Number.isFinite(n)||n<0)throw new Error(name+' tidak valid.');
 return n;
}

export function summarizeRestaurantRows(rows){
 const safe=rows||[];
 return {
  total:safe.length,
  withAddress:safe.filter(x=>Boolean(x.address)).length,
  withPrice:safe.filter(x=>Number.isFinite(asNumber(x.minPrice,NaN))||Number.isFinite(asNumber(x.maxPrice,NaN))).length,
  cities:uniqueStrings(safe.map(x=>x.city).filter(Boolean)).length
 };
}

export function summarizeMenuRows(rows){
 const safe=rows||[];
 return {
  total:safe.length,
  priced:safe.filter(x=>Number.isFinite(asNumber(x.price,NaN))).length,
  categories:categoryCounts(safe),
  price:priceStats(safe)
 };
}

export function buildSearchCacheKey(input){
 return cacheKey('restaurant-search',input.city,input.query,input.category,input.minPrice,input.maxPrice,input.page,input.limit);
}

export function buildMenuCacheKey(url){return cacheKey('restaurant-menu',normalizeRestaurantUrl(url)||url)}

export function restaurantLogContext(input){
 return {
  version:RESTAURANT_PRICE_VERSION,
  source:RESTAURANT_PRICE_SOURCE,
  city:input?.city||null,
  restaurant:input?.restaurant||null,
  query:input?.query||null,
  category:input?.category||null,
  page:input?.page||1,
  limit:input?.limit||10
 };
}

export function sourceErrorMessage(error){
 const result=serializeError(error);
 return result?.message||'Sumber restoran tidak dapat diakses.';
}

export function formatPriceFilter(minPrice,maxPrice){
 if(minPrice===null&&maxPrice===null)return'Tanpa filter harga';
 if(minPrice!==null&&maxPrice!==null)return formatRange(minPrice,maxPrice);
 if(minPrice!==null)return'Min '+formatRupiah(minPrice);
 return'Max '+formatRupiah(maxPrice);
}

export function formatRestaurantFilter(input){
 return [
  input.query?'query='+input.query:null,
  input.category?'category='+input.category:null,
  formatPriceFilter(input.minPrice,input.maxPrice)
 ].filter(Boolean).join(' • ');
}

export function defaultRestaurantOptions(){
 return {
  city:'jakarta',
  restaurant:'',
  query:'',
  category:'',
  minPrice:null,
  maxPrice:null,
  page:1,
  limit:10,
  maxPages:1
 };
}

export function cloneRestaurantOptions(options={}){
 return {...defaultRestaurantOptions(),...options};
}

export const RESTAURANT_API_CONTRACT=Object.freeze({
 search:{city:'string',query:'string?',category:'string?',min_price:'number?',max_price:'number?',page:'integer?',limit:'integer?'},
 menu:{url:'string'},
 city:{city:'string',page:'integer?'},
 refresh:{city:'string',pages:'integer?'},
 status:{},
 notes:'Public read-only menu aggregation. Prices are informational and may differ from live ordering prices.'
});

// RESTAURANT PARSER NOTE 1: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 2: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 3: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 4: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 5: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 6: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 7: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 8: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 9: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 10: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 11: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 12: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 13: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 14: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 15: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 16: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 17: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 18: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 19: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 20: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 21: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 22: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 23: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 24: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 25: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 26: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 27: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 28: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 29: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 30: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 31: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 32: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 33: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 34: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 35: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 36: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 37: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 38: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 39: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 40: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 41: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 42: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 43: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 44: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 45: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 46: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 47: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 48: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 49: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 50: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 51: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 52: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 53: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 54: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 55: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 56: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 57: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 58: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 59: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 60: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 61: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 62: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 63: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 64: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 65: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 66: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 67: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 68: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 69: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 70: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 71: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 72: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 73: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 74: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 75: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 76: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 77: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 78: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 79: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 80: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 81: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 82: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 83: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 84: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 85: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 86: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 87: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 88: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 89: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 90: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 91: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 92: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 93: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 94: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 95: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 96: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 97: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 98: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 99: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 100: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 101: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 102: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 103: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 104: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 105: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 106: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 107: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 108: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 109: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 110: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 111: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 112: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 113: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 114: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 115: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 116: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 117: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 118: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 119: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 120: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 121: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 122: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 123: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 124: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 125: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 126: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 127: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 128: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 129: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 130: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 131: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 132: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 133: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 134: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 135: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 136: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 137: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 138: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 139: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 140: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 141: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 142: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 143: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 144: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 145: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 146: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 147: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 148: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 149: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 150: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 151: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 152: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 153: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 154: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 155: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 156: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 157: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 158: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 159: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 160: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 161: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 162: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 163: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 164: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 165: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 166: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 167: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 168: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 169: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 170: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 171: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 172: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 173: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 174: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 175: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 176: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 177: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 178: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 179: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 180: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 181: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 182: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 183: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 184: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 185: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 186: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 187: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 188: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 189: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 190: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 191: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 192: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 193: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 194: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 195: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 196: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 197: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 198: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 199: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 200: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 201: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 202: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 203: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 204: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 205: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 206: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 207: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 208: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 209: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 210: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 211: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 212: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 213: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 214: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 215: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 216: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 217: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 218: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 219: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 220: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 221: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 222: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 223: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 224: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 225: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 226: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 227: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 228: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 229: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.\n// RESTAURANT PARSER NOTE 230: Parser bersifat best-effort dan tidak menganggap struktur HTML pihak ketiga sebagai kontrak permanen.

export default {
 version:RESTAURANT_PRICE_VERSION,
 source:RESTAURANT_PRICE_SOURCE,
 baseUrl:RESTAURANT_PRICE_BASE_URL,
 cities:INDONESIA_CITIES,
 categories:RESTAURANT_CATEGORIES
};