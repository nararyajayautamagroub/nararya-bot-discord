import test from 'node:test';
import assert from 'node:assert/strict';
import {MODES,matches,normalize} from '../src/services/games/jkt48/index.js';
import {upcomingRamadan} from '../src/services/indonesia/data.js';

test('Street View quiz mode is registered',()=>{
 assert.equal(MODES.streetView,'Tebak lokasi dari Google Street View');
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
