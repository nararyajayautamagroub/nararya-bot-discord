export function detectDevice(){
  const width=window.innerWidth;
  return width<600?'mobile':width<980?'tablet':'desktop';
}

export function initDeviceRuntime({onDeviceChange=()=>{},onNetworkChange=()=>{}}={}){
  const root=document.documentElement;
  const updateDevice=()=>{
    const device=detectDevice();
    root.dataset.device=device;
    onDeviceChange(device);
  };
  const updateNetwork=()=>{
    const online=navigator.onLine!==false;
    root.dataset.network=online?'online':'offline';
    onNetworkChange(online);
  };
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const updateMotion=()=>{root.dataset.reducedMotion=reduced?.matches?'true':'false'};
  updateDevice();
  updateNetwork();
  updateMotion();
  window.addEventListener('resize',updateDevice,{passive:true});
  window.addEventListener('online',updateNetwork);
  window.addEventListener('offline',updateNetwork);
  reduced?.addEventListener?.('change',updateMotion);
  return ()=>{
    window.removeEventListener('resize',updateDevice);
    window.removeEventListener('online',updateNetwork);
    window.removeEventListener('offline',updateNetwork);
    reduced?.removeEventListener?.('change',updateMotion);
  };
}
