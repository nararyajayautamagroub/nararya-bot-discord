import test from 'node:test';
import assert from 'node:assert/strict';
import {assertResolution,safeName} from '../src/media/utils.js';
import {validateUrl} from '../src/media/download.js';

test('media resolution validation accepts supported values',()=>{
 assert.equal(assertResolution('1080p'),'1080p');
 assert.equal(assertResolution('best'),'best');
});

test('media resolution validation rejects unsupported values',()=>{
 assert.throws(()=>assertResolution('123p'),/Unsupported resolution/);
});

test('media URL validation accepts HTTP and HTTPS',()=>{
 assert.equal(validateUrl('https://example.com/video'),'https://example.com/video');
 assert.equal(validateUrl('http://example.com/image.jpg'),'http://example.com/image.jpg');
});

test('media URL validation rejects non-web protocols',()=>{
 assert.throws(()=>validateUrl('file:///tmp/test.mp4'),/Only http and https URLs are supported/);
});

test('media filenames are normalized',()=>{
 assert.equal(safeName('hello world!.mp4'),'hello-world-.mp4');
});
