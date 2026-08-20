(()=>{
  const DIFFICULTIES={Beginner:.80,Average:1.00,Sweat:1.35,Pro:1.75};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function read(key,fallback){try{return localStorage.getItem(key)||fallback;}catch{return fallback;}}
  function write(key,value){try{localStorage.setItem(key,String(value));}catch{}}
  function boot(){
    const panel=document.getElementById('debugPanel');
    const difficulty=document.getElementById('aiDifficulty');
    const difficultyValue=document.getElementById('aiDifficultyValue');
    const sensitivity=document.getElementById('sensitivityRange');
    const sensitivityValue=document.getElementById('sensitivityValue');
    const minimapMode=document.getElementById('minimapMode');
    const minimapModeValue=document.getElementById('minimapModeValue');
    const aiState=document.getElementById('aiModeState');
    const sensState=document.getElementById('sensState');
    if(!panel||!difficulty||!sensitivity)return;

    let mode=read('unblockedtdm.aiDifficulty','Average');
    if(!DIFFICULTIES[mode])mode='Average';
    difficulty.value=mode;
    const sens=clamp(Number(read('unblockedtdm.sensitivity','1'))||1,.35,2.5);
    sensitivity.value=String(sens);
    if(minimapMode){
      const savedMap=read('unblockedtdm.minimapMode','north-up');
      minimapMode.value=savedMap==='rotate'?'rotate':'north-up';
    }

    const sync=()=>{
      const mult=DIFFICULTIES[difficulty.value]||1;
      difficultyValue.textContent=`${difficulty.value.toUpperCase()} · ${mult.toFixed(2)}×`;
      aiState.textContent=`${difficulty.value.toUpperCase()} ${mult.toFixed(2)}X`;
      sensitivityValue.textContent=`${Number(sensitivity.value).toFixed(2)}×`;
      sensState.textContent=`${Number(sensitivity.value).toFixed(2)}X`;
      if(minimapModeValue&&minimapMode)minimapModeValue.textContent=minimapMode.value==='rotate'?'ROTATE WITH AIM':'NORTH UP';
    };

    difficulty.addEventListener('change',()=>{write('unblockedtdm.aiDifficulty',difficulty.value);sync();});
    sensitivity.addEventListener('input',()=>{write('unblockedtdm.sensitivity',clamp(Number(sensitivity.value),.35,2.5).toFixed(2));sync();});
    minimapMode?.addEventListener('change',()=>{write('unblockedtdm.minimapMode',minimapMode.value);sync();});
    window.addEventListener('keydown',(event)=>{
      if(event.code!=='F1'||event.repeat)return;
      const visible=!panel.classList.contains('visible');
      panel.classList.toggle('visible',visible);
      document.body.classList.toggle('debug-visible',visible);
    });
    sync();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
