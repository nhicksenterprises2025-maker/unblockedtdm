const canvas = document.getElementById('background');
const ctx = canvas.getContext('2d');
let last = performance.now();
let frames = 0;
let fps = 0;
let fpsTimer = 0;

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(innerWidth * dpr);
  canvas.height = Math.floor(innerHeight * dpr);
  canvas.style.width = `${innerWidth}px`;
  canvas.style.height = `${innerHeight}px`;
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
window.addEventListener('resize', resize);
resize();

function draw(time) {
  const now = time;
  const dt = now - last;
  last = now;
  frames++;
  fpsTimer += dt;
  if (fpsTimer >= 500) {
    fps = Math.round((frames * 1000) / fpsTimer);
    frames = 0;
    fpsTimer = 0;
    document.getElementById('fps').textContent = `${fps} FPS · Canvas 2D runtime`;
  }

  ctx.clearRect(0,0,innerWidth,innerHeight);
  const gradient = ctx.createRadialGradient(innerWidth*.75, innerHeight*.18, 20, innerWidth*.65, innerHeight*.25, Math.max(innerWidth,innerHeight)*.8);
  gradient.addColorStop(0,'#183b66');
  gradient.addColorStop(.45,'#0b1b2d');
  gradient.addColorStop(1,'#06101b');
  ctx.fillStyle = gradient;
  ctx.fillRect(0,0,innerWidth,innerHeight);

  const size = 64;
  const offset = (now * .008) % size;
  ctx.strokeStyle = 'rgba(104, 190, 241, .055)';
  ctx.lineWidth = 1;
  for (let x=-size+offset; x<innerWidth+size; x+=size) {
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,innerHeight); ctx.stroke();
  }
  for (let y=-size+offset; y<innerHeight+size; y+=size) {
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(innerWidth,y); ctx.stroke();
  }
  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);

(async () => {
  const info = await window.gameAPI.getBuildInfo();
  document.getElementById('phase').textContent = info.phase;
  document.getElementById('build').textContent = info.gameVersion;
  document.getElementById('version').textContent = info.build;
})();

document.getElementById('exit').addEventListener('click', () => window.gameAPI.quit());
