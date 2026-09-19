import test from 'node:test';
import assert from 'node:assert/strict';
import {matches,normalize,MODES} from '../src/services/games/jkt48/index.js';
import {FEATURE_REGISTRY} from '../src/config/features.js';
import {getElectronicsPrices,ELECTRONICS_SOURCES} from '../src/services/indonesia/electronics.js';
import {createStreetViewQuestion} from '../src/services/games/streetview.js';
import {upcomingRamadan} from '../src/services/indonesia/data.js';

test('Street View module is generic and available',()=>{
 assert.equal(typeof createStreetViewQuestion,'function');
});

test('quiz answer matching remains normalization based',()=>{
 assert.equal(normalize('  Yogyakarta! '),'yogyakarta');
 assert.equal(matches('Jogja',['Yogyakarta','jogja']),true);
 assert.equal(matches('Surabaya',['Jakarta']),false);
});

test('Ramadan data exposes the configured 1448 H estimate',()=>{
 const data=upcomingRamadan();
 assert.equal(data.hijri,'1448 H');
 assert.match(data.estimatedStart,/^2027-02-/);
 assert.match(data.estimatedEnd,/^2027-03-/);
});

test('Street View is not registered as a JKT48 mode',()=>{
 assert.equal(MODES.streetView,undefined);
});

test('feature registry contains the current implemented catalog',()=>{
 assert.ok(FEATURE_REGISTRY.length>=57);
});

test('electronics scraper exposes public category sources',()=>{
 assert.match(ELECTRONICS_SOURCES.electronics,/bandingin\\.id\\/kategori\\/elektronik/);
 assert.match(ELECTRONICS_SOURCES.audio,/bandingin\\.id\\/kategori\\/audio/);
 assert.equal(typeof getElectronicsPrices,'function');
});
