const qs=new URLSearchParams(location.search);
const ticket=qs.get('ticket');
const guild=document.getElementById('guild');
const user=document.getElementById('user');
const status=document.getElementById('status');
const robot=document.getElementById('robot');
const button=document.getElementById('verify');
const message=document.getElementById('message');
const codePanel=document.getElementById('codePanel');
const code=document.getElementById('code');
const startedAt=Date.now();

function setMessage(text,error=true){message.textContent=text;message.style.color=error?'#b91c1c':'#047857';}
robot.addEventListener('change',()=>{button.disabled=!robot.checked});
async function load(){
 if(!ticket){setMessage('Tautan verifikasi tidak lengkap.');return}
 const res=await fetch('/api/verify/session?ticket='+encodeURIComponent(ticket));
 const data=await res.json();
 if(!res.ok||!data.ok){setMessage(data.error||'Sesi tidak ditemukan.');return}
 guild.textContent=data.guildId;
 user.textContent=data.userId;
 status.textContent=data.status;
}
button.addEventListener('click',async()=>{
 button.disabled=true;
 setMessage('Memproses verifikasi...',false);
 const res=await fetch('/api/verify/complete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
   ticket,
   challenge:ticket,
   human:robot.checked,
   honeypot:document.getElementById('website').value,
   startedAt
 })});
 const data=await res.json();
 if(!res.ok||!data.ok){setMessage(data.error||'Verifikasi gagal.');button.disabled=false;return}
 code.textContent=data.code;
 codePanel.classList.remove('hidden');
 status.textContent='verified';
 setMessage('Berhasil. Salin kode dan masukkan ke Discord dengan /verify code.',false);
});
load();
