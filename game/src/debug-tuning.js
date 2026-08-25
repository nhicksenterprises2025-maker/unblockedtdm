(()=>{
  const DIFFICULTIES={Beginner:.80,Average:1.00,Sweat:1.35,Pro:1.75};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function read(key,fallback){try{return localStorage.getItem(key)||fallback;}catch{return fallback;}}
  function write(key,value){try{localStorage.setItem(key,String(value));}catch{}window.dispatchEvent(new CustomEvent('unblockedtdm:settings-change'));}
  function boot(){
    const panel=document.getElementById('debugPanel'),difficulty=document.getElementById('aiDifficulty'),difficultyValue=document.getElementById('aiDifficultyValue'),sensitivity=document.getElementById('sensitivityRange'),sensitivityValue=document.getElementById('sensitivityValue'),minimap=document.getElementById('minimapMode'),minimapValue=document.getElementById('minimapModeValue'),aiState=document.getElementById('aiModeState'),sensState=document.getElementById('sensState');
    if(!panel||!difficulty||!sensitivity||!minimap)return;
    const sync=()=>{
      let mode=read('unblockedtdm.aiDifficulty','Average');if(!DIFFICULTIES[mode])mode='Average';difficulty.value=mode;
      const sens=clamp(Number(read('unblockedtdm.sensitivity','1'))||1,.35,2.5);sensitivity.value=String(sens);
      const mapMode=read('unblockedtdm.minimapMode','north-up')==='rotate'?'rotate':'north-up';minimap.value=mapMode;
      const mult=DIFFICULTIES[mode]||1;difficultyValue.textContent=`${mode.toUpperCase()} · ${mult.toFixed(2)}×`;aiState.textContent=`${mode.toUpperCase()} ${mult.toFixed(2)}X`;sensitivityValue.textContent=`${sens.toFixed(2)}×`;sensState.textContent=`${sens.toFixed(2)}X`;minimapValue.textContent=mapMode==='rotate'?'ROTATE WITH AIM':'NORTH UP';
    };
    difficulty.addEventListener('change',()=>write('unblockedtdm.aiDifficulty',difficulty.value));
    sensitivity.addEventListener('input',()=>write('unblockedtdm.sensitivity',clamp(Number(sensitivity.value),.35,2.5).toFixed(2)));
    minimap.addEventListener('change',()=>write('unblockedtdm.minimapMode',minimap.value));
    window.addEventListener('unblockedtdm:settings-change',sync);
    window.addEventListener('keydown',(event)=>{
      if(event.code!=='F1'||event.repeat)return;
      const inMatch=document.body.classList.contains('match-started');
      const paused=document.getElementById('pausePanel')?.classList.contains('visible');
      const postgame=document.body.classList.contains('postgame-open');
      if(!inMatch||paused||postgame)return;
      panel.classList.toggle('visible');
    });
    sync();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  import('./flow-v18.js').catch((error)=>console.error('Build 1.8 flow runtime failed to load',error));
  import('./phase4-runtime.js').catch((error)=>console.error('Phase 4 interaction runtime failed to load',error));
  import('./phase5-runtime.js').catch((error)=>console.error('Phase 5 fullscreen/VFX runtime failed to load',error));
  import('./phase6-runtime.js').catch((error)=>console.error('Phase 6 front-end runtime failed to load',error));
  import('./phase7-runtime.js').catch((error)=>console.error('Phase 7 map visual runtime failed to load',error));
  import('./phase8-runtime.js').catch((error)=>console.error('Phase 8 professional HUD runtime failed to load',error));
  import('./phase9-runtime.js').catch((error)=>console.error('Phase 9 RC hardening runtime failed to load',error));
  import('./phase10-runtime.js').catch((error)=>console.error('2.0 career progression runtime failed to load',error));
  import('./phase2011-runtime.js').catch((error)=>console.error('2.01.1 gameplay weapon model UI failed to load',error));
  import('./phase2012-runtime.js').catch((error)=>console.error('2.01.2 crosshair/weapon info UI failed to load',error));
})();
