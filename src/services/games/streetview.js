import {pick} from './index.js';

const LOCATIONS=[
 {name:'Jakarta',country:'Indonesia',lat:-6.2088,lng:106.8456,answers:['jakarta']},
 {name:'Bandung',country:'Indonesia',lat:-6.9175,lng:107.6191,answers:['bandung']},
 {name:'Singapore',country:'Singapore',lat:1.3521,lng:103.8198,answers:['singapore']},
 {name:'Kuala Lumpur',country:'Malaysia',lat:3.139,lng:101.6869,answers:['kuala lumpur','malaysia']},
 {name:'Bangkok',country:'Thailand',lat:13.7563,lng:100.5018,answers:['bangkok','thailand']},
 {name:'Manila',country:'Philippines',lat:14.5995,lng:120.9842,answers:['manila','philippines']},
 {name:'Tokyo',country:'Japan',lat:35.6762,lng:139.6503,answers:['tokyo','japan']},
 {name:'Seoul',country:'South Korea',lat:37.5665,lng:126.978,answers:['seoul','south korea']},
 {name:'Delhi',country:'India',lat:28.6139,lng:77.209,answers:['delhi','india','new delhi']},
 {name:'Dubai',country:'United Arab Emirates',lat:25.2048,lng:55.2708,answers:['dubai','uae','united arab emirates']},
 {name:'Istanbul',country:'Türkiye',lat:41.0082,lng:28.9784,answers:['istanbul','turkey','türkiye']},
 {name:'London',country:'United Kingdom',lat:51.5074,lng:-0.1278,answers:['london','uk','united kingdom']},
 {name:'Paris',country:'France',lat:48.8566,lng:2.3522,answers:['paris','france']},
 {name:'Rome',country:'Italy',lat:41.9028,lng:12.4964,answers:['rome','italy']},
 {name:'Cairo',country:'Egypt',lat:30.0444,lng:31.2357,answers:['cairo','egypt']},
 {name:'Cape Town',country:'South Africa',lat:-33.9249,lng:18.4241,answers:['cape town','south africa']},
 {name:'Sydney',country:'Australia',lat:-33.8688,lng:151.2093,answers:['sydney','australia']},
 {name:'Vancouver',country:'Canada',lat:49.2827,lng:-123.1207,answers:['vancouver','canada']},
 {name:'New York',country:'United States',lat:40.7128,lng:-74.006,answers:['new york','usa','united states']},
 {name:'Mexico City',country:'Mexico',lat:19.4326,lng:-99.1332,answers:['mexico city','mexico']},
 {name:'Sao Paulo',country:'Brazil',lat:-23.5505,lng:-46.6333,answers:['sao paulo','brazil']},
 {name:'Buenos Aires',country:'Argentina',lat:-34.6037,lng:-58.3816,answers:['buenos aires','argentina']}
];

export async function createStreetViewQuestion(){
 const key=process.env.GOOGLE_MAPS_API_KEY;
 if(!key)throw new Error('GOOGLE_MAPS_API_KEY belum diatur.');
 const location=pick(LOCATIONS);
 const metaUrl=new URL('https://maps.googleapis.com/maps/api/streetview/metadata');
 metaUrl.searchParams.set('location',location.lat+','+location.lng);
 metaUrl.searchParams.set('key',key);
 const metaRes=await fetch(metaUrl);
 if(!metaRes.ok)throw new Error('Street View metadata gagal: HTTP '+metaRes.status);
 const meta=await metaRes.json();
 if(meta.status!=='OK')throw new Error('Tidak ada panorama Street View di titik yang dipilih.');
 const heading=Math.floor(Math.random()*360);
 const fov=70+Math.floor(Math.random()*35);
 const imageUrl=new URL('https://maps.googleapis.com/maps/api/streetview');
 imageUrl.searchParams.set('size','640x640');
 imageUrl.searchParams.set('location',location.lat+','+location.lng);
 imageUrl.searchParams.set('heading',String(heading));
 imageUrl.searchParams.set('pitch','0');
 imageUrl.searchParams.set('fov',String(fov));
 imageUrl.searchParams.set('key',key);
 const imageRes=await fetch(imageUrl);
 if(!imageRes.ok)throw new Error('Street View image gagal: HTTP '+imageRes.status);
 const buffer=Buffer.from(await imageRes.arrayBuffer());
 return {
   answer:location.answers[0],
   answers:location.answers,
   buffer,
   locationName:location.name,
   country:location.country,
   capturedAt:meta.date||null,
   source:'Google Street View Static API'
 };
}
