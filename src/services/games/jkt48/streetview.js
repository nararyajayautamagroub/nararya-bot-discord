import {pick} from './index.js';

const LOCATIONS=[
{name:'Jakarta',region:'DKI Jakarta',lat:-6.2088,lng:106.8456,answers:['jakarta']},
{name:'Bandung',region:'Jawa Barat',lat:-6.9175,lng:107.6191,answers:['bandung']},
{name:'Bogor',region:'Jawa Barat',lat:-6.5971,lng:106.8060,answers:['bogor']},
{name:'Depok',region:'Jawa Barat',lat:-6.4025,lng:106.7942,answers:['depok']},
{name:'Bekasi',region:'Jawa Barat',lat:-6.2383,lng:106.9756,answers:['bekasi']},
{name:'Semarang',region:'Jawa Tengah',lat:-6.9667,lng:110.4167,answers:['semarang']},
{name:'Yogyakarta',region:'DI Yogyakarta',lat:-7.7956,lng:110.3695,answers:['yogyakarta','jogja']},
{name:'Surabaya',region:'Jawa Timur',lat:-7.2575,lng:112.7521,answers:['surabaya']},
{name:'Malang',region:'Jawa Timur',lat:-7.9666,lng:112.6326,answers:['malang']},
{name:'Denpasar',region:'Bali',lat:-8.6705,lng:115.2126,answers:['denpasar']},
{name:'Medan',region:'Sumatera Utara',lat:3.5952,lng:98.6722,answers:['medan']},
{name:'Palembang',region:'Sumatera Selatan',lat:-2.9761,lng:104.7754,answers:['palembang']},
{name:'Padang',region:'Sumatera Barat',lat:-0.9471,lng:100.4172,answers:['padang']},
{name:'Pekanbaru',region:'Riau',lat:0.5071,lng:101.4478,answers:['pekanbaru']},
{name:'Banjarmasin',region:'Kalimantan Selatan',lat:-3.3194,lng:114.5908,answers:['banjarmasin']},
{name:'Samarinda',region:'Kalimantan Timur',lat:-0.4948,lng:117.1436,answers:['samarinda']},
{name:'Makassar',region:'Sulawesi Selatan',lat:-5.1477,lng:119.4327,answers:['makassar','ujung pandang']},
{name:'Manado',region:'Sulawesi Utara',lat:1.4748,lng:124.8421,answers:['manado']},
{name:'Jayapura',region:'Papua',lat:-2.5916,lng:140.6690,answers:['jayapura']},
{name:'Mataram',region:'Nusa Tenggara Barat',lat:-8.5833,lng:116.1167,answers:['mataram','ntb']}
];

export async function createStreetViewQuestion(){
 const key=process.env.GOOGLE_MAPS_API_KEY;
 if(!key)throw new Error('GOOGLE_MAPS_API_KEY belum diatur. Street View menggunakan Google Maps Street View Static API.');
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
 return {answer:location.answers[0],answers:location.answers,mediaUrl:imageUrl.toString(),locationName:location.name,region:location.region,capturedAt:meta.date||null,source:'Google Street View Static API'};
}
