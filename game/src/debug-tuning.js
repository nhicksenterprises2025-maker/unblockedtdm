(()=>{
  const DIFFICULTIES={Beginner:.80,Average:1.00,Sweat:1.35,Pro:1.75};
  const RUNTIME_COUNT=16;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const sleep=(ms)=>new Promise((resolve)=>setTimeout(resolve,ms));
  let bootState='pending';
  let bootOverlay=null;
  let bootStyle=null;
  let bootFailure=null;

  function read(key,fallback){try{return localStorage.getItem(key)||fallback;}catch{return fallback;}}
  function write(key,value){try{localStorage.setItem(key,String(value));}catch{}window.dispatchEvent(new CustomEvent('unblockedtdm:settings-change'));}

  function installDebugTuning(){
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

  function installBootGuard(){
    if(bootOverlay)return;
    bootStyle=document.createElement('style');
    bootStyle.id='skirmishBootGuardStyle';
    bootStyle.textContent=`
      body.skirmish-booting>*:not(#skirmishBootOverlay){visibility:hidden!important}
      #skirmishBootOverlay{position:fixed;inset:0;z-index:1000000;display:grid;place-items:center;background:#071017;color:#eef5f8;font-family:Inter,"Segoe UI",Arial,sans-serif;visibility:visible!important}
      #skirmishBootOverlay .boot-shell{width:min(620px,86vw);padding:30px 32px;border:1px solid #2d4555;border-top:3px solid #3dbfff;background:#0b151d;box-shadow:0 26px 80px rgba(0,0,0,.48)}
      #skirmishBootOverlay small{display:block;color:#45c6ff;font:800 10px/1.2 Consolas,monospace;letter-spacing:.16em}
      #skirmishBootOverlay h1{margin:10px 0 8px;font-size:34px;line-height:1;letter-spacing:-.025em}
      #skirmishBootOverlay p{margin:0;color:#93a8b5;font-size:13px;line-height:1.55}
      #skirmishBootOverlay .boot-track{height:5px;margin-top:22px;background:#14242e;overflow:hidden}
      #skirmishBootOverlay .boot-track i{display:block;width:18%;height:100%;background:#45c6ff;transition:width .16s ease}
      #skirmishBootOverlay .boot-actions{display:none;gap:9px;margin-top:20px}
      #skirmishBootOverlay.failed .boot-actions{display:flex}
      #skirmishBootOverlay button{padding:11px 14px;border:1px solid #355263;border-radius:2px;background:#0d1b24;color:#eaf4f8;font:800 10px/1 Consolas,monospace;letter-spacing:.08em;cursor:pointer}
      #skirmishBootOverlay button:hover{border-color:#45c6ff;color:#67d2ff}
      #skirmishBootOverlay.failed .boot-track i{width:100%!important;background:#ff5c6c}
      #skirmishBootOverlay.failed small{color:#ff7d89}
    `;
    document.head.appendChild(bootStyle);
    bootOverlay=document.createElement('section');
    bootOverlay.id='skirmishBootOverlay';
    bootOverlay.innerHTML=`<div class="boot-shell"><small data-boot-eyebrow>SKIRMISH ARENA // BOOT INTEGRITY</small><h1 data-boot-title>STARTING CLIENT</h1><p data-boot-status>Verifying packaged runtime…</p><div class="boot-track"><i data-boot-progress></i></div><div class="boot-actions"><button type="button" data-boot-retry>RETRY BOOT</button><button type="button" data-boot-quit>QUIT</button></div></div>`;
    bootOverlay.querySelector('[data-boot-retry]').addEventListener('click',()=>location.reload());
    bootOverlay.querySelector('[data-boot-quit]').addEventListener('click',()=>window.gameAPI?.quit?.());
    document.body.appendChild(bootOverlay);
    document.body.classList.add('skirmish-booting');
    document.body.dataset.skirmishBoot='booting';
  }

  function updateBoot(stage,index=0,total=RUNTIME_COUNT+2){
    if(!bootOverlay)return;
    const status=bootOverlay.querySelector('[data-boot-status]');
    const progress=bootOverlay.querySelector('[data-boot-progress]');
    if(status)status.textContent=stage;
    if(progress)progress.style.width=`${Math.max(8,Math.min(96,Math.round(((index+1)/total)*100)))}%`;
  }

  async function waitFor(check,timeout,message){
    const deadline=performance.now()+timeout;
    while(performance.now()<deadline){
      if(check())return true;
      await sleep(50);
    }
    throw new Error(message);
  }

  function failBoot(error,stage='BOOTSTRAP'){
    if(bootState==='ready'||bootState==='failed')return;
    bootState='failed';
    bootFailure=error instanceof Error?error:new Error(String(error||'Unknown boot failure'));
    document.body.dataset.skirmishBoot='failed';
    document.body.dataset.skirmishBootStage=stage;
    installBootGuard();
    bootOverlay.classList.add('failed');
    const eyebrow=bootOverlay.querySelector('[data-boot-eyebrow]');
    const title=bootOverlay.querySelector('[data-boot-title]');
    const status=bootOverlay.querySelector('[data-boot-status]');
    if(eyebrow)eyebrow.textContent=`BOOT FAILURE // ${stage}`;
    if(title)title.textContent='CLIENT START BLOCKED';
    if(status)status.textContent=`${bootFailure.name}: ${bootFailure.message}`;
    console.error('Skirmish Arena deterministic boot failed',stage,bootFailure);
  }

  function finishBoot(buildInfo){
    bootState='ready';
    document.body.dataset.skirmishBoot='ready';
    document.body.dataset.skirmishBootVersion=String(buildInfo?.gameVersion||'unknown');
    document.body.classList.remove('skirmish-booting');
    document.body.classList.add('skirmish-boot-ready');
    bootOverlay?.remove();
    bootStyle?.remove();
    bootOverlay=null;
    bootStyle=null;
    window.__SKIRMISH_BOOT_READY__=true;
    window.dispatchEvent(new CustomEvent('skirmish:boot-ready',{detail:buildInfo||{}}));
  }

  function modernUiReady(){
    const brand=document.querySelector('#mainMenu .menu-brand strong')?.textContent?.trim();
    return Boolean(
      document.body.classList.contains('ui-v18')&&
      document.body.classList.contains('ui-phase6')&&
      document.body.classList.contains('ui-211')&&
      document.body.classList.contains('ui-231')&&
      brand==='SKIRMISH ARENA'&&
      document.querySelector('[data-career-strip]')&&
      document.querySelector('.ui231-home-logo')&&
      document.querySelector('[data-weapon-info-catalog]')
    );
  }

  async function startDeterministicBoot(){
    installBootGuard();
    installDebugTuning();
    window.__SKIRMISH_BOOT_READY__=false;
    window.__SKIRMISH_BOOT_DIAGNOSTIC__=()=>({state:bootState,stage:document.body.dataset.skirmishBootStage||null,error:bootFailure?.message||null});

    try{
      if(!window.gameAPI?.getBuildInfo||!window.gameAPI?.quit)throw new Error('Electron preload bridge is unavailable.');
      updateBoot('Reading packaged build metadata…',0);
      const buildInfo=await window.gameAPI.getBuildInfo();
      if(!buildInfo?.gameVersion)throw new Error('Packaged build metadata is invalid.');

      updateBoot(`Starting core renderer // ${buildInfo.gameVersion}.${buildInfo.build}`,1);
      await import('./renderer.js');
      await waitFor(()=>document.getElementById('mainBuildLabel')?.textContent?.includes(String(buildInfo.gameVersion)),7000,'Core renderer did not complete the build handshake.');

      const loadRuntime=async(label,importer,index)=>{
        document.body.dataset.skirmishBootStage=label;
        updateBoot(`Loading ${label}…`,index);
        return importer();
      };
      await loadRuntime('FLOW',()=>import('./flow-v18.js'),2);
      await loadRuntime('TACTICAL HUD',()=>import('./phase3-runtime.js'),3);
      await loadRuntime('INTERACTION',()=>import('./phase4-runtime.js'),4);
      await loadRuntime('FULLSCREEN + VFX',()=>import('./phase5-runtime.js'),5);
      await loadRuntime('COMMAND MENU',()=>import('./phase6-runtime.js'),6);
      await loadRuntime('MAP VISUALS',()=>import('./phase7-runtime.js'),7);
      await loadRuntime('PRO HUD',()=>import('./phase8-runtime.js'),8);
      await loadRuntime('RC HARDENING',()=>import('./phase9-runtime.js'),9);
      const careerBridge=await loadRuntime('CAREER BRIDGE',()=>import('./phase10-runtime.js'),10);
      await loadRuntime('WEAPON MODELS',()=>import('./phase2011-runtime.js'),11);
      await loadRuntime('SPREAD VISUALS',()=>import('./phase2012-runtime.js'),12);
      await loadRuntime('LOADOUT LAYOUT',()=>import('./phase2013-runtime.js'),13);
      await loadRuntime('WEAPON INFO SCROLL',()=>import('./phase2014-runtime.js'),14);
      await loadRuntime('CAREER',()=>careerBridge.loadCareerRuntime(),15);
      await loadRuntime('2.2.1 CONTROLS',()=>import('./phase221-runtime.js'),16);
      await loadRuntime('2.3.1 UI',()=>import('./phase231-runtime.js'),17);

      document.body.dataset.skirmishBootStage='VERIFY MODERN CLIENT';
      updateBoot('Verifying modern client ownership…',RUNTIME_COUNT+1);
      await waitFor(modernUiReady,7000,'Modern Skirmish Arena UI did not reach its required ready state.');
      finishBoot(buildInfo);
    }catch(error){
      failBoot(error,document.body.dataset.skirmishBootStage||'CORE');
    }
  }

  window.addEventListener('error',(event)=>{
    if(bootState!=='ready'&&event.error)failBoot(event.error,document.body.dataset.skirmishBootStage||'WINDOW ERROR');
  });
  window.addEventListener('unhandledrejection',(event)=>{
    if(bootState!=='ready')failBoot(event.reason,document.body.dataset.skirmishBootStage||'PROMISE REJECTION');
  });

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startDeterministicBoot,{once:true});
  else startDeterministicBoot();
})();
