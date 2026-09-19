import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeHeaders,normalizeHttpOptions,classifyStatus,isRetryableResponse,buildConditionalHeaders,parseRetryAfterHeader,safeUrl,sameUrl,redactUrl,combineSignals} from '../src/tools/http-client.js';

test('HTTP option normalization is deterministic',()=>{
 const result=normalizeHttpOptions({timeoutMs:2500,retries:3,method:'post',headers:{'x-test':'ok'}});
 assert.equal(result.timeoutMs,2500);
 assert.equal(result.retries,3);
 assert.equal(result.method,'POST');
 assert.equal(result.headers['x-test'],'ok');
});

test('HTTP status classification and retry policy are correct',()=>{
 assert.equal(classifyStatus(200),'success');
 assert.equal(classifyStatus(429),'rate_limit');
 assert.equal(classifyStatus(503),'server_error');
 assert.equal(classifyStatus(404),'client_error');
 assert.equal(isRetryableResponse({status:429}),true);
 assert.equal(isRetryableResponse({status:400}),false);
});

test('HTTP conditional and retry-after helpers are safe',()=>{
 assert.deepEqual(buildConditionalHeaders({etag:'abc',lastModified:'yesterday'}),{'if-none-match':'abc','if-modified-since':'yesterday'});
 assert.equal(parseRetryAfterHeader('2'),2000);
 assert.equal(safeUrl('https://example.com/a#fragment'),'https://example.com/a');
 assert.equal(sameUrl('https://example.com/a#x','https://example.com/a'),true);
 assert.equal(redactUrl('https://example.com/?token=secret&x=1'),'https://example.com/?x=1');
});

test('caller and timeout abort signals are combined',()=>{
 const caller=new AbortController();
 const timeout=new AbortController();
 const signal=combineSignals(caller.signal,timeout.signal);
 assert.equal(signal.aborted,false);
 caller.abort(new Error('caller cancelled'));
 assert.equal(signal.aborted,true);
});
