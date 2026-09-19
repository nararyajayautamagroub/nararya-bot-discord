const CONFIG={
  allUrl:"https://raw.githubusercontent.com/FrenzY8/JKT48-Member/refs/heads/main/AllMember.json",
  activeUrl:"https://raw.githubusercontent.com/FrenzY8/JKT48-Member/refs/heads/main/ActiveMember.json",
  timeoutMs:10000,
  retries:2,
  maxMembers:500,
  pageSize:12
};

const state={all:[],active:[],merged:[],loading:false,lastUpdated:null,error:null,page:1};

const $=selector=>document.querySelector(selector);
const $$=selector=>Array.from(document.querySelectorAll(selector));

function text(value,fallback=""){
  if(value===undefined||value===null)return fallback;
  return String(value).trim();
}

function normalize(value){
  return text(value).toLowerCase().normalize("NFKC").replace(/[^a-z0-9]+/gi," ").trim();
}

function first(...values){
  return values.find(value=>value!==undefined&&value!==null&&text(value)!=="");
}

function arrayFrom(data){
  if(Array.isArray(data))return data;
  if(!data||typeof data!=="object")return[];
  const keys=["data","members","results","items","all_members","active_members","AllMember","ActiveMember"];
  for(const key of keys)if(Array.isArray(data[key]))return data[key];
  const values=Object.values(data);
  return values.length&&values.every(value=>value&&typeof value==="object"&&!Array.isArray(value))?values:[];
}

function generationOf(member){
  const raw=first(member?.generation,member?.generation_number,member?.gen,member?.generasi,member?.generationName,member?.generasiName);
  if(typeof raw==="number")return Number.isInteger(raw)&&raw>=1&&raw<=14?raw:null;
  const match=text(raw).match(/(?:generation|generasi|gen)?\s*([0-9]{1,2})/i);
  const value=match?Number(match[1]):null;
  return Number.isInteger(value)&&value>=1&&value<=14?value:null;
}

function extractName(member){
  if(typeof member==="string")return member;
  return text(first(member?.name,member?.member_name,member?.memberName,member?.nama,member?.full_name,member?.fullName,member?.stage_name));
}

function normalizeUrl(value){
  const url=text(value);
  if(!url)return"";
  try{
    const parsed=new URL(url);
    return ["http:","https:"].includes(parsed.protocol)?parsed.toString():"";
  }catch{return""}
}

function normalizeMember(raw,activeHint=false){
  const name=extractName(raw);
  if(!name)return null;
  const source=raw&&typeof raw==="object"?raw:{};
  const social=source.social||source.links||source.accounts||{};
  const statusRaw=normalize(source.status);
  const active=activeHint||source.is_active===true||statusRaw==="active";
  const graduated=Boolean(first(source.graduation_date,source.graduated_at,source.graduate_date))||statusRaw==="graduated";
  const id=normalize(first(source.id,source.member_id,source.slug,source.key,name));
  return{
    id:id||normalize(name),
    name,
    nickname:text(first(source.nickname,source.nicknames,source.panggilan)),
    generation:generationOf(source),
    status:active?"active":graduated?"graduated":"historical",
    team:text(first(source.team,source.team_name,source.unit,source.division)),
    image_url:normalizeUrl(first(source.image_url,source.image,source.photo,source.photo_url,source.avatar,source.img)),
    profile_url:normalizeUrl(first(source.profile_url,source.profile,source.url,source.detail_url)),
    instagram_url:normalizeUrl(first(source.instagram_url,source.instagram,social.instagram)),
    tiktok_url:normalizeUrl(first(source.tiktok_url,source.tiktok,social.tiktok)),
    x_url:normalizeUrl(first(source.x_url,source.twitter,source.x,social.x,social.twitter)),
    youtube_url:normalizeUrl(first(source.youtube_url,source.youtube,source.youtube_channel,social.youtube)),
    showroom_url:normalizeUrl(first(source.showroom_url,source.showroom,social.showroom)),
    idn_url:normalizeUrl(first(source.idn_url,source.idn,social.idn))
  };
}

async function fetchWithTimeout(url){
  let lastError;
  for(let attempt=0;attempt<=CONFIG.retries;attempt++){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),CONFIG.timeoutMs);
    try{
      const response=await fetch(url,{headers:{accept:"application/json"},cache:"no-store",signal:controller.signal});
      if(response.ok)return response;
      if(response.status>=400&&response.status<500)throw new Error("HTTP "+response.status);
      lastError=new Error("HTTP "+response.status);
    }catch(error){
      lastError=error?.name==="AbortError"?new Error("Request timeout"):error;
    }finally{
      clearTimeout(timer);
    }
    if(attempt<CONFIG.retries)await new Promise(resolve=>setTimeout(resolve,350*(attempt+1)));
  }
  throw lastError||new Error("Request failed");
}

async function fetchJson(url){
  const response=await fetchWithTimeout(url);
  const data=await response.json();
  if(!data||typeof data!=="object")throw new Error("Invalid JSON payload");
  return data;
}

function mergeMembers(allRows,activeRows){
  const all=allRows.map(row=>normalizeMember(row)).filter(Boolean);
  const active=activeRows.map(row=>normalizeMember(row,true)).filter(Boolean);
  const activeById=new Map();
  const activeByName=new Map();
  for(const member of active){
    activeById.set(member.id,member);
    activeByName.set(normalize(member.name),member);
  }
  const merged=new Map();
  for(const member of all){
    if(!member.generation)continue;
    const current=activeById.get(member.id)||activeByName.get(normalize(member.name));
    merged.set(member.id,current?{...member,...current,generation:member.generation,status:"active"}:member);
  }
  for(const member of active){
    if(!member.generation)continue;
    if(!merged.has(member.id))merged.set(member.id,member);
  }
  return Array.from(merged.values()).slice(0,CONFIG.maxMembers).sort((a,b)=>{
    const generation=(a.generation||99)-(b.generation||99);
    return generation||normalize(a.name).localeCompare(normalize(b.name),"id");
  });
}

function setSourceState(type,kind){
  const dot=$(type==="all"?"#allSourceDot":"#activeSourceDot");
  if(!dot)return;
  dot.classList.remove("ok","error");
  dot.classList.add(kind==="ok"?"ok":"error");
}

function setStatus(kind,message){
  const status=$("#sourceStatus");
  const notice=$("#dataStatus");
  if(status){
    status.textContent=kind==="ok"?"Online":kind==="error"?"Error":"Loading";
    status.classList.remove("ok","error");
    if(kind==="ok")status.classList.add("ok");
    if(kind==="error")status.classList.add("error");
  }
  if(notice)notice.textContent=message;
}

function humanDate(date){
  return new Intl.DateTimeFormat("id-ID",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Jakarta"}).format(date);
}

function escapeHtml(value){
  return text(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
}

function socialLinks(member){
  return [
    ["IG",member.instagram_url],["TT",member.tiktok_url],["X",member.x_url],
    ["YT",member.youtube_url],["SR",member.showroom_url],["IDN",member.idn_url]
  ].filter(([,url])=>url).map(([label,url])=>'<a href="'+escapeHtml(url)+'" target="_blank" rel="noopener noreferrer">'+label+"</a>").join("");
}

function memberCard(member,index){
  const initials=escapeHtml(member.name.split(/\s+/).map(part=>part[0]).slice(0,2).join("").toUpperCase());
  const image=member.image_url;
  const imageHtml=image?'<img src="'+escapeHtml(image)+'" alt="'+escapeHtml(member.name)+'" loading="lazy" decoding="async" referrerpolicy="no-referrer">':"";
  const status=member.status==="active"?"AKTIF":member.status==="graduated"?"GRADUATED":"HISTORICAL";
  const profile=member.profile_url?'<a href="'+escapeHtml(member.profile_url)+'" target="_blank" rel="noopener noreferrer">Profil</a>':"";
  const tags=(member.generation?'<span class="member-tag">GEN '+member.generation+"</span>":"")+
    (member.team?'<span class="member-tag">'+escapeHtml(member.team)+"</span>":"");
  return `<article class="member-card embed-card" style="animation-delay:${Math.min(index,11)*25}ms">
    <div class="member-photo">${imageHtml}<div class="member-photo-fallback" ${image?"hidden":""}>${initials}</div>
      <span class="member-status">${status}</span>
    </div>
    <div class="member-body">
      <h3 class="member-name">${escapeHtml(member.name)}</h3>
      <p class="member-nickname">${escapeHtml(member.nickname||("JKT48 Generation "+(member.generation||"?")))}</p>
      <div class="member-tags">${tags}</div>
      <div class="member-links">${profile}${socialLinks(member)}</div>
    </div>
  </article>`;
}
function filteredMembers(){
  const query=normalize($("#memberSearch")?.value);
  const generation=$("#generationFilter")?.value||"all";
  const status=$("#statusFilter")?.value||"all";
  return state.merged.filter(member=>{
    const haystack=normalize([member.name,member.nickname,member.team,String(member.generation||"")].join(" "));
    return (!query||haystack.includes(query))&&(generation==="all"||String(member.generation)===generation)&&(status==="all"||member.status===status);
  });
}

function renderMembers(){
  const rows=filteredMembers();
  const totalPages=Math.max(1,Math.ceil(rows.length/CONFIG.pageSize));
  state.page=Math.min(Math.max(1,state.page),totalPages);
  const start=(state.page-1)*CONFIG.pageSize;
  const visible=rows.slice(start,start+CONFIG.pageSize);
  const grid=$("#memberGrid");
  if(grid)grid.innerHTML=visible.map(memberCard).join("");
  $("#memberEmpty")?.classList.toggle("hidden",rows.length!==0);
  $("#memberResultCount")&&( $("#memberResultCount").textContent=rows.length+" member");
  $("#memberCount")&&( $("#memberCount").textContent=String(state.merged.length));
  $("#activeCount")&&( $("#activeCount").textContent=String(state.merged.filter(member=>member.status==="active").length));
  $("#memberPageLabel")&&( $("#memberPageLabel").textContent="Halaman "+state.page+"/"+totalPages);
  const prev=$("#prevMembers"),next=$("#nextMembers");
  if(prev){prev.disabled=state.page<=1;prev.setAttribute("aria-disabled",String(prev.disabled));}
  if(next){next.disabled=state.page>=totalPages;next.setAttribute("aria-disabled",String(next.disabled));}
}

function showMemberError(error){
  state.error=error;
  $("#memberGrid")?.classList.add("hidden");
  $("#memberEmpty")?.classList.add("hidden");
  $("#memberError")?.classList.remove("hidden");
  const message=$("#memberErrorText");
  if(message)message.textContent="Sumber data gagal dibaca: "+text(error?.message,"unknown error")+". Website tidak menggunakan data palsu.";
  setSourceState("all","error");
  setSourceState("active","error");
  setStatus("error","Sumber data JKT48 sedang tidak tersedia.");
}

async function loadMembers(){
  if(state.loading)return;
  state.loading=true;
  state.error=null;
  $("#memberError")?.classList.add("hidden");
  $("#memberGrid")?.classList.remove("hidden");
  setStatus("loading","Memuat data member JKT48...");
  try{
    const results=await Promise.allSettled([fetchJson(CONFIG.allUrl),fetchJson(CONFIG.activeUrl)]);
    if(results.some(result=>result.status!=="fulfilled"))throw new Error(results.filter(result=>result.status!=="fulfilled").map(result=>text(result.reason?.message)).join("; ")||"Source unavailable");
    state.all=arrayFrom(results[0].value);
    state.active=arrayFrom(results[1].value);
    state.merged=mergeMembers(state.all,state.active);
    if(!state.merged.length)throw new Error("Tidak ada member dengan generasi 1-14 pada payload");
    state.lastUpdated=new Date();
    state.page=1;
    setSourceState("all","ok");
    setSourceState("active","ok");
    setStatus("ok","Data member berhasil dimuat.");
    $("#memberUpdatedAt")&&($("#memberUpdatedAt").textContent="Diperbarui "+humanDate(state.lastUpdated));
    renderMembers();
  }catch(error){
    showMemberError(error);
  }finally{
    state.loading=false;
  }
}

function setupMenu(){
  const toggle=$("#menuToggle"),nav=$("#mainNav");
  if(!toggle||!nav)return;
  const close=()=>{nav.classList.remove("open");toggle.setAttribute("aria-expanded","false");toggle.setAttribute("aria-label","Buka menu");};
  toggle.addEventListener("click",()=>{const open=nav.classList.toggle("open");toggle.setAttribute("aria-expanded",String(open));toggle.setAttribute("aria-label",open?"Tutup menu":"Buka menu");});
  $$(".nav-link").forEach(link=>link.addEventListener("click",close));
  document.addEventListener("keydown",event=>{if(event.key==="Escape")close();});
}

function setupFilters(){
  $("#memberSearch")?.addEventListener("input",()=>{state.page=1;renderMembers();});
  ["#generationFilter","#statusFilter"].forEach(selector=>$(selector)?.addEventListener("change",()=>{state.page=1;renderMembers();}));
}

function setupPagination(){
  $("#prevMembers")?.addEventListener("click",()=>{if(state.page>1){state.page--;renderMembers();$("#members")?.scrollIntoView({behavior:"smooth",block:"start"});}});
  $("#nextMembers")?.addEventListener("click",()=>{const total=Math.ceil(filteredMembers().length/CONFIG.pageSize);if(state.page<total){state.page++;renderMembers();$("#members")?.scrollIntoView({behavior:"smooth",block:"start"});}});
  const refresh=$("#refreshMembers");
  refresh?.addEventListener("click",async()=>{refresh.disabled=true;refresh.textContent="Memuat...";try{await loadMembers();}finally{refresh.disabled=false;refresh.textContent="Refresh Data";}});
}

function setupNavigation(){
  const sections=$$("main section[id]"),links=$$(".nav-link");
  if(!sections.length||!links.length||!("IntersectionObserver" in window))return;
  const observer=new IntersectionObserver(entries=>entries.filter(entry=>entry.isIntersecting).forEach(entry=>links.forEach(link=>link.classList.toggle("active",link.getAttribute("href")==="#"+entry.target.id))),{rootMargin:"-35% 0px -55% 0px",threshold:0});
  sections.forEach(section=>observer.observe(section));
}

function setFooterDate(){
  const target=$("#footerDate");
  if(target)target.textContent=humanDate(new Date());
}

async function boot(){
  setupMenu();setupFilters();setupPagination();setupNavigation();setFooterDate();await loadMembers();
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
else void boot();
