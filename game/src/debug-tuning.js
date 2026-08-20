(()=>{
  const DIFFICULTIES={Beginner:.80,Average:1.00,Sweat:1.35,Pro:1.75};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function read(key,fallback){try{return localStorage.getItem(key)||fallback;}catch{return fallback;}}
  function write(key,value){try{localStorage.setItem(key,String(value));}catch{}}
  function boot(){
    const panel=document.getElementById('debugPanel'),difficulty=document.getElementById('aiDifficulty'),difficultyValue=document.getElementById('aiDifficultyValue'),sensitivity=document.getElementById('sensitivityRange'),sensitivityValue=document.getElementById('sensitivityValue'),aiState=document.getElementById('aiModeState'),sensState=document.getElementById('sensState');
    if(!panel||!difficulty||!sensitivity)return;
    let mode=read('unblockedtdm.aiDifficulty','Average');if(!DIFFICULTIES[mode])mode='Average';difficulty.value=mode;
    let sens=clamp(Number(read('unblockedtdm.sensitivity','1'))||1,.35,2.5);sensitivity.value=String(sens);
    const sync=()=>{const mult=DIFFICULTIES[difficulty.value]||1;difficultyValue.textContent=`${difficulty.value.toUpperCase()} · ${mult.toFixed(2)}×`;aiState.textContent=`${difficulty.value.toUpperCase()} ${mult.toFixed(2)}X`;sensitivityValue.textContent=`${Number(sensitivity.value).toFixed(2)}×`;sensState.textContent=`${Number(sensitivity.value).toFixed(2)}X`;};
    difficulty.addEventListener('change',()=>{write('unblockedtdm.aiDifficulty',difficulty.value);sync();});
    sensitivity.addEventListener('input',()=>{write('unblockedtdm.sensitivity',clamp(Number(sensitivity.value),.35,2.5).toFixed(2));sync();});
    window.addEventListener('keydown',(event)=>{if(event.code==='F1'&&!event.repeat){panel.classList.toggle('visible');}});
    sync();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
