export const SCRAPER_REGISTRY=[
 {key:'news.antaranews.latest',url:'https://www.antaranews.com/rss/terkini.xml',intervalMs:24*60*60*1000,group:'news'},
 {key:'news.antaranews.top',url:'https://www.antaranews.com/rss/top-news.xml',intervalMs:24*60*60*1000,group:'news'},
 {key:'news.antaranews.economy',url:'https://www.antaranews.com/rss/ekonomi.xml',intervalMs:24*60*60*1000,group:'news'},
 {key:'news.antaranews.finance',url:'https://www.antaranews.com/rss/ekonomi-finansial.xml',intervalMs:24*60*60*1000,group:'news'},
 {key:'news.antaranews.business',url:'https://www.antaranews.com/rss/ekonomi-bisnis.xml',intervalMs:24*60*60*1000,group:'news'},
 {key:'news.antaranews.market',url:'https://www.antaranews.com/rss/ekonomi-bursa.xml',intervalMs:24*60*60*1000,group:'news'},
 {key:'news.antaranews.politics',url:'https://www.antaranews.com/rss/politik.xml',intervalMs:24*60*60*1000,group:'news'},
 {key:'news.antaranews.law',url:'https://www.antaranews.com/rss/hukum.xml',intervalMs:24*60*60*1000,group:'news'},
 {key:'price.pertamina',url:'https://www.mypertamina.id/',intervalMs:24*60*60*1000,group:'prices'},
 {key:'price.pln',url:'https://web.pln.co.id/pelanggan/tarif-tenaga-listrik',intervalMs:24*60*60*1000,group:'prices'},
 {key:'price.pihps',url:'https://www.bi.go.id/hargapangan/Website',intervalMs:24*60*60*1000,group:'prices'},
 {key:'disaster.bmkg.earthquake',url:'https://www.bmkg.go.id/gempabumi',intervalMs:60*1000,group:'disaster'},
 {key:'disaster.bmkg.tsunami',url:'https://www.bmkg.go.id/gempabumi/berpotensi-tsunami',intervalMs:60*1000,group:'disaster'},
 {key:'market.yahoo.idx',url:'https://query1.finance.yahoo.com/v8/finance/chart/BBCA.JK?range=1d&interval=1d',intervalMs:10*60*1000,group:'market'},
 {key:'streetview.google',url:'https://maps.googleapis.com/',intervalMs:10*60*1000,group:'game'},
 {key:'disaster.bnpb.weekly',url:'https://gis.bnpb.go.id/server/rest/services/Kejadian_Bencana_Mingguan/MapServer/25',intervalMs:5*60*1000,group:'disaster'},
 {key:'disaster.magma',url:'https://magma.esdm.go.id/',intervalMs:5*60*1000,group:'disaster'},
 {key:'ramadan.kemenag',url:'https://www.kemenag.go.id/',intervalMs:24*60*60*1000,group:'ramadan'},
 {key:'prayer.myquran',url:'https://api.myquran.com/v2/sholat/kota/cari/jakarta',intervalMs:24*60*60*1000,group:'ramadan'}
];

export function getScraperDefinition(key){return SCRAPER_REGISTRY.find(x=>x.key===key)||null}
