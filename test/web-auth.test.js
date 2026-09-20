import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import {createWebAuthService} from '../src/web/auth/service.js';

function service(){
  const db=new Database(':memory:');
  return {db,auth:createWebAuthService({db})};
}

test('web auth registers, logs in, sessions, and settings safely',()=>{
  const {db,auth}=service();
  const registered=auth.register({username:'rafa_test',email:'rafa@example.com',password:'strong-pass-123',displayName:'Rafa'});
  assert.equal(registered.user.email,'rafa@example.com');
  assert.ok(registered.token);
  assert.ok(auth.userFromSession(registered.token));

  const logged=auth.login({email:'rafa@example.com',password:'strong-pass-123'});
  assert.equal(logged.user.username,'rafa_test');
  assert.ok(auth.userFromSession(logged.token));

  const updated=auth.updateSettings(registered.user.id,{language:'ja',theme:'dark',timezone:'Asia/Tokyo'});
  assert.equal(updated.language,'ja');
  assert.equal(updated.theme,'dark');
  assert.equal(updated.timezone,'Asia/Tokyo');

  auth.revokeSession(logged.token);
  assert.equal(auth.userFromSession(logged.token),null);
  db.close();
});

test('web auth rejects duplicate and weak credentials',()=>{
  const {db,auth}=service();
  auth.register({username:'first_user',email:'first@example.com',password:'strong-pass-123',displayName:'First'});
  assert.throws(()=>auth.register({username:'first_user',email:'other@example.com',password:'strong-pass-123',displayName:'Second'}),/Username sudah digunakan/);
  assert.throws(()=>auth.register({username:'second_user',email:'first@example.com',password:'strong-pass-123',displayName:'Second'}),/Email sudah terdaftar/);
  assert.throws(()=>auth.register({username:'x',email:'bad',password:'123',displayName:'x'}));
  db.close();
});

test('google login does not auto-link an unverified local account',()=>{
  const {db,auth}=service();
  auth.register({username:'local_user',email:'same@example.com',password:'strong-pass-123',displayName:'Local'});
  assert.throws(()=>auth.upsertGoogleProfile({sub:'google-sub',email:'same@example.com',email_verified:true,name:'Google User'}),/akun lokal/);
  db.close();
});

test('oauth state is single-use and expires by policy',()=>{
  const {db,auth}=service();
  const state=auth.createOAuthState({provider:'google',returnTo:'/#home'});
  const consumed=auth.consumeOAuthState(state.state);
  assert.equal(consumed.provider,'google');
  assert.throws(()=>auth.consumeOAuthState(state.state),/expired or invalid/);
  db.close();
});
