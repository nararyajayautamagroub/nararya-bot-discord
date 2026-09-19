export const RARITIES=['common','uncommon','rare','epic','legendary','mythic','secret'];

export const WEIGHTS={common:.50,uncommon:.25,rare:.13,epic:.07,legendary:.035,mythic:.014,secret:.001};

export const rarityInfo={
 common:{label:'Common',emoji:'⚪',color:0x94A3B8,multiplier:1.0,chance:50},
 uncommon:{label:'Uncommon',emoji:'🟢',color:0x22C55E,multiplier:1.15,chance:25},
 rare:{label:'Rare',emoji:'🔵',color:0x3B82F6,multiplier:1.35,chance:13},
 epic:{label:'Epic',emoji:'🟣',color:0x8B5CF6,multiplier:1.6,chance:7},
 legendary:{label:'Legendary',emoji:'🟠',color:0xF59E0B,multiplier:2.0,chance:3.5},
 mythic:{label:'Mythic',emoji:'🔴',color:0xEF4444,multiplier:2.75,chance:1.4},
 secret:{label:'Secret',emoji:'🌈',color:0xEC4899,multiplier:4.5,chance:0.1}
};

export function rollRarity(){
 let r=Math.random();
 for(const [key,weight] of Object.entries(WEIGHTS)){r-=weight;if(r<=0)return key}
 return 'common';
}
