import test from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import {createWebAuthService} from "../src/web/auth/service.js";
import {createWebsiteServer} from "../src/web/website/server.js";
import {createVerificationService} from "../src/security/verification.js";

test("website runtime wires health, auth, cookies, and CSP",async()=>{
  const previous={
    host:process.env.WEBSITE_HOST,port:process.env.WEBSITE_PORT,disabled:process.env.WEBSITE_DISABLED,
    publicUrl:process.env.WEBSITE_PUBLIC_URL,
    googleClientId:process.env.GOOGLE_CLIENT_ID,
    googleClientSecret:process.env.GOOGLE_CLIENT_SECRET,
    googleRedirectUri:process.env.GOOGLE_REDIRECT_URI
  };
  process.env.WEBSITE_HOST="127.0.0.1";
  process.env.WEBSITE_PORT="0";
  process.env.WEBSITE_DISABLED="false";
  delete process.env.WEBSITE_PUBLIC_URL;
  delete process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_SECRET;
  delete process.env.GOOGLE_REDIRECT_URI;

  const db=new Database(":memory:");
  const auth=createWebAuthService({db});
  const verification=createVerificationService({db,baseUrl:"http://127.0.0.1"});
  const website=createWebsiteServer({
    db,
    authService:auth,
    verificationService:verification,
    featureRegistry:[],
    scraperOrchestrator:{status:()=>[]}
  });
  website.start();
  await new Promise(resolve=>website.server.once("listening",resolve));
  const port=website.server.address().port;
  const base="http://127.0.0.1:"+port;

  try{
    const health=await fetch(base+"/health");
    assert.equal(health.status,200);
    assert.equal((await health.json()).ok,true);

    const readiness=await fetch(base+"/ready");
    assert.equal(readiness.status,200);
    const before=await fetch(base+"/api/v1/auth/me");
    assert.equal(before.status,200);
    assert.equal((await before.json()).user,null);

    const register=await fetch(base+"/api/auth/register",{
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify({username:"web_test",email:"web@example.com",password:"strong-pass-123",displayName:"Web Test"})
    });
    assert.equal(register.status,201);
    const sessionCookie=register.headers.get("set-cookie");
    assert.ok(sessionCookie?.includes("nararya_web_session="));

    const me=await fetch(base+"/api/v1/auth/me",{headers:{cookie:sessionCookie.split(";")[0]}});
    assert.equal((await me.json()).user.username,"web_test");

    const html=await fetch(base+"/index.html");
    assert.equal(html.status,200);
    assert.match(html.headers.get("content-security-policy")||"",/connect-src 'self' https:\/\/raw\.githubusercontent\.com/);
  }finally{
    await new Promise(resolve=>website.server.close(resolve));
    db.close();
    const restore={host:"WEBSITE_HOST",port:"WEBSITE_PORT",disabled:"WEBSITE_DISABLED",publicUrl:"WEBSITE_PUBLIC_URL",googleClientId:"GOOGLE_CLIENT_ID",googleClientSecret:"GOOGLE_CLIENT_SECRET",googleRedirectUri:"GOOGLE_REDIRECT_URI"};
    for(const [key,envName] of Object.entries(restore)){
      const value=previous[key];
      if(value===undefined)delete process.env[envName];else process.env[envName]=value;
    }
  }
});
