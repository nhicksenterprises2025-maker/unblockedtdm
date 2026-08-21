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
  import('./phase1-branding.js')
    .then(()=>import('./flow-v18.js'))
    .then(()=>import('./phase2-ui.js'))
    .then(()=>import('./phase3-hud.js'))
    .catch((error)=>console.error('Skirmish Arena 2.0 startup runtime failed to load',error));
})();
