import {pick} from './rng.js';
export const MODES={song:'Tebak suara lagu',memberVoice:'Tebak suara member JKT48',activePhoto:'Tebak member dari foto active',graduationPhoto:'Tebak member dari foto graduation',randomMember:'Tebak member random',setlistPhoto:'Tebak foto setlist',songPhoto:'Tebak lagu dari foto'};
export const RARITIES=['common','uncommon','rare','epic','legendary','mythic','secret'];
export const WEIGHTS={common:.50,uncommon:.25,rare:.13,epic:.07,legendary:.035,mythic:.014,secret:.001};
export const rarityEmoji={common:'⚪',uncommon:'🟢',rare:'🔵',epic:'🟣',legendary:'🟠',mythic:'🔴',secret:'🌈'};
export function normalize(v=''){return v.normalize('NFKC').toLowerCase().replace(/[^a-z0-9\\s]/g,' ').replace(/\\s+/g,' ').trim()}
export function matches(input,answers=[]){const n=normalize(input);return answers.some(x=>normalize(x)===n)}
export function rollRarity(){let r=Math.random();for(const [k,w] of Object.entries(WEIGHTS)){r-=w;if(r<=0)return k}return'common'}
export function rollGacha(members=[]){const member=pick(members),rarity=rollRarity();return member?{member,rarity,emoji:rarityEmoji[rarity]}:null}
export function pick(items=[]){return items.length?items[Math.floor(Math.random()*items.length)]:null}
export function ensureTables(db){db.exec('CREATE TABLE IF NOT EXISTS jkt48_game_scores(guild_id TEXT,user_id TEXT,points INTEGER DEFAULT 0,games INTEGER DEFAULT 0,wins INTEGER DEFAULT 0,PRIMARY KEY(guild_id,user_id)); CREATE TABLE IF NOT EXISTS jkt48_gacha(guild_id TEXT,user_id TEXT,member_key TEXT,rarity TEXT,count INTEGER DEFAULT 1,PRIMARY KEY(guild_id,user_id,member_key,rarity)); CREATE TABLE IF NOT EXISTS jkt48_game_assets(id INTEGER PRIMARY KEY AUTOINCREMENT,kind TEXT NOT NULL,answer TEXT NOT NULL,media_url TEXT NOT NULL,active INTEGER DEFAULT 1);')}
export function validMedia(url=''){try{return['http:','https:'].includes(new URL(url).protocol)}catch{return false}}
