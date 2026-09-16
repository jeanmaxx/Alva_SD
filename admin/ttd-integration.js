/* ALVA ↔ TTD · conexión de producto y handoff de sesión */
(() => {
  const integration={env:null,product:null,accounts:[],window:null,origin:null};
  const labels={advisor:'Asesor',business:'Negocio',trial:'Prueba',active:'Activo',inactive:'Inactivo',suspended:'Suspendido',archived:'Archivado'};

  function panel(){
    let el=document.getElementById('ttd-integration');
    if(el)return el;
    const grid=document.getElementById('products-grid');
    if(!grid)return null;
    el=document.createElement('section');el.id='ttd-integration';el.className='ttd-integration';
    el.innerHTML='<div class="ttd-head"><div class="ttd-brandline"><div class="ttd-mark">TTD</div><div><h3>TTD · Tu Tarjeta Digital</h3><p>Primer producto conectado al control central de ALVA.</p></div></div><div class="ttd-actions"><a id="ttd-public-link" href="#" target="_blank" rel="noopener">Abrir TTD ↗</a><button id="ttd-admin-link" type="button">Administrar TTD ↗</button></div></div><div id="ttd-stats" class="ttd-stats"></div><div id="ttd-account-list" class="ttd-account-list"></div><p class="ttd-note"><b>Acceso unificado:</b> ALVA y TTD usan la misma identidad de Supabase. Al abrir la administración desde aquí, ALVA puede entregar la sesión al panel TTD sin compartir tu contraseña.</p>';
    grid.insertAdjacentElement('afterend',el);
    document.getElementById('ttd-admin-link')?.addEventListener('click',openAdmin);
    return el;
  }

  async function load(){
    if(typeof state==='undefined'||!state.db||!state.user)return;
    panel();
    const {data:products}=await state.db.from('alva_products').select('id,code,name,app_url,admin_url,status').eq('code','TTD').limit(1);
    integration.product=products?.[0]||null;if(!integration.product)return;
    const [envRes,accRes]=await Promise.all([
      state.db.from('alva_product_environments').select('*').eq('product_id',integration.product.id).eq('environment','production').maybeSingle(),
      state.db.from('alva_product_accounts').select('*').eq('product_id',integration.product.id).order('label')
    ]);
    integration.env=envRes.data||null;integration.accounts=accRes.data||[];
    render();
  }

  function render(){
    const el=panel();if(!el||!integration.product)return;
    const appUrl=integration.env?.app_url||integration.product.app_url||'#';
    const adminUrl=integration.env?.admin_url||integration.product.admin_url||'#';
    const publicLink=document.getElementById('ttd-public-link');if(publicLink)publicLink.href=appUrl;
    const adminButton=document.getElementById('ttd-admin-link');if(adminButton){adminButton.disabled=adminUrl==='#';adminButton.dataset.url=adminUrl;}
    const active=integration.accounts.filter(x=>x.status==='active').length;
    const trials=integration.accounts.filter(x=>x.status==='trial').length;
    const cross=integration.accounts.filter(x=>x.metadata?.ttd_package_key==='cross_promo').length;
    const stats=document.getElementById('ttd-stats');if(stats)stats.innerHTML=`<div class="ttd-stat"><span>Cuentas enlazadas</span><strong>${integration.accounts.length}</strong></div><div class="ttd-stat"><span>Activas / prueba</span><strong>${active} / ${trials}</strong></div><div class="ttd-stat"><span>Publicidad cruzada</span><strong>${cross}</strong></div>`;
    const list=document.getElementById('ttd-account-list');if(list)list.innerHTML=integration.accounts.map(a=>`<div class="ttd-account"><div><strong>${esc(a.label||a.external_slug||'Cuenta TTD')}</strong><small>${esc(labels[a.external_account_type]||a.external_account_type)} · ${esc(labels[a.status]||a.status)}${a.metadata?.ttd_package_key?` · ${esc(a.metadata.ttd_package_key)}`:''}</small></div>${a.public_url?`<a href="${esc(a.public_url)}" target="_blank" rel="noopener">Abrir tarjeta ↗</a>`:''}</div>`).join('')||'<div class="empty-state">Todavía no hay cuentas TTD enlazadas.</div>';
  }

  async function openAdmin(){
    const url=document.getElementById('ttd-admin-link')?.dataset.url||integration.env?.admin_url||integration.product?.admin_url;
    if(!url)return;
    let target;try{target=new URL(url);}catch{return}
    integration.origin=target.origin;
    integration.window=window.open(url,'alva-ttd-admin');
    if(!integration.window){toast('El navegador bloqueó la ventana de TTD.',true);return}
    toast('Abriendo administración TTD…');
    setTimeout(async()=>{
      if(!integration.window||integration.window.closed)return;
      const {data:{session}}=await state.db.auth.getSession();
      if(session){
        integration.window.postMessage({type:'alva-ttd-session',access_token:session.access_token,refresh_token:session.refresh_token},integration.origin);
      }
    },900);
  }

  window.addEventListener('message',async event=>{
    if(event.data?.type!=='ttd-admin-ready'||!integration.window||event.source!==integration.window||event.origin!==integration.origin)return;
    const {data:{session}}=await state.db.auth.getSession();
    if(!session)return;
    integration.window.postMessage({type:'alva-ttd-session',access_token:session.access_token,refresh_token:session.refresh_token},integration.origin);
  });

  const wait=setInterval(()=>{
    if(typeof state!=='undefined'&&state.user&&state.db){clearInterval(wait);load();}
  },250);
  setTimeout(()=>clearInterval(wait),15000);

  if(typeof openView==='function'){
    const previous=openView;
    openView=async function(id,push=true){await previous(id,push);if(id==='products')await load();};
  }
})();
