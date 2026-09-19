export const MODES={
 song:'Tebak suara lagu',
 memberVoice:'Tebak suara member JKT48',
 activePhoto:'Tebak member dari foto active',
 graduationPhoto:'Tebak member dari foto graduation',
 randomMember:'Tebak member random',
 setlistPhoto:'Tebak foto setlist',
 songPhoto:'Tebak lagu dari foto'
};
export const RARITIES=['common','uncommon','rare','epic','legendary','mythic','secret'];
export const WEIGHTS={common:.50,uncommon:.25,rare:.13,epic:.07,legendary:.035,mythic:.014,secret:.001};
export const rarityEmoji={common:'⚪',uncommon:'🟢',rare:'🔵',epic:'🟣',legendary:'🟠',mythic:'🔴',secret:'🌈'};
export const rarityInfo={
 common:{label:'Common',emoji:'⚪',color:0x94A3B8,multiplier:1.0},
 uncommon:{label:'Uncommon',emoji:'🟢',color:0x22C55E,multiplier:1.15},
 rare:{label:'Rare',emoji:'🔵',color:0x3B82F6,multiplier:1.35},
 epic:{label:'Epic',emoji:'🟣',color:0x8B5CF6,multiplier:1.6},
 legendary:{label:'Legendary',emoji:'🟠',color:0xF59E0B,multiplier:2.0},
 mythic:{label:'Mythic',emoji:'🔴',color:0xEF4444,multiplier:2.75},
 secret:{label:'Secret',emoji:'🌈',color:0xEC4899,multiplier:4.5}
};
export function normalize(v=''){return v.normalize('NFKC').toLowerCase().replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim()}
export function matches(input,answers=[]){const n=normalize(input);return answers.some(x=>normalize(x)===n)}
export function rollRarity(){let r=Math.random();for(const [k,w] of Object.entries(WEIGHTS)){r-=w;if(r<=0)return k}return'common'}
export function rollGacha(members=[]){const member=pick(members),rarity=rollRarity();return member?{member,rarity,emoji:rarityEmoji[rarity]}:null}
export function pick(items=[]){return items.length?items[Math.floor(Math.random()*items.length)]:null}
export function ensureTables(db){db.exec('CREATE TABLE IF NOT EXISTS jkt48_game_assets(id INTEGER PRIMARY KEY AUTOINCREMENT,kind TEXT NOT NULL,answer TEXT NOT NULL,media_url TEXT NOT NULL,active INTEGER DEFAULT 1);')}
export function validMedia(url=''){try{return['http:','https:'].includes(new URL(url).protocol)}catch{return false}}
