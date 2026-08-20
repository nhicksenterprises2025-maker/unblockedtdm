const BLOCKED_KEYS=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight','Space','Tab','KeyR','Digit1','Digit2','Numpad1','Numpad2','F1','F2','F3','F4','F6']);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class Input{
  constructor(target=window){
    this.down=new Set();this.pressed=new Set();this.mouseDown=new Set();this.mousePressed=new Set();this.wheelDirection=0;
    const cx=innerWidth/2,cy=innerHeight/2;this.rawPointer={x:cx,y:cy,inside:true};this.pointer={x:cx,y:cy,inside:true};this.aimVelocity={x:0,y:0};this.lastAimClock=performance.now();this.sensitivity=1;
    try{this.setSensitivity(localStorage.getItem('unblockedtdm.sensitivity')||1);}catch{}
    this.onKeyDown=e=>{if(BLOCKED_KEYS.has(e.code))e.preventDefault();if(!this.down.has(e.code))this.pressed.add(e.code);this.down.add(e.code);};this.onKeyUp=e=>this.down.delete(e.code);
    this.onMouseDown=e=>{if(e.target?.closest?.('.debug-controls'))return;if(!this.mouseDown.has(e.button))this.mousePressed.add(e.button);this.mouseDown.add(e.button);if(e.button===0||e.button===2)e.preventDefault();};
    this.onMouseUp=e=>{this.mouseDown.delete(e.button);if(e.button===0||e.button===2)e.preventDefault();};
    this.onWheel=e=>{if(e.target?.closest?.('.debug-controls'))return;this.wheelDirection=e.deltaY<0?-1:1;e.preventDefault();};
    this.onPointerMove=e=>{this.rawPointer.x=e.clientX;this.rawPointer.y=e.clientY;this.rawPointer.inside=true;};this.onPointerLeave=()=>{this.rawPointer.inside=false;this.pointer.inside=false;};
    this.onBlur=()=>{this.down.clear();this.pressed.clear();this.mouseDown.clear();this.mousePressed.clear();this.wheelDirection=0;this.aimVelocity.x=0;this.aimVelocity.y=0;};
    target.addEventListener('keydown',this.onKeyDown);target.addEventListener('keyup',this.onKeyUp);target.addEventListener('mousedown',this.onMouseDown);target.addEventListener('mouseup',this.onMouseUp);target.addEventListener('wheel',this.onWheel,{passive:false});target.addEventListener('pointermove',this.onPointerMove);target.addEventListener('pointerleave',this.onPointerLeave);target.addEventListener('blur',this.onBlur);target.addEventListener('contextmenu',e=>e.preventDefault());
  }
  setSensitivity(v){this.sensitivity=clamp(Number(v)||1,.35,2.5);}
  aimSensitivity(){try{const v=Number(localStorage.getItem('unblockedtdm.sensitivity'));if(Number.isFinite(v)&&v>0)this.setSensitivity(v);}catch{}return this.sensitivity;}
  updateAimPointer(){const now=performance.now(),dt=clamp((now-this.lastAimClock)/1000,0,.05);this.lastAimClock=now;if(dt<=0)return;const s=this.aimSensitivity(),response=10+14*s,maxSpeed=500+1450*s,blend=1-Math.exp(-(10+8*s)*dt),ex=this.rawPointer.x-this.pointer.x,ey=this.rawPointer.y-this.pointer.y,dvx=clamp(ex*response,-maxSpeed,maxSpeed),dvy=clamp(ey*response,-maxSpeed,maxSpeed);this.aimVelocity.x+=(dvx-this.aimVelocity.x)*blend;this.aimVelocity.y+=(dvy-this.aimVelocity.y)*blend;this.pointer.x=clamp(this.pointer.x+this.aimVelocity.x*dt,0,innerWidth);this.pointer.y=clamp(this.pointer.y+this.aimVelocity.y*dt,0,innerHeight);if(Math.abs(ex)<.25&&Math.abs(this.aimVelocity.x)<4){this.pointer.x=this.rawPointer.x;this.aimVelocity.x=0;}if(Math.abs(ey)<.25&&Math.abs(this.aimVelocity.y)<4){this.pointer.y=this.rawPointer.y;this.aimVelocity.y=0;}this.pointer.inside=this.rawPointer.inside;}
  isDown(...c){return c.some(k=>this.down.has(k));}wasPressed(...c){return c.some(k=>this.pressed.has(k));}
  axis(){let x=0,y=0;if(this.isDown('KeyA','ArrowLeft'))x--;if(this.isDown('KeyD','ArrowRight'))x++;if(this.isDown('KeyW','ArrowUp'))y--;if(this.isDown('KeyS','ArrowDown'))y++;if(x&&y){x*=Math.SQRT1_2;y*=Math.SQRT1_2;}return{x,y};}
  sprintHeld(){return this.isDown('ShiftLeft','ShiftRight');}dashPressed(){return this.wasPressed('Space');}reloadPressed(){return this.wasPressed('KeyR');}slotPrimaryPressed(){return this.wasPressed('Digit1','Numpad1')||this.wheelDirection<0;}slotSecondaryPressed(){return this.wasPressed('Digit2','Numpad2')||this.wheelDirection>0;}fireHeld(){return this.mouseDown.has(0);}firePressed(){return this.mousePressed.has(0);}adsHeld(){return this.mouseDown.has(2);}
  pointerPosition(){this.updateAimPointer();return{...this.pointer};}endFrame(){this.pressed.clear();this.mousePressed.clear();this.wheelDirection=0;}
}
