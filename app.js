(function(){
  const $ = (s,root=document) => root.querySelector(s);
  const $$ = (s,root=document) => [...root.querySelectorAll(s)];

  // THEME
  function currentTheme(){ return document.documentElement.getAttribute('data-theme') || 'light'; }
  function setTheme(theme){
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    const logo = $('#logo');
    if(logo) logo.src = (theme==='dark')?logo.dataset.dark:logo.dataset.light;
    const fav = $('#favicon');
    if(fav) fav.href = (theme==='dark')?'D.png':'L.png';
  }

  // UI TEXT
  const UI = {
    sub:"Open-source projects showcase",
    search:"Search projects...",
    hi:"Hi — we are AbikusSudoTM",
    intro:"We build small, useful open-source tools and utilities. Browse projects below. Click a card to see details, usage notes and repository links.",
    status:"Status",
    details:"Details",
    link:"Open",
    close:"Close",
    loading1:"Preparing assets…",
    loading2:"Fetching project list…"
  };

  function applyUIText(){
    $('#siteSub').textContent = UI.sub;
    $('#searchInput').placeholder = UI.search;
    $('#introTitle').textContent = UI.hi;
    $('#introText').textContent = UI.intro;
    $('#statusTitle').textContent = UI.status;
    $('#closeModal').textContent = UI.close;
  }

  let PROJECTS_DATA = null;
  function normalizeText(val){ return val || ''; }

  function buildCard(name,p){
    const desc = normalizeText(p.desc);
    const stat = normalizeText(p.stat);
    const link = p.link||'#';
    const card = document.createElement('div');
    card.className='card';
    card.dataset.project=name;
    card.innerHTML=`
      <h3>${normalizeText(p.title)||name}</h3>
      <p>${desc}</p>
      <div class="meta">
        ${stat?`<span class="badge">${stat}</span>`:''}
        <a class="link" href="${link}" target="_blank" rel="noopener">${UI.link}</a>
        <button class="link" data-action="open" data-project="${name}">${UI.details}</button>
      </div>`;
    return card;
  }

  function renderProjects(filterText=''){
    const wrap = $('#projects');
    wrap.innerHTML='';
    if(!PROJECTS_DATA) return;
    const list = Array.isArray(PROJECTS_DATA.projects)?PROJECTS_DATA.projects:[];
    const q = filterText.trim().toLowerCase();
    list.forEach(name=>{
      const p = PROJECTS_DATA[name];
      if(!p) return;
      const title=(normalizeText(p.title)||name).toLowerCase();
      const desc = normalizeText(p.desc).toLowerCase();
      if(q && !(title.includes(q)||desc.includes(q))) return;
      const card=buildCard(name,p);
      wrap.appendChild(card);
    });
    wrap.classList.add('fade-in');
    attachModalHandlers();
  }

  function attachModalHandlers(){
    $$('[data-action="open"]').forEach(btn=>btn.addEventListener('click',()=>{
      openModal(btn.dataset.project);
    }));
  }

  function openModal(key){
    if(!PROJECTS_DATA||!PROJECTS_DATA[key]) return;
    const data=PROJECTS_DATA[key];
    const title=normalizeText(data.title)||key;
    const desc=normalizeText(data.desc);
    const stat=normalizeText(data.stat);
    const features=Array.isArray(data.features)?data.features:[];
    const usage=Array.isArray(data.usage)?data.usage:[];
    const links=Array.isArray(data.links)?data.links:[];
    $('#modalContent').innerHTML=`
      <h3>${title}</h3>
      ${stat?`<span class="badge">${stat}</span>`:''}
      ${desc?`<p>${desc}</p>`:''}
      ${features.length?`<div><strong>Features:</strong><ul>${features.map(f=>`<li>${normalizeText(f)}</li>`).join('')}</ul></div>`:''}
      ${usage.length?`<div><strong>Usage:</strong>${usage.map(u=>`<pre>${normalizeText(u)}</pre>`).join('')}</div>`:''}
      ${links.length?`<div><strong>Links:</strong>${links.map(l=>`<a class="link" href="${l.url}" target="_blank">${normalizeText(l.label||l)}</a>`).join(' ')}</div>`:''}`;
    const overlay=$('#overlay');
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden','false');
  }

  function closeModal(){
    const overlay=$('#overlay');
    if(!overlay) return;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden','true');
    $('#modalContent').innerHTML='';
  }

  function preloadImage(src){ return new Promise(res=>{ const img=new Image(); img.onload=img.onerror=()=>res(src); img.src=src; }); }
  function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }

  async function boot(){
    setTheme(currentTheme());
    applyUIText();
    $('#loaderSub').textContent=UI.loading1;

    const minMs=3000+Math.floor(Math.random()*2000);
    const start=Date.now();
    let fake=0;
    const bar=$('#progressBar');
    const info=$('#progressInfo');

    const tick=setInterval(()=>{
      const elapsed=Date.now()-start;
      const target=Math.min(90, Math.floor(elapsed/minMs*95));
      fake=Math.max(fake,target);
      if(bar) bar.style.width=fake+'%';
      if(info) info.textContent=fake+'%';
    },120);

    const real=(async()=>{
      $('#loaderSub').textContent=UI.loading2;
      const [_,__,data]=await Promise.all([
        preloadImage('L.png'),
        preloadImage('D.png'),
        fetch('projects.json',{cache:'no-store'}).then(r=>r.json())
      ]);
      PROJECTS_DATA=data;
    })();

    await Promise.all([real,wait(minMs)]);
    clearInterval(tick);
    if(bar) bar.style.width='100%';
    if(info) info.textContent='100%';
    renderProjects('');
    $('#loader').classList.add('hide');
  }

  document.addEventListener('DOMContentLoaded',()=>{
    if($('#themeBtn')) $('#themeBtn').addEventListener('click',()=>setTheme(currentTheme()==='dark'?'light':'dark'));
    const search=$('#searchInput');
    if(search) search.addEventListener('input',e=>renderProjects(e.target.value||''));
    $('#closeModal').addEventListener('click',closeModal);
    $('#overlay').addEventListener('click', e=>{if(e.target.id==='overlay') closeModal();});
    document.addEventListener('keydown', e=>{if(e.key==='Escape') closeModal();});
    boot();
  });
})();

