export function getAssets(db,kind){return db.prepare('SELECT * FROM quiz_assets WHERE active=1 AND kind=? ORDER BY RANDOM()').all(kind)}
export function addAsset(db,kind,answer,mediaUrl,rarity=null){db.prepare('INSERT INTO quiz_assets(kind,answer,media_url,rarity,created_at) VALUES(?,?,?,?,?)').run(kind,answer,mediaUrl,rarity,Date.now())}
