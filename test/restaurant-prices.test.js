import test from 'node:test';
import assert from 'node:assert/strict';
import {FEATURE_REGISTRY} from '../src/config/features.js';
import {
 parseRestaurantDirectoryHtml,
 parseRestaurantMenuHtml,
 filterMenuItems,
 priceStats,
 resolveRestaurantCity,
 resolveRestaurantCategory,
 RESTAURANT_CITY_SOURCE_MAP,
 filterRestaurants,
 restaurantMenuJson
} from '../src/services/restaurant/prices.js';

const directoryHtml=`
<html><body>
<h1>Daftar Harga Menu Delivery Restoran di Depok Terbaru 2026</h1>
<div>
 <a href="/menu/1234/ayam-enak-depok">Ayam Enak, Depok</a>
 <div>Ayam & Bebek Aneka Nasi Jl. Raya Depok Rp 15.000 - Rp 45.000</div>
</div>
</body></html>`;

const menuHtml=`
<html><body>
<h1>Daftar Harga Menu Delivery Ayam Enak, Depok Terbaru 2026</h1>
<p>Diperbarui pada 20 September 2026 oleh Tim Menu Kuliner</p>
<h3>Harga Menu Ayam</h3>
<table>
<tr><th>Nama Menu</th><th>Harga</th></tr>
<tr><td>Ayam Bakar</td><td>Rp 25.000</td></tr>
<tr><td>Ayam Goreng</td><td>Rp 22.500</td></tr>
<tr><td>Paket Hemat</td><td>Rp 30.000</td></tr>
</table>
</body></html>`;

test('restaurant feature registry reaches 151',()=>{
 assert.equal(FEATURE_REGISTRY.length,151);
 assert.equal(new Set(FEATURE_REGISTRY.map(x=>x.id)).size,FEATURE_REGISTRY.length);
});

test('restaurant directory parser extracts public restaurant entries',()=>{
 const data=parseRestaurantDirectoryHtml(directoryHtml,{page:1,sourceUrl:'https://menukuliner.net/menu/depok'});
 assert.equal(data.restaurants.length,1);
 assert.equal(data.restaurants[0].name,'Ayam Enak, Depok');
 assert.equal(data.restaurants[0].minPrice,15000);
 assert.equal(data.restaurants[0].maxPrice,45000);
});

test('restaurant menu parser extracts menu names and prices',()=>{
 const data=parseRestaurantMenuHtml(menuHtml,{sourceUrl:'https://menukuliner.net/menu/1234/ayam-enak-depok'});
 assert.ok(data.items.length>=3);
 assert.equal(data.items.find(x=>x.name==='Ayam Bakar')?.price,25000);
 assert.equal(data.minPrice,22500);
 assert.equal(data.maxPrice,30000);
});

test('restaurant filters and price stats work',()=>{
 const data=parseRestaurantMenuHtml(menuHtml,{sourceUrl:'https://menukuliner.net/menu/1234/ayam-enak-depok'});
 const filtered=filterMenuItems(data.items,{query:'ayam',maxPrice:25000});
 assert.ok(filtered.some(x=>x.name==='Ayam Bakar'));
 assert.ok(filtered.some(x=>x.name==='Ayam Goreng'));
 const stats=priceStats(data.items);
 assert.equal(stats.count,3);
 assert.equal(stats.min,22500);
 assert.equal(stats.max,30000);
});

test('restaurant city and category resolution supports common Indonesia inputs',()=>{
 assert.equal(resolveRestaurantCity('Depok'),'depok');
 assert.equal(resolveRestaurantCity('Jakarta'),'jakarta');
 assert.equal(resolveRestaurantCategory('Bakmie'),'bakmie');
 assert.equal(resolveRestaurantCategory('Ayam & Bebek'),'ayam & bebek');
});

test('restaurant menu JSON output remains source-attributed',()=>{
 const data=parseRestaurantMenuHtml(menuHtml,{sourceUrl:'https://menukuliner.net/menu/1234/ayam-enak-depok'});
 const result=restaurantMenuJson(data);
 assert.equal(result.source.name,'MenuKuliner.net');
 assert.equal(result.items.length>=3,true);
});


test('restaurant city aliases route to the correct source dataset',()=>{
 assert.equal(RESTAURANT_CITY_SOURCE_MAP.depok,'jakarta');
 const rows=[{name:'Kedai Depok',city:'Jakarta',address:'Jl. Raya Depok, Beji, Depok',categories:['Aneka Nasi'],minPrice:10000,maxPrice:25000}];
 assert.equal(filterRestaurants(rows,{city:'depok'}).length,1);
 assert.equal(filterRestaurants(rows,{city:'bekasi'}).length,0);
});
