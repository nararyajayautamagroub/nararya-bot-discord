import {createApiClient} from "./runtime/api.js";
import {initDeviceRuntime} from "./runtime/device.js";
const CONFIG={
  allUrl:"https://raw.githubusercontent.com/FrenzY8/JKT48-Member/refs/heads/main/AllMember.json",
  activeUrl:"https://raw.githubusercontent.com/FrenzY8/JKT48-Member/refs/heads/main/ActiveMember.json",
  timeoutMs:10000,retries:2,maxMembers:500,pageSize:12
};

const LANGS=[
  ["id","Bahasa Indonesia"],["en","English"],["ja","日本語"],["ko","한국어"],["zh","简体中文"],
  ["ar","العربية"],["es","Español"],["pt","Português"],["fr","Français"],["de","Deutsch"]
];

const I18N={
 id:{
  "nav.home":"Home","nav.members":"Members","nav.features":"Features","nav.games":"Games","nav.feeds":"Feeds","nav.commands":"Commands","nav.sources":"Sources",
  "hero.eyebrow":"JKT48 FEATURE CENTER","hero.title":"Semua fitur JKT48<br><span>dalam satu tempat.</span>","hero.description":"Pusat informasi database member, game JKT48, koleksi card, feed notifikasi, command Discord, scraper, dan sumber data publik.","hero.members":"Lihat Member","hero.features":"Jelajahi Fitur","hero.database":"JKT48 Member Database","hero.databaseDesc":"Data member aktif dan historis generasi 1–14 dari sumber JSON publik.",
  "stats.members":"Member","stats.generations":"Generasi","stats.active":"Aktif","stats.web":"Web",
  "features.title":"Fitur JKT48","features.description":"Frontend dan bot berbagi sumber data serta status sistem.","features.member":"Member Database","features.memberDesc":"Cari member, generasi, status, profil, dan sosial media publik.","features.schedule":"Upcoming & Latest","features.scheduleDesc":"Event, theater, setlist, songs, live, birthday, dan graduation.","features.games":"Quiz & Games","features.gamesDesc":"Quiz, game, cooldown, timeout, XP, dan leaderboard.","features.cards":"Gacha & Cards","features.cardsDesc":"Koleksi card JKT48 dari Common sampai Secret.","features.feeds":"Platform Feeds","features.feedsDesc":"Website, IDN, SHOWROOM, YouTube, Instagram, TikTok, X, Threads, dan shop.","features.account":"Account & Settings","features.accountDesc":"Login, register, Google Login, bahasa, tema, timezone, dan keamanan akun.",
  "members.title":"Member JKT48","members.description":"Data dimuat dari sumber publik. Website tidak mengarang data saat source gagal.","members.search":"Cari nama atau nickname...","members.allGenerations":"Semua Generasi","members.allStatus":"Semua Status","members.active":"Aktif","members.graduated":"Graduated","members.historical":"Historical","members.empty":"Data member tidak ditemukan.","members.emptyDesc":"Coba kata kunci atau filter lain.","members.error":"Sumber data JKT48 tidak dapat dibaca.",
  "games.title":"Game JKT48","games.description":"Game dimainkan melalui Discord, website menjadi pusat informasi.","games.rules":"Aturan game","games.rulesDesc":"Cooldown quiz/gacha 10 detik per user. Sesi tebak maksimal 1 menit.",
  "feeds.title":"Feed & Scraper JKT48","feeds.description":"Adapter publik dan scraper dipantau backend.","feeds.scraperTitle":"Health monitoring","feeds.scraperLoading":"Memuat status scraper...",
  "commands.title":"Command JKT48","commands.description":"Command dapat digunakan di server Discord yang memiliki Nararya Bot.",
  "sources.title":"Sumber & transparansi","sources.description":"Status sumber ditampilkan terbuka. Data website read-only untuk data publik.",
  "common.open":"Buka →","common.commands":"Commands →","common.view":"Lihat →","common.openSettings":"Buka Settings →","common.refresh":"Refresh","common.loading":"Memuat...","common.previous":"← Sebelumnya","common.next":"Berikutnya →",
  "auth.login":"Login","auth.register":"Register","auth.loginTitle":"Masuk ke akun","auth.loginDesc":"Gunakan email dan password atau Google Login.","auth.google":"Continue with Google","auth.or":"atau","auth.username":"Username","auth.displayName":"Nama tampilan","auth.email":"Email","auth.password":"Password","auth.logout":"Logout","auth.currentPassword":"Password saat ini","auth.newPassword":"Password baru",
  "settings.title":"Settings","settings.desc":"Atur bahasa, tema, timezone, dan keamanan akun.","settings.language":"Language","settings.theme":"Theme","settings.timezone":"Timezone","settings.save":"Simpan Settings","settings.passwordTitle":"Ganti Password","settings.changePassword":"Ganti Password",
  "status.online":"Online","status.error":"Error","status.loading":"Loading","members.resultLabel":"members","members.page":"Page","feeds.scraperSummary":"Scrapers: {total} • OK: {ok} • Error: {error}","auth.loginSuccess":"Login successful.","auth.registerSuccess":"Registration successful."
 },
 en:{
  "nav.home":"Home","nav.members":"Members","nav.features":"Features","nav.games":"Games","nav.feeds":"Feeds","nav.commands":"Commands","nav.sources":"Sources",
  "hero.eyebrow":"JKT48 FEATURE CENTER","hero.title":"Every JKT48 feature<br><span>in one place.</span>","hero.description":"Member database, JKT48 games, card collection, notifications, Discord commands, scraper health, and public data sources.","hero.members":"View Members","hero.features":"Explore Features","hero.database":"JKT48 Member Database","hero.databaseDesc":"Active and historical members from generations 1–14 using public JSON sources.",
  "stats.members":"Members","stats.generations":"Generations","stats.active":"Active","stats.web":"Web",
  "features.title":"JKT48 Features","features.description":"The website and bot share data sources and health information.","features.member":"Member Database","features.memberDesc":"Search members, generations, status, profiles, and public social links.","features.schedule":"Upcoming & Latest","features.scheduleDesc":"Events, theater, setlists, songs, live, birthdays, and graduations.","features.games":"Quiz & Games","features.gamesDesc":"Quizzes, games, cooldowns, timeouts, XP, and leaderboards.","features.cards":"Gacha & Cards","features.cardsDesc":"Collect JKT48 cards from Common to Secret.","features.feeds":"Platform Feeds","features.feedsDesc":"Website, IDN, SHOWROOM, YouTube, Instagram, TikTok, X, Threads, and shops.","features.account":"Account & Settings","features.accountDesc":"Login, register, Google Login, language, theme, timezone, and account security.",
  "members.title":"JKT48 Members","members.description":"Loaded from public sources. The website does not invent data when a source fails.","members.search":"Search name or nickname...","members.allGenerations":"All Generations","members.allStatus":"All Status","members.active":"Active","members.graduated":"Graduated","members.historical":"Historical","members.empty":"No members found.","members.emptyDesc":"Try another search or filter.","members.error":"JKT48 data source cannot be read.",
  "games.title":"JKT48 Games","games.description":"Games run on Discord; the website is the information center.","games.rules":"Game rules","games.rulesDesc":"Quiz/gacha cooldown is 10 seconds per user. Guess sessions last up to 1 minute.",
  "feeds.title":"JKT48 Feeds & Scraper","feeds.description":"Public adapters and scraper health are monitored by the backend.","feeds.scraperTitle":"Health monitoring","feeds.scraperLoading":"Loading scraper status...",
  "commands.title":"JKT48 Commands","commands.description":"Commands work in Discord servers where Nararya Bot is installed.",
  "sources.title":"Sources & transparency","sources.description":"Source status is shown openly. Public data on this website is read-only.",
  "common.open":"Open →","common.commands":"Commands →","common.view":"View →","common.openSettings":"Open Settings →","common.refresh":"Refresh","common.loading":"Loading...","common.previous":"← Previous","common.next":"Next →",
  "auth.login":"Login","auth.register":"Register","auth.loginTitle":"Sign in","auth.loginDesc":"Use email and password or Google Login.","auth.google":"Continue with Google","auth.or":"or","auth.username":"Username","auth.displayName":"Display name","auth.email":"Email","auth.password":"Password","auth.logout":"Logout","auth.currentPassword":"Current password","auth.newPassword":"New password",
  "settings.title":"Settings","settings.desc":"Set language, theme, timezone, and account security.","settings.language":"Language","settings.theme":"Theme","settings.timezone":"Timezone","settings.save":"Save Settings","settings.passwordTitle":"Change Password","settings.changePassword":"Change Password",
  "status.online":"Online","status.error":"Error","status.loading":"Loading","members.resultLabel":"members","members.page":"Page","feeds.scraperSummary":"Scrapers: {total} • OK: {ok} • Error: {error}","auth.loginSuccess":"Login successful.","auth.registerSuccess":"Registration successful."
 }
};

for(const code of ["ja","ko","zh","ar","es","pt","fr","de"])I18N[code]={...I18N.en};
Object.assign(I18N.ja,{"nav.home":"ホーム","nav.members":"メンバー","nav.features":"機能","nav.games":"ゲーム","nav.feeds":"フィード","nav.commands":"コマンド","nav.sources":"ソース","hero.members":"メンバーを見る","hero.features":"機能を見る","features.title":"JKT48機能","members.title":"JKT48メンバー","auth.login":"ログイン","auth.register":"登録","settings.title":"設定","settings.save":"設定を保存"});
Object.assign(I18N.ko,{"nav.home":"홈","nav.members":"멤버","nav.features":"기능","nav.games":"게임","nav.feeds":"피드","nav.commands":"명령어","nav.sources":"소스","hero.members":"멤버 보기","hero.features":"기능 보기","features.title":"JKT48 기능","members.title":"JKT48 멤버","auth.login":"로그인","auth.register":"회원가입","settings.title":"설정","settings.save":"설정 저장"});
Object.assign(I18N.zh,{"nav.home":"首页","nav.members":"成员","nav.features":"功能","nav.games":"游戏","nav.feeds":"订阅","nav.commands":"命令","nav.sources":"来源","hero.members":"查看成员","hero.features":"探索功能","features.title":"JKT48 功能","members.title":"JKT48 成员","auth.login":"登录","auth.register":"注册","settings.title":"设置","settings.save":"保存设置"});
Object.assign(I18N.ar,{"nav.home":"الرئيسية","nav.members":"الأعضاء","nav.features":"الميزات","nav.games":"الألعاب","nav.feeds":"التغذية","nav.commands":"الأوامر","nav.sources":"المصادر","hero.members":"عرض الأعضاء","hero.features":"استكشاف الميزات","features.title":"ميزات JKT48","members.title":"أعضاء JKT48","auth.login":"تسجيل الدخول","auth.register":"إنشاء حساب","settings.title":"الإعدادات","settings.save":"حفظ الإعدادات"});
Object.assign(I18N.es,{"nav.home":"Inicio","nav.members":"Miembros","nav.features":"Funciones","nav.games":"Juegos","nav.feeds":"Fuentes","nav.commands":"Comandos","nav.sources":"Fuentes","hero.members":"Ver miembros","hero.features":"Explorar funciones","features.title":"Funciones JKT48","members.title":"Miembros JKT48","auth.login":"Iniciar sesión","auth.register":"Registrarse","settings.title":"Ajustes","settings.save":"Guardar ajustes"});
Object.assign(I18N.pt,{"nav.home":"Início","nav.members":"Membros","nav.features":"Recursos","nav.games":"Jogos","nav.feeds":"Feeds","nav.commands":"Comandos","nav.sources":"Fontes","hero.members":"Ver membros","hero.features":"Explorar recursos","features.title":"Recursos JKT48","members.title":"Membros JKT48","auth.login":"Entrar","auth.register":"Registrar","settings.title":"Configurações","settings.save":"Salvar configurações"});
Object.assign(I18N.fr,{"nav.home":"Accueil","nav.members":"Membres","nav.features":"Fonctions","nav.games":"Jeux","nav.feeds":"Flux","nav.commands":"Commandes","nav.sources":"Sources","hero.members":"Voir les membres","hero.features":"Explorer","features.title":"Fonctions JKT48","members.title":"Membres JKT48","auth.login":"Connexion","auth.register":"Inscription","settings.title":"Paramètres","settings.save":"Enregistrer"});
Object.assign(I18N.de,{"nav.home":"Start","nav.members":"Mitglieder","nav.features":"Funktionen","nav.games":"Spiele","nav.feeds":"Feeds","nav.commands":"Befehle","nav.sources":"Quellen","hero.members":"Mitglieder ansehen","hero.features":"Funktionen entdecken","features.title":"JKT48 Funktionen","members.title":"JKT48 Mitglieder","auth.login":"Anmelden","auth.register":"Registrieren","settings.title":"Einstellungen","settings.save":"Einstellungen speichern"});
const NETWORK_TEXT={
  id:{online:"Online",offline:"Offline"},
  en:{online:"Online",offline:"Offline"},
  ja:{online:"オンライン",offline:"オフライン"},
  ko:{online:"온라인",offline:"오프라인"},
  zh:{online:"在线",offline:"离线"},
  ar:{online:"متصل",offline:"غير متصل"},
  es:{online:"En línea",offline:"Sin conexión"},
  pt:{online:"Online",offline:"Offline"},
  fr:{online:"En ligne",offline:"Hors ligne"},
  de:{online:"Online",offline:"Offline"}
};
for(const [language,labels] of Object.entries(NETWORK_TEXT)){
  Object.assign(I18N[language],{"network.online":labels.online,"network.offline":labels.offline});
}


let languageSetupReady=false;
const state={all:[],active:[],merged:[],loading:false,page:1,user:null,authMode:"login",language:localStorage.getItem("nararya_language")||"id",theme:localStorage.getItem("nararya_theme")||"system",timezone:localStorage.getItem("nararya_timezone")||"Asia/Jakarta"};
const $=q=>document.querySelector(q),$$=q=>Array.from(document.querySelectorAll(q));
const text=(v,f="")=>v===undefined||v===null?f:String(v).trim();
const norm=v=>text(v).toLowerCase().normalize("NFKC").replace(/[^a-z0-9]+/gi," ").trim();
const first=(...v)=>v.find(x=>x!==undefined&&x!==null&&text(x)!=="");
const escapeHtml=v=>text(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const t=key=>text((I18N[state.language]||I18N.en)[key],key);
const api=createApiClient();

function applyTheme(){
  const theme=state.theme;
  const dark=theme==="dark"||(theme==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme=dark?"dark":"light";
  localStorage.setItem("nararya_theme",theme);
}
function translate(){
  const dict=I18N[state.language]||I18N.en;
  document.documentElement.lang=state.language;
  document.documentElement.dir=state.language==="ar"?"rtl":"ltr";
  $$("[data-i18n]").forEach(el=>{const key=el.dataset.i18n;if(dict[key])el.innerHTML=dict[key]});
  $$("[data-i18n-placeholder]").forEach(el=>{const key=el.dataset.i18nPlaceholder;if(dict[key])el.placeholder=dict[key]});
  const selected=$("#languageSelect");if(selected)selected.value=state.language;
  const setting=$("#settingsLanguage");if(setting)setting.value=state.language;
}
function setupLanguages(){
  const build=(select)=>{if(!select)return;select.innerHTML=LANGS.map(x=>'<option value="'+x[0]+'">'+escapeHtml(x[1])+"</option>").join("");select.value=state.language};
  build($("#languageSelect"));build($("#settingsLanguage"));
  if(languageSetupReady)return;
  $("#languageSelect")?.addEventListener("change",async e=>await setLanguage(e.target.value));
  languageSetupReady=true;
}
async function setLanguage(language){
  if(!LANGS.some(x=>x[0]===language))language="id";
  state.language=language;localStorage.setItem("nararya_language",language);translate();
  if(state.user){try{state.user=(await api("/api/auth/settings",{method:"POST",body:JSON.stringify({language})})).user}catch{}}
}
function humanDate(date){return new Intl.DateTimeFormat(state.language,{dateStyle:"medium",timeStyle:"short",timeZone:state.timezone}).format(date)}
function arrayFrom(data){if(Array.isArray(data))return data;if(!data||typeof data!=="object")return[];for(const k of ["data","members","results","items","all_members","active_members","AllMember","ActiveMember"])if(Array.isArray(data[k]))return data[k];const vals=Object.values(data);return vals.length&&vals.every(x=>x&&typeof x==="object"&&!Array.isArray(x))?vals:[]}
function generationOf(m){const raw=first(m?.generation,m?.generation_number,m?.gen,m?.generasi,m?.generationName,m?.generasiName);if(typeof raw==="number")return raw>=1&&raw<=14?raw:null;const match=text(raw).match(/(?:generation|generasi|gen)?\s*([0-9]{1,2})/i);const n=match?Number(match[1]):null;return n>=1&&n<=14?n:null}
function normalizeUrl(v){try{const u=new URL(text(v));return ["http:","https:"].includes(u.protocol)?u.toString():""}catch{return""}}
function normalizeMember(raw,activeHint=false){
 const source=raw&&typeof raw==="object"?raw:{};const social=source.social||source.links||source.accounts||{};const name=text(first(raw?.name,raw?.member_name,raw?.memberName,raw?.nama,raw?.full_name,raw?.fullName,raw?.stage_name));if(!name)return null;
 const statusRaw=norm(source.status);const active=activeHint||source.is_active===true||statusRaw==="active";const graduated=Boolean(first(source.graduation_date,source.graduated_at,source.graduate_date))||statusRaw==="graduated";const id=norm(first(source.id,source.member_id,source.slug,source.key,name));
 return{id:id||norm(name),name,nickname:text(first(source.nickname,source.nicknames,source.panggilan)),generation:generationOf(source),status:active?"active":graduated?"graduated":"historical",team:text(first(source.team,source.team_name,source.unit,source.division)),image_url:normalizeUrl(first(source.image_url,source.image,source.photo,source.photo_url,source.avatar,source.img)),profile_url:normalizeUrl(first(source.profile_url,source.profile,source.url,source.detail_url)),instagram_url:normalizeUrl(first(source.instagram_url,source.instagram,social.instagram)),tiktok_url:normalizeUrl(first(source.tiktok_url,source.tiktok,social.tiktok)),x_url:normalizeUrl(first(source.x_url,source.twitter,source.x,social.x,social.twitter)),youtube_url:normalizeUrl(first(source.youtube_url,source.youtube,source.youtube_channel,social.youtube)),showroom_url:normalizeUrl(first(source.showroom_url,source.showroom,social.showroom)),idn_url:normalizeUrl(first(source.idn_url,source.idn,social.idn))};
}
async function fetchWithTimeout(url){let last;for(let attempt=0;attempt<=CONFIG.retries;attempt++){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),CONFIG.timeoutMs);try{const response=await fetch(url,{headers:{accept:"application/json"},cache:"no-store",signal:controller.signal});if(response.ok)return response;if(response.status>=400&&response.status<500)throw new Error("HTTP "+response.status);last=new Error("HTTP "+response.status)}catch(error){last=error?.name==="AbortError"?new Error("Request timeout"):error}finally{clearTimeout(timer)}if(attempt<CONFIG.retries)await new Promise(r=>setTimeout(r,400*(2**attempt)))}throw last||new Error("Request failed")}
async function fetchJson(url){const response=await fetchWithTimeout(url);const data=await response.json();if(!data||typeof data!=="object")throw new Error("Invalid JSON payload");return data}
function mergeMembers(allRows,activeRows){const all=allRows.map(x=>normalizeMember(x)).filter(Boolean);const active=activeRows.map(x=>normalizeMember(x,true)).filter(Boolean);const ai=new Map(active.map(x=>[x.id,x]));const an=new Map(active.map(x=>[norm(x.name),x]));const merged=new Map();for(const m of all){if(!m.generation)continue;const a=ai.get(m.id)||an.get(norm(m.name));merged.set(m.id,a?{...m,...a,generation:m.generation,status:"active"}:m)}for(const m of active)if(m.generation&&!merged.has(m.id))merged.set(m.id,m);return Array.from(merged.values()).slice(0,CONFIG.maxMembers).sort((a,b)=>(a.generation||99)-(b.generation||99)||norm(a.name).localeCompare(norm(b.name),state.language))}
function setStatus(kind,message){const status=$("#sourceStatus"),notice=$("#dataStatus");if(status){status.textContent=kind==="ok"?t("status.online"):kind==="error"?t("status.error"):t("status.loading");status.classList.toggle("ok",kind==="ok");status.classList.toggle("error",kind==="error")}if(notice)notice.textContent=message}
function setSourceState(type,kind){const dot=$(type==="all"?"#allSourceDot":"#activeSourceDot");if(dot){dot.classList.toggle("ok",kind==="ok");dot.classList.toggle("error",kind==="error")}}

function filteredMembers(){const query=norm($("#memberSearch")?.value),generation=$("#generationFilter")?.value||"all",status=$("#statusFilter")?.value||"all";return state.merged.filter(m=>{const hay=norm([m.name,m.nickname,m.team,String(m.generation||"")].join(" "));return(!query||hay.includes(query))&&(generation==="all"||String(m.generation)===generation)&&(status==="all"||m.status===status)})}
function memberCard(m,index){
  const initials=escapeHtml(m.name.split(/\s+/).map(x=>x[0]).slice(0,2).join("").toUpperCase());
  const image=m.image_url?'<img src="'+escapeHtml(m.image_url)+'" alt="'+escapeHtml(m.name)+'" loading="lazy" decoding="async" referrerpolicy="no-referrer">':"";
  const fallback='<div class="member-photo-fallback" '+(image?"hidden":"")+'>'+initials+"</div>";
  const status=m.status==="active"?t("members.active"):m.status==="graduated"?t("members.graduated"):t("members.historical");
  const profile=m.profile_url?'<a href="'+escapeHtml(m.profile_url)+'" target="_blank" rel="noopener noreferrer">'+t("common.view")+"</a>":"";
  const socials=[["IG",m.instagram_url],["TT",m.tiktok_url],["X",m.x_url],["YT",m.youtube_url],["SR",m.showroom_url],["IDN",m.idn_url]]
    .filter(x=>x[1])
    .map(x=>'<a href="'+escapeHtml(x[1])+'" target="_blank" rel="noopener noreferrer">'+x[0]+"</a>")
    .join("");
  const tags=(m.generation?'<span class="member-tag">GEN '+m.generation+"</span>":"")+(m.team?'<span class="member-tag">'+escapeHtml(m.team)+"</span>":"");
  const nickname=escapeHtml(m.nickname||("Generation "+(m.generation||"?")));
  return '<article class="member-card embed-card" data-member-index="'+Math.min(index,11)+'">'
    +'<div class="member-photo">'+image+fallback+'<span class="member-status">'+status+"</span></div>"
    +'<div class="member-body"><h3 class="member-name">'+escapeHtml(m.name)+"</h3>"
    +'<p class="member-nickname">'+nickname+"</p>"
    +'<div class="member-tags">'+tags+"</div>"
    +'<div class="member-links">'+profile+socials+"</div></div></article>";
}
function renderMembers(){const rows=filteredMembers();const totalPages=Math.max(1,Math.ceil(rows.length/CONFIG.pageSize));state.page=Math.min(Math.max(1,state.page),totalPages);const visible=rows.slice((state.page-1)*CONFIG.pageSize,state.page*CONFIG.pageSize);$("#memberGrid")&&( $("#memberGrid").innerHTML=visible.map(memberCard).join(""));$("#memberEmpty")?.classList.toggle("hidden",rows.length!==0);if($("#memberResultCount"))$("#memberResultCount").textContent=rows.length+" "+t("members.resultLabel");if($("#memberCount"))$("#memberCount").textContent=String(state.merged.length);if($("#activeCount"))$("#activeCount").textContent=String(state.merged.filter(x=>x.status==="active").length);if($("#memberPageLabel"))$("#memberPageLabel").textContent=t("members.page")+" "+state.page+"/"+totalPages;const prev=$("#prevMembers"),next=$("#nextMembers");if(prev)prev.disabled=state.page<=1;if(next)next.disabled=state.page>=totalPages}
async function loadMembers(){if(state.loading)return;state.loading=true;setStatus("loading","Memuat data member JKT48...");try{const results=await Promise.allSettled([fetchJson(CONFIG.allUrl),fetchJson(CONFIG.activeUrl)]);if(results.some(x=>x.status!=="fulfilled"))throw new Error(results.filter(x=>x.status!=="fulfilled").map(x=>text(x.reason?.message)).join("; ")||"Source unavailable");state.all=arrayFrom(results[0].value);state.active=arrayFrom(results[1].value);state.merged=mergeMembers(state.all,state.active);if(!state.merged.length)throw new Error("Tidak ada member generasi 1-14 pada payload");state.page=1;setSourceState("all","ok");setSourceState("active","ok");setStatus("ok","Data member berhasil dimuat.");if($("#memberUpdatedAt"))$("#memberUpdatedAt").textContent="Diperbarui "+humanDate(new Date());renderMembers()}catch(error){setSourceState("all","error");setSourceState("active","error");setStatus("error","Sumber data JKT48 sedang tidak tersedia.");$("#memberGrid")?.classList.add("hidden");$("#memberError")?.classList.remove("hidden");if($("#memberErrorText"))$("#memberErrorText").textContent=error.message||"Unknown error"}finally{state.loading=false}}

function modal(id,open=true){$(id)?.classList.toggle("hidden",!open)}
function setupMenu(){const toggle=$("#menuToggle"),nav=$("#mainNav");if(!toggle||!nav)return;const close=()=>{nav.classList.remove("open");toggle.setAttribute("aria-expanded","false")};toggle.addEventListener("click",()=>{const open=nav.classList.toggle("open");toggle.setAttribute("aria-expanded",String(open))});$$(".nav-link").forEach(x=>x.addEventListener("click",close));document.addEventListener("keydown",e=>{if(e.key==="Escape"){$$(".modal-backdrop").forEach(x=>x.classList.add("hidden"));close()}})}
function setupFilters(){["#memberSearch","#generationFilter","#statusFilter"].forEach(sel=>$(sel)?.addEventListener(sel.includes("Search")?"input":"change",()=>{state.page=1;renderMembers()}))}
function setupPagination(){const prev=$("#prevMembers"),next=$("#nextMembers");prev?.addEventListener("click",()=>{if(state.page>1){state.page--;renderMembers()}});next?.addEventListener("click",()=>{const total=Math.ceil(filteredMembers().length/CONFIG.pageSize);if(state.page<total){state.page++;renderMembers()}});$("#refreshMembers")?.addEventListener("click",async()=>{await loadMembers()})}
function setupNavigation(){const sections=$$("main section[id]"),links=$$(".nav-link");if(!("IntersectionObserver"in window))return;const observer=new IntersectionObserver(entries=>entries.filter(x=>x.isIntersecting).forEach(x=>links.forEach(l=>l.classList.toggle("active",l.getAttribute("href")==="#"+x.target.id))),{rootMargin:"-35% 0px -55% 0px"});sections.forEach(section=>observer.observe(section))}
function toast(message){const el=$("#toast");if(!el)return;el.textContent=message;el.classList.remove("hidden");clearTimeout(window.__toastTimer);window.__toastTimer=setTimeout(()=>el.classList.add("hidden"),3000)}
function authMode(mode){state.authMode=mode;$$(".modal-tab").forEach(x=>x.classList.toggle("active",x.dataset.authMode===mode));$$(".register-only").forEach(el=>el.classList.toggle("hidden",mode!=="register"));$("#authTitle")&&( $("#authTitle").textContent=(I18N[state.language]||I18N.en)[mode==="register"?"auth.register":"auth.login"]);$("#authSubmit")&&( $("#authSubmit").textContent=(I18N[state.language]||I18N.en)[mode==="register"?"auth.register":"auth.login"])}
async function refreshAuth(){try{const data=await api("/api/auth/me");state.user=data.user;const google=$("#googleLogin");if(google){google.disabled=!data.googleEnabled;google.title=data.googleEnabled?"":"Google Login belum dikonfigurasi"}updateAccountUi();if(state.user){state.language=state.user.language||state.language;state.theme=state.user.theme||state.theme;state.timezone=state.user.timezone||state.timezone;localStorage.setItem("nararya_language",state.language);localStorage.setItem("nararya_theme",state.theme);localStorage.setItem("nararya_timezone",state.timezone);setupLanguages();translate();applyTheme()}}catch(error){console.error(error)}}
function updateAccountUi(){const label=$("#accountLabel");if(label)label.textContent=state.user?(state.user.displayName||state.user.username):((I18N[state.language]||I18N.en)["auth.login"]);$("#settingsButton")?.classList.toggle("visible-account",Boolean(state.user))}
function submitAuthMessage(message){const el=$("#authMessage");if(el)el.textContent=message||""}
async function submitAuth(e){e.preventDefault();submitAuthMessage("");const body={email:$("#authEmail").value,password:$("#authPassword").value};if(state.authMode==="register"){body.username=$("#authUsername").value;body.displayName=$("#authDisplayName").value}try{const result=await api(state.authMode==="register"?"/api/auth/register":"/api/auth/login",{method:"POST",body:JSON.stringify(body)});state.user=result.user;modal("#authModal",false);updateAccountUi();toast(state.authMode==="register"?t("auth.registerSuccess"):t("auth.loginSuccess"));await refreshAuth()}catch(error){submitAuthMessage(error.message||"Auth failed")}}
function setupAuth(){ $("#accountButton")?.addEventListener("click",()=>state.user?modal("#settingsModal",true):modal("#authModal",true));$("#loginTab")?.addEventListener("click",()=>authMode("login"));$("#registerTab")?.addEventListener("click",()=>authMode("register"));$("#authForm")?.addEventListener("submit",submitAuth);$("#googleLogin")?.addEventListener("click",()=>{location.href="/api/auth/google/start?returnTo="+encodeURIComponent("/#home")});$$("[data-close-modal]").forEach(x=>x.addEventListener("click",()=>modal("#"+x.dataset.closeModal,false)));$("#openSettingsFromFeature")?.addEventListener("click",()=>{if(state.user)modal("#settingsModal",true);else modal("#authModal",true)});$("#settingsButton")?.addEventListener("click",()=>state.user?modal("#settingsModal",true):modal("#authModal",true));$("#logoutButton")?.addEventListener("click",async()=>{await api("/api/auth/logout",{method:"POST"});state.user=null;modal("#settingsModal",false);updateAccountUi();toast("Logout berhasil.")})}
function setupSettings(){const theme=$("#settingsTheme"),tz=$("#settingsTimezone");if(theme)theme.value=state.theme;if(tz)tz.value=state.timezone;$("#settingsLanguage")?.addEventListener("change",e=>setLanguage(e.target.value));$("#settingsTheme")?.addEventListener("change",e=>{state.theme=e.target.value;applyTheme()});$("#settingsTimezone")?.addEventListener("change",e=>{state.timezone=e.target.value;localStorage.setItem("nararya_timezone",state.timezone)});$("#saveSettings")?.addEventListener("click",async()=>{if(!state.user)return;try{state.user=(await api("/api/auth/settings",{method:"POST",body:JSON.stringify({language:state.language,theme:state.theme,timezone:state.timezone})})).user;toast("Settings tersimpan.")}catch(error){$("#settingsMessage").textContent=error.message}});$("#changePassword")?.addEventListener("click",async()=>{try{await api("/api/auth/password",{method:"POST",body:JSON.stringify({currentPassword:$("#currentPassword").value,newPassword:$("#newPassword").value})});$("#settingsMessage").textContent="Password berhasil diubah.";$("#currentPassword").value="";$("#newPassword").value=""}catch(error){$("#settingsMessage").textContent=error.message}})}
async function refreshScraper(){try{const data=await api("/api/scrapers/status");const rows=data.rows||[];const ok=rows.filter(x=>!x.error&&x.status>=200&&x.status<400).length;const failed=rows.filter(x=>x.error).length;$("#scraperSummary").textContent=t("feeds.scraperSummary").replace("{total}",rows.length).replace("{ok}",ok).replace("{error}",failed)}catch(error){$("#scraperSummary").textContent="Scraper health check gagal: "+error.message}}
function setFooterDate(){if($("#footerDate"))$("#footerDate").textContent=humanDate(new Date())}
function systemThemeWatcher(){matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{if(state.theme==="system")applyTheme()})}
async function boot(){
  initDeviceRuntime({
    onNetworkChange:online=>{
      const status=$("#networkStatus");
      if(status){
        status.textContent=online?t("network.online"):t("network.offline");
        status.classList.toggle("offline",!online);
      }
    }
  });
  setupLanguages();translate();applyTheme();setupMenu();setupFilters();setupPagination();setupAuth();setupSettings();setFooterDate();systemThemeWatcher();authMode("login");await refreshAuth();await loadMembers();await refreshScraper();$("#refreshScraper")?.addEventListener("click",refreshScraper)}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else void boot();
