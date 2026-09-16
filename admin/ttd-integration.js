/* ALVA ↔ TTD · conexión de producto y SSO de un solo uso */
(() => {
  const integration={env:null,product:null,accounts:[]};
  const labels={advisor:'Asesor',business:'Negocio',trial:'Prueba',active:'Activo',inactive:'Inactivo',suspended:'Suspendido',archived:'Archivado'};

  function panel(){
    let el=document.getElementById('ttd-integration');
    if(el)return el;
    const grid=document.getElementById('products-grid');
    if(!grid)return null;
    el=document.createElement('section');el.id='ttd-integration';el.className='ttd-integration';
    el.innerHTML='<div class="ttd-head"><div class="ttd-brandline"><div class="ttd-mark">TTD</div><div><h3>TTD · Tu Tarjeta Digital</h3><p>Primer producto conectado al control central de ALVA.</p></div></div><div class="ttd-actions"><a id="ttd-public-link" href="#" target="_blank" rel="noopener">Abrir TTD ↗</a><button id="ttd-admin-link" type="button">Administrar TTD ↗</button></div></div><div id="ttd-stats" class="ttd-stats"></div><div id="ttd-account-list" class="ttd-account-list"></div><p class="ttd-note"><b>Acceso unificado:</b> ALVA solicita a Supabase un token de acceso de un solo uso para TTD. Tu contraseña y tu refresh token no se comparten entre dominios.</p>';
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
    const adminButton=document.getElementById('ttd-admin-link');
    if(adminButton){
      const owner=state.role?.slug==='owner';
      adminButton.hidden=!owner;
      adminButton.disabled=adminUrl==='#';
      adminButton.dataset.url=adminUrl;
    }
    const active=integration.accounts.filter(x=>x.status==='active').length;
    const trials=integration.accounts.filter(x=>x.status==='trial').length;
    const cross=integration.accounts.filter(x=>x.metadata?.ttd_package_key==='cross_promo').length;
    const stats=document.getElementById('ttd-stats');if(stats)stats.innerHTML=`<div class="ttd-stat"><span>Cuentas enlazadas</span><strong>${integration.accounts.length}</strong></div><div class="ttd-stat"><span>Activas / prueba</span><strong>${active} / ${trials}</strong></div><div class="ttd-stat"><span>Publicidad cruzada</span><strong>${cross}</strong></div>`;
    const list=document.getElementById('ttd-account-list');if(list)list.innerHTML=integration.accounts.map(a=>`<div class="ttd-account"><div><strong>${esc(a.label||a.external_slug||'Cuenta TTD')}</strong><small>${esc(labels[a.external_account_type]||a.external_account_type)} · ${esc(labels[a.status]||a.status)}${a.metadata?.ttd_package_key?` · ${esc(a.metadata.ttd_package_key)}`:''}</small></div>${a.public_url?`<a href="${esc(a.public_url)}" target="_blank" rel="noopener">Abrir tarjeta ↗</a>`:''}</div>`).join('')||'<div class="empty-state">Todavía no hay cuentas TTD enlazadas.</div>';
  }

  async function openAdmin(){
    const url=document.getElementById('ttd-admin-link')?.dataset.url||integration.env?.admin_url||integration.product?.admin_url;
    if(!url||state.role?.slug!=='owner')return;
    const targetWindow=window.open('about:blank','alva-ttd-admin');
    if(!targetWindow){toast('El navegador bloqueó la ventana de TTD.',true);return}
    try{
      targetWindow.document.write('<title>Conectando con TTD…</title><body style="font-family:system-ui;display:grid;place-items:center;min-height:100vh;margin:0;background:#111316;color:#fff">Conectando con TTD…</body>');
    }catch{}
    toast('Creando acceso seguro a TTD…');
    const {data,error}=await state.db.functions.invoke('alva-ttd-sso',{body:{target:'ttd-admin'}});
    if(error||!data?.token_hash){
      try{targetWindow.close()}catch{}
      toast('No fue posible crear el acceso unificado a TTD.',true);
      return;
    }
    const target=new URL(url);
    target.hash=`alva_sso=${encodeURIComponent(data.token_hash)}`;
    targetWindow.location.replace(target.toString());
  }

  const wait=setInterval(()=>{
    if(typeof state!=='undefined'&&state.user&&state.db){clearInterval(wait);load();}
  },250);
  setTimeout(()=>clearInterval(wait),15000);

  if(typeof openView==='function'){
    const previous=openView;
    openView=async function(id,push=true){await previous(id,push);if(id==='products')await load();};
  }
})();
