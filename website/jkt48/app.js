const CONFIG={
  allUrl:'https://raw.githubusercontent.com/FrenzY8/JKT48-Member/refs/heads/main/AllMember.json',
  activeUrl:'https://raw.githubusercontent.com/FrenzY8/JKT48-Member/refs/heads/main/ActiveMember.json',
  timeoutMs:10000,
  maxMembers:500
};

const state={
  all:[],
  active:[],
  merged:[],
  loading:true,
  lastUpdated:null,
  error:null
};

const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];

function text(value,fallback=''){
  if(value===undefined||value===null)return fallback;
  return String(value).trim();
}

function normalize(value){
  return text(value).toLowerCase().normalize('NFKC').replace(/[^a-z0-9]+/g,' ').trim();
}

function first(...values){
  return values.find(value=>value!==undefined&&value!==null&&text(value)!=='');
}

function arrayFrom(data){
  if(Array.isArray(data))return data;
  if(!data||typeof data!=='object')return[];
  for(const key of ['data','members','results','items','all_members','active_members','AllMember','ActiveMember']){
    if(Array.isArray(data[key]))return data[key];
  }
  const values=Object.values(data);
  if(values.length&&values.every(value=>value&&typeof value==='object'&&!Array.isArray(value)))return values;
  return[];
}

function generationOf(member){
  const raw=first(member?.generation,member?.generation_number,member?.gen,member?.generasi,member?.generationName,member?.generasiName);
  if(typeof raw==='number')return Number.isInteger(raw)&&raw>=1&&raw<=14?raw:null;
  const match=text(raw).match(/(?:gen(?:eration)?|generasi)?\s*([0-9]{1,2})/i);
  const value=match?Number(match[1]):null;
  return Number.isInteger(value)&&value>=1&&value<=14?value:null;
}

function extractName(member){
  if(typeof member==='string')return member;
  return text(first(
    member?.name,
    member?.member_name,
    member?.memberName,
    member?.nama,
    member?.full_name,
    member?.fullName,
    member?.stage_name
  ));
}

function normalizeMember(raw,activeHint=false){
  const name=extractName(raw);
  if(!name)return null;
  const social=raw?.social||raw?.links||raw?.accounts||{};
  const statusRaw=normalize(raw?.status);
  const active=activeHint||raw?.is_active===true||statusRaw==='active';
  const graduated=Boolean(raw?.graduation_date||raw?.graduated_at||raw?.graduate_date)||statusRaw==='graduated';
  return{
    id:text(first(raw?.id,raw?.member_id,raw?.slug,raw?.key))||normalize(name),
    name,
    nickname:text(first(raw?.nickname,raw?.nicknames,raw?.panggilan))||'',
    generation:generationOf(raw)||null,
    status:active?'active':graduated?'graduated':'historical',
    team:text(first(raw?.team,raw?.team_name,raw?.unit,raw?.division))||'',
    image_url:text(first(raw?.image_url,raw?.image,raw?.photo,raw?.photo_url,raw?.avatar,raw?.img))||'',
    profile_url:text(first(raw?.profile_url,raw?.profile,raw?.url,raw?.detail_url))||'',
    join_date:text(first(raw?.join_date,raw?.joined_at,raw?.joining_date))||'',
    graduation_date:text(first(raw?.graduation_date,raw?.graduated_at,raw?.graduate_date))||'',
    instagram_url:text(first(raw?.instagram_url,raw?.instagram,social.instagram))||'',
    tiktok_url:text(first(raw?.tiktok_url,raw?.tiktok,social.tiktok))||'',
    x_url:text(first(raw?.x_url,raw?.twitter,raw?.x,social.x,social.twitter))||'',
    youtube_url:text(first(raw?.youtube_url,raw?.youtube,raw?.youtube_channel,social.youtube))||'',
    showroom_url:text(first(raw?.showroom_url,raw?.showroom,raw?.showroom_id,social.showroom))||'',
    idn_url:text(first(raw?.idn_url,raw?.idn,social.idn))||''
  };
}

function fetchWithTimeout(url){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),CONFIG.timeoutMs);
  return fetch(url,{headers:{accept:'application/json',cache:'no-store'},signal:controller.signal})
    .finally(()=>clearTimeout(timer));
}

async function fetchJson(url){
  const response=await fetchWithTimeout(url);
  if(!response.ok)throw new Error('HTTP '+response.status);
  return response.json();
}

function mergeMembers(allRows,activeRows){
  const activeMembers=activeRows.map(row=>normalizeMember(row,true)).filter(Boolean);
  const allMembers=allRows.map(row=>normalizeMember(row,false)).filter(Boolean);
  const activeKeys=new Set(activeMembers.flatMap(row=>[row.id,normalize(row.name)]));
  const merged=new Map();
  for(const member of allMembers){
    if(member.generation!==null&&member.generation!==undefined&&member.generation>=1&&member.generation<=14){
      const active=activeKeys.has(member.id)||activeKeys.has(normalize(member.name));
      merged.set(member.id,{...member,status:active?'active':member.status});
    }
  }
  for(const member of activeMembers){
    if(member.generation===null||member.generation===undefined||member.generation<1||member.generation>14)continue;
    const existing=merged.get(member.id)||merged.get(normalize(member.name));
    if(existing)merged.set(existing.id,{...existing,...member,generation:existing.generation||member.generation,status:'active'});
    else merged.set(member.id,member);
  }
  return [...merged.values()].sort((a,b)=>{
    const ga=a.generation||99;
    const gb=b.generation||99;
    if(ga!==gb)return ga-gb;
    return normalize(a.name).localeCompare(normalize(b.name),'id');
  });
}

function setSourceState(type,state){
  const dot=$(type==='all'?'#allSourceDot':'#activeSourceDot');
  if(!dot)return;
  dot.classList.remove('ok','error');
  dot.classList.add(state==='ok'?'ok':'error');
}

function setStatus(kind,message){
  const status=$('#sourceStatus');
  const notice=$('#dataStatus');
  if(status){
    status.textContent=kind==='ok'?'Online':kind==='error'?'Error':'Loading';
    status.classList.remove('ok','error');
    if(kind==='ok')status.classList.add('ok');
    if(kind==='error')status.classList.add('error');
  }
  if(notice)notice.textContent=message;
}

function humanDate(date){
  return new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Jakarta'}).format(date);
}

function safeImageUrl(url){
  if(!url)return'';
  try{
    const parsed=new URL(url);
    if(!['http:','https:'].includes(parsed.protocol))return'';
    return parsed.toString();
  }catch{return''}
}

function escapeHtml(value){
  return text(value).replace(/[&<>"']/g,char=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#039;'
  }[char]));
}

function socialLinks(member){
  const links=[
    ['IG',member.instagram_url],
    ['TT',member.tiktok_url],
    ['X',member.x_url],
    ['YT',member.youtube_url],
    ['SR',member.showroom_url],
    ['IDN',member.idn_url]
  ];
  return links.filter(([,url])=>Boolean(safeImageUrl(url))).map(([label,url])=>'<a href="'+escapeHtml(url)+'" target="_blank" rel="noopener noreferrer">'+label+'</a>').join('');
}

function memberCard(member){
  const image=safeImageUrl(member.image_url);
  const initials=escapeHtml((member.name||'JKT48').split(/\s+/).map(part=>part[0]).slice(0,2).join('').toUpperCase());
  const imageHtml=image
    ?'<img src="'+escapeHtml(image)+'" alt="'+escapeHtml(member.name)+'" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display=\'none\';this.nextElementSibling.hidden=false">'
    :'';
  return'<article class="member-card embed-card">'+
    '<div class="member-photo">'+
      imageHtml+
      '<div class="member-photo-fallback" '+(image?'hidden':'')+'>'+initials+'</div>'+
      '<span class="member-status">'+escapeHtml(member.status==='active'?'AKTIF':member.status.toUpperCase())+'</span>'+
    '</div>'+
    '<div class="member-body">'+
      '<h3 class="member-name">'+escapeHtml(member.name)+'</h3>'+
      (member.nickname?'<p class="member-nickname">'+escapeHtml(member.nickname)+'</p>':'<p class="member-nickname">JKT48 Generation '+escapeHtml(member.generation||'?')+'</p>')+
      '<div class="member-tags">'+
        (member.generation?'<span class="member-tag">GEN '+escapeHtml(member.generation)+'</span>':'')+
        (member.team?'<span class="member-tag">'+escapeHtml(member.team)+'</span>':'')+
      '</div>'+
      '<div class="member-links">'+
        (member.profile_url?'<a href="'+escapeHtml(member.profile_url)+'" target="_blank" rel="noopener noreferrer">Profil</a>':'')+
        socialLinks(member)+
      '</div>'+
    '</div>'+
  '</article>';
}

function filteredMembers(){
  const search=normalize($('#memberSearch')?.value||'');
  const generation=$('#generationFilter')?.value||'all';
  const status=$('#statusFilter')?.value||'all';
  return state.merged.filter(member=>{
    if(search&&!normalize([member.name,member.nickname,member.team].join(' ')).includes(search))return false;
    if(generation!=='all'&&String(member.generation)!==generation)return false;
    if(status!=='all'&&member.status!==status)return false;
    return true;
  });
}

function renderMembers(){
  const grid=$('#memberGrid');
  const empty=$('#memberEmpty');
  const error=$('#memberError');
  const rows=filteredMembers();
  if(error)error.classList.add('hidden');
  if(empty)empty.classList.toggle('hidden',rows.length>0);
  if(grid){
    grid.innerHTML=rows.length?rows.map(memberCard).join(''):'';
  }
  const count=$('#memberResultCount');
  if(count)count.textContent=rows.length+' member';
  const active=state.merged.filter(member=>member.status==='active').length;
  const activeCount=$('#activeCount');
  if(activeCount)activeCount.textContent=String(active);
  const total=$('#memberCount');
  if(total)total.textContent=String(state.merged.length);
}

function showMemberError(error){
  state.error=error;
  state.loading=false;
  $('#memberGrid')?.classList.add('hidden');
  $('#memberError')?.classList.remove('hidden');
  const message=$('#memberErrorText');
  if(message)message.textContent='Sumber data gagal dibaca: '+text(error?.message,'unknown error')+'. Data website tidak diganti dengan data palsu.';
  setSourceState('all','error');
  setSourceState('active','error');
  setStatus('error','Sumber data JKT48 sedang tidak tersedia.');
}

async function loadMembers(){
  state.loading=true;
  setStatus('loading','Memuat data member JKT48...');
  try{
    const [allResult,activeResult]=await Promise.allSettled([
      fetchJson(CONFIG.allUrl),
      fetchJson(CONFIG.activeUrl)
    ]);
    if(allResult.status!=='fulfilled')throw allResult.reason;
    if(activeResult.status!=='fulfilled')throw activeResult.reason;
    state.all=arrayFrom(allResult.value);
    state.active=arrayFrom(activeResult.value);
    state.merged=mergeMembers(state.all,state.active).slice(0,CONFIG.maxMembers);
    state.lastUpdated=new Date();
    state.loading=false;
    setSourceState('all','ok');
    setSourceState('active','ok');
    setStatus('ok','Data member berhasil dimuat.');
    const updated=$('#memberUpdatedAt');
    if(updated)updated.textContent='Diperbarui '+humanDate(state.lastUpdated);
    $('#memberGrid')?.classList.remove('hidden');
    renderMembers();
  }catch(error){
    showMemberError(error);
  }
}

function setupMenu(){
  const toggle=$('#menuToggle');
  const nav=$('#mainNav');
  if(!toggle||!nav)return;
  toggle.addEventListener('click',()=>{
    const open=nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded',String(open));
    toggle.setAttribute('aria-label',open?'Tutup menu':'Buka menu');
  });
  $$('.nav-link').forEach(link=>link.addEventListener('click',()=>{
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-label','Buka menu');
  }));
}

function setupFilters(){
  ['#memberSearch','#generationFilter','#statusFilter'].forEach(selector=>{
    const element=$(selector);
    if(!element)return;
    element.addEventListener(selector==='#memberSearch'?'input':'change',renderMembers);
  });
}

function setupNavigation(){
  const sections=$$('main section[id]');
  const links=$$('.nav-link');
  if(!sections.length||!links.length)return;
  const observer=new IntersectionObserver(entries=>{
    entries.filter(entry=>entry.isIntersecting).forEach(entry=>{
      links.forEach(link=>link.classList.toggle('active',link.getAttribute('href')==='#'+entry.target.id));
    });
  },{rootMargin:'-35% 0px -55% 0px',threshold:0});
  sections.forEach(section=>observer.observe(section));
}

function setFooterDate(){
  const target=$('#footerDate');
  if(target)target.textContent=humanDate(new Date());
}

async function boot(){
  setupMenu();
  setupFilters();
  setupNavigation();
  setFooterDate();
  await loadMembers();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
else boot();
