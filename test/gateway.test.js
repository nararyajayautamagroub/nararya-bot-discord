import test from "node:test";
import assert from "node:assert/strict";
import {createWebGateway} from "../src/web/gateway/index.js";

test("web gateway enforces request ids, rate limits, origin checks, and body limits",async()=>{
  const gateway=createWebGateway({publicUrl:"https://example.test",bodyLimitBytes:32,defaultLimit:2,windowMs:60000});
  const req={headers:{origin:"https://example.test","x-request-id":"client-request-123"},on(event,handler){
    if(event==="data")queueMicrotask(()=>handler(Buffer.from('{"ok":true}')));
    if(event==="end")queueMicrotask(()=>handler());
    return this;
  }};
  assert.equal(gateway.requestId(req),"client-request-123");
  assert.equal(gateway.originAllowed(req),true);
  assert.equal(gateway.rateLimit("127.0.0.1","test",2),true);
  assert.equal(gateway.rateLimit("127.0.0.1","test",2),true);
  assert.equal(gateway.rateLimit("127.0.0.1","test",2),false);
  assert.deepEqual(await gateway.readJson(req),{ok:true});
  assert.equal(gateway.securityHeaders()["X-Frame-Options"],"DENY");
  gateway.close();
});
