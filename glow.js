// glow.js — round pointer glow, no lag and no square shimmer
(function(){
  const root = document.documentElement;
  let cx = 50, cy = 50;
  let tx = 50, ty = 50;
  let sx = 50, sy = 50;

  root.style.setProperty('--mx', '50%');
  root.style.setProperty('--my', '50%');
  root.style.setProperty('--mx2', '50%');
  root.style.setProperty('--my2', '50%');

  const glowOrb = document.createElement('div');
  glowOrb.className = 'cursor-glow';
  document.body.appendChild(glowOrb);

  function setVars(x,y){
    root.style.setProperty('--mx', x + '%');
    root.style.setProperty('--my', y + '%');
  }

  function updateOrb(clientX, clientY){
    glowOrb.style.left = (clientX + 4) + 'px';
    glowOrb.style.top = (clientY + 4) + 'px';
  }

  function onPointer(e){
    const p = (e.touches && e.touches[0]) ? e.touches[0] : e;
    const clientX = p.clientX;
    const clientY = p.clientY;
    if (typeof clientX !== 'number' || typeof clientY !== 'number') return;

    cx = (clientX / window.innerWidth) * 100;
    cy = (clientY / window.innerHeight) * 100;
    updateOrb(clientX, clientY);
  }

  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('touchmove', onPointer, { passive: true });
  window.addEventListener('pointerleave', () => glowOrb.style.opacity = '0');
  window.addEventListener('pointerenter', () => glowOrb.style.opacity = '1');

  (function loop(){
    tx += (cx - tx) * 0.26;
    ty += (cy - ty) * 0.26;
    sx += (cx - sx) * 0.08;
    sy += (cy - sy) * 0.08;

    setVars(tx.toFixed(2), ty.toFixed(2));
    root.style.setProperty('--mx2', sx.toFixed(2) + '%');
    root.style.setProperty('--my2', sy.toFixed(2) + '%');

    const px = (tx / 100) * window.innerWidth + 4;
    const py = (ty / 100) * window.innerHeight + 4;
    glowOrb.style.left = px + 'px';
    glowOrb.style.top = py + 'px';
    requestAnimationFrame(loop);
  })();

  const selectors = ['.card','.hero','.top-banner','.nav','.section','.primary-btn','.contact-btn','a'];
  function bind() {
    document.querySelectorAll(selectors.join(',')).forEach(el=>{
      el.addEventListener('mouseenter', ()=> document.body.classList.add('glow-boost'));
      el.addEventListener('mouseleave', ()=> document.body.classList.remove('glow-boost'));
      el.addEventListener('focus', ()=> document.body.classList.add('glow-boost'));
      el.addEventListener('blur', ()=> document.body.classList.remove('glow-boost'));
    });
  }
  bind(); setTimeout(bind, 400);

  document.addEventListener('touchstart', ()=>{
    document.body.classList.add('glow-boost');
    setTimeout(()=>document.body.classList.remove('glow-boost'), 800);
  }, { passive: true });
})();
