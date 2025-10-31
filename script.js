// Helpers
const $ = (s, c=document)=>c.querySelector(s);
const $$ = (s, c=document)=>Array.from(c.querySelectorAll(s));

/* Drawer */
const hand = $('.hand');
const drawer = $('#drawer');
const closeBtn = $('.drawer__close');
function toggleDrawer(open){
  if (open === undefined) open = !drawer.classList.contains('open');
  drawer.classList.toggle('open', open);
  drawer.setAttribute('aria-hidden', String(!open));
  hand.setAttribute('aria-expanded', String(open));
}
hand.addEventListener('click', ()=>toggleDrawer());
closeBtn.addEventListener('click', ()=>toggleDrawer(false));
$$('.drawer__link').forEach(a=>a.addEventListener('click', e=>{
  if ((a.getAttribute('href')||'').startsWith('#')) toggleDrawer(false);
}));

/* Header show when scrolled past ~45% viewport */
const hdr = $('.hdr');
function onScroll(){
  const threshold = innerHeight * 0.45;
  const show = scrollY > threshold;
  hdr.classList.toggle('show', show);
  document.body.classList.toggle('shrunk', show);
}
document.addEventListener('scroll', onScroll, {passive:true});
onScroll();

/* Tactile keys: random color, reset on 5th */
const keys = $$('.tactile .key');
const countMap = new WeakMap();
const palette = ['#ffd54a','#7ef9a9','#6a5cff','#ff699c','#4ad8ff','#ffb86b','#b4f5ff','#c9f','#f5ff7e','#9ef0d1'];
const rand = ()=>palette[(Math.random()*palette.length)|0];
keys.forEach(k=>{
  countMap.set(k,0);
  k.addEventListener('click', ()=>{
    k.classList.add('is-pressed'); setTimeout(()=>k.classList.remove('is-pressed'),110);
    const n = (countMap.get(k)||0)+1; countMap.set(k,n);
    if (n % 5 === 0){ k.style.setProperty('--cap','#fff'); k.style.background='#fff'; }
    else { const c = rand(); k.style.setProperty('--cap',c); k.style.background=c; }
  });
});

/* About: typewriter on first reveal */
const bioEl = $('#typedBio');
const bioText = `Hi! I'm Aizat — I craft playful, tactile interfaces and ship them with clean, resilient code. I care about accessibility and performance, and love turning scrappy prototypes into polished products.`;
let typed = false;
const io = new IntersectionObserver(([e])=>{
  if (e.isIntersecting && !typed){
    typed = true; typeWrite(bioEl, bioText, 70);
  }
},{threshold:0.35});
io.observe(bioEl);
function typeWrite(el, text, speed=70){
  let i=0;
  (function tick(){
    el.textContent = text.slice(0, i++);
    if (i<=text.length){
      const ch = text[i-1]; const delay = (ch==='.'||ch===','? 160:0);
      setTimeout(tick, speed+delay);
    }
  })();
}

/* Works: filter + custom cursor pill */
const works = $('.works');
const segs = $$('.seg[data-filter]');
const cards = $$('.grid .proj');
const pill = $('#cursorPill');

function applyFilter(key){
  segs.forEach(s=>s.classList.toggle('is-active', s.dataset.filter===key));
  cards.forEach(c=>{
    const tags = (c.getAttribute('data-tags')||'').toLowerCase();
    c.style.display = tags.includes(key) ? '' : 'none';
  });
}
segs.forEach(s=>s.addEventListener('click', ()=>applyFilter(s.dataset.filter)));
applyFilter('work');

works.addEventListener('mousemove', e=>{
  if (!e.target.closest('.proj')) { works.classList.remove('hovering'); pill.style.opacity=0; return; }
  works.classList.add('hovering');
  pill.style.transform = `translate(${e.clientX+14}px, ${e.clientY+14}px)`;
});
works.addEventListener('mouseleave', ()=>{ works.classList.remove('hovering'); pill.style.opacity=0; });

/* Smooth internal scroll */
document.addEventListener('click', e=>{
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href').slice(1);
  const el = document.getElementById(id);
  if (el){ e.preventDefault(); el.scrollIntoView({behavior:'smooth', block:'start'}); }
});

/* Snake Game */
const overlay = $('#gameOverlay');
const scoreVal = $('#scoreVal');
const finalScore = $('#finalScore');
const dialog = $('#gameOver');
const playAgain = $('#playAgain');
const exitBtns = [$('#exitGame'), $('#exitGame2')];
const canvas = $('#gameCanvas');
const ctx = canvas.getContext('2d');
const grid=20, cols=Math.floor(canvas.width/grid), rows=Math.floor(canvas.height/grid);
let loop=null, snake=[], dir={x:1,y:0}, next={x:1,y:0}, food=null, score=0;

function showGame(){ overlay.classList.add('on'); overlay.setAttribute('aria-hidden','false'); start(); }
function hideGame(){ overlay.classList.remove('on'); overlay.setAttribute('aria-hidden','true'); stop(); }
$('#playfulBtn').addEventListener('click', showGame);
exitBtns.forEach(b=>b.addEventListener('click', hideGame));

function start(){ reset(); window.addEventListener('keydown', onKey); loop=setInterval(step,100); }
function stop(){ clearInterval(loop); window.removeEventListener('keydown', onKey); }
function reset(){
  score=0; scoreVal.textContent='0'; dialog.classList.remove('show');
  const cx=cols>>1, cy=rows>>1;
  snake=[{x:cx,y:cy},{x:cx-1,y:cy},{x:cx-2,y:cy}];
  dir=next={x:1,y:0}; food=placeFood(); draw();
}
function placeFood(){ let p; do{ p={x:(Math.random()*cols)|0,y:(Math.random()*rows)|0}; }while(snake.some(s=>s.x===p.x&&s.y===p.y)); return p; }
function onKey(e){
  const k=e.key.toLowerCase();
  if((k==='arrowup'||k==='w') && dir.y!==1) next={x:0,y:-1};
  if((k==='arrowdown'||k==='s') && dir.y!==-1) next={x:0,y:1};
  if((k==='arrowleft'||k==='a') && dir.x!==1) next={x:-1,y:0};
  if((k==='arrowright'||k==='d') && dir.x!==-1) next={x:1,y:0};
}
function step(){
  dir=next;
  const head={x:snake[0].x+dir.x,y:snake[0].y+dir.y};
  if(head.x<0||head.y<0||head.x>=cols||head.y>=rows){ end(); return; }
  snake.unshift(head);
  if(head.x===food.x&&head.y===food.y){ score++; scoreVal.textContent=String(score); food=placeFood(); }
  else snake.pop();
  draw();
}
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='#4ad8ff'; ctx.beginPath();
  ctx.arc(food.x*grid+grid/2, food.y*grid+grid/2, grid*0.38, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle='#2bdc76';
  snake.forEach((s,i)=>{ const x=s.x*grid,y=s.y*grid; ctx.fillRect(x+2,y+2,grid-4,grid-4);
    if(i===0){ ctx.fillStyle='#111'; ctx.fillRect(x+grid/2,y+6,4,4); ctx.fillStyle='#2bdc76'; }});
}
function end(){ stop(); finalScore.textContent=String(score); dialog.classList.add('show'); }
playAgain.addEventListener('click', ()=>{ reset(); loop=setInterval(step,100); window.addEventListener('keydown', onKey); });

/* Keyboard open for PLAYFUL */
$('#playfulBtn').addEventListener('keydown', e=>{
  if (e.key===' '||e.key==='Enter'){ e.preventDefault(); showGame(); }
});

/**
 * Ensure the keycaps in .group-interactive spell “tactical”
 * without changing the HTML markup in source.
 * - If fewer caps exist, clone the last one until we have 8.
 * - If more exist, remove extras.
 * - Then set each glyph.
 */
(function () {
  const WORD = "tactical"; // 8 letters
  const group = document.querySelector(".group-interactive");
  if (!group) return;

  // collect current keycaps by the inner .text node
  const capTextEls = () => Array.from(group.querySelectorAll(".text"));

  // If there are no .text nodes yet, bail safely
  if (capTextEls().length === 0) return;

  // Grow to needed length by cloning the last cap
  while (capTextEls().length < WORD.length) {
    const lastCap = group.lastElementChild;
    if (!lastCap) break;
    const clone = lastCap.cloneNode(true);
    group.appendChild(clone);
  }

  // Shrink if too many caps
  while (capTextEls().length > WORD.length) {
    group.lastElementChild?.remove();
  }

  // Set letters
  capTextEls().forEach((el, i) => {
    el.textContent = WORD[i];
  });

  // Accessibility hint (optional, doesn’t touch structure)
  const groupRole = group.getAttribute("role");
  if (!groupRole) {
    group.setAttribute("role", "group");
  }
  group.setAttribute("aria-label", `Interactive word: ${WORD}`);
})();