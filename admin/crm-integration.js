/* ALVA ↔ CRM · Fase F
   Registro comercial/técnico del producto. No consulta datos operativos del CRM. */
(() => {
  const integration={product:null,env:null};
  const statusLabels={active:'Activo',planned:'Preparado',inactive:'Inactivo'};

  function panel(){
    let el=document.getElementById('crm-integration');
    if(el)return el;
    const grid=document.getElementById('products-grid');
    if(!grid)return null;
    el=document.createElement('section');
    el.id='crm-integration';
    el.className='crm-integration';
    el.dataset.integrationPhase='F';
    el.innerHTML=`
      <div class="crm-head">
        <div class="crm-brandline">
          <div class="crm-mark">CRM</div>
          <div>
            <span class="eyebrow">INTEGRACIÓN MULTIPRODUCTO · FASE F</span>
            <h3>ALVA CRM</h3>
            <p>Registro central del producto y su infraestructura, sin mezclar la operación de cada tenant con ALVA Core.</p>
          </div>
        </div>
        <div class="crm-actions">
          <a id="crm-public-link" href="#" target="_blank" rel="noopener" hidden>Abrir CRM ↗</a>
          <a id="crm-admin-link" href="#" target="_blank" rel="noopener" hidden>Control Center ↗</a>
        </div>
      </div>
      <div id="crm-stats" class="crm-stats"></div>
      <div class="crm-boundary">
        <strong>Separación operativa</strong>
        <span>ALVA Admin conserva cliente, producto, plan, cobranza y soporte. Prospectos, clientes, agenda, contratos y demás operación continúan exclusivamente dentro del Supabase del CRM.</span>
      </div>
      <p id="crm-cutover-note" class="crm-note"></p>`;
    grid.insertAdjacentElement('afterend',el);
    return el;
  }

  async function load(){
    if(typeof state==='undefined'||!state.db||!state.user)return;
    panel();
    const {data:products,error:productError}=await state.db.from('alva_products').select('id,code,name,status,app_url,admin_url').eq('code','CRM').limit(1);
    if(productError)return;
    integration.product=products?.[0]||null;
    if(!integration.product)return;
    const {data:env}=await state.db.from('alva_product_environments').select('*').eq('product_id',integration.product.id).eq('environment','production').maybeSingle();
    integration.env=env||null;
    render();
  }

  function setLink(id,url,label){
    const link=document.getElementById(id);
    if(!link)return;
    link.hidden=!url;
    if(url){link.href=url;link.textContent=label;}
  }

  function render(){
    const el=panel();
    if(!el||!integration.product)return;
    const env=integration.env;
    const metadata=env?.metadata||{};
    const active=env?.status==='active';
    const appUrl=active?(env?.app_url||integration.product.app_url):(metadata.preview_url||null);
    const adminUrl=active?(env?.admin_url||integration.product.admin_url):(metadata.preview_admin_url||null);
    setLink('crm-public-link',appUrl,active?'Abrir CRM ↗':'Abrir preview ↗');
    setLink('crm-admin-link',adminUrl,active?'Control Center ↗':'Preview Admin ↗');

    const stats=document.getElementById('crm-stats');
    if(stats)stats.innerHTML=`
      <div class="crm-stat"><span>Integración</span><strong>${statusLabels[env?.status]||'Pendiente'}</strong><small>${active?'Producción':'Corte pendiente'}</small></div>
      <div class="crm-stat"><span>Arquitectura</span><strong>Multi-tenant</strong><small>/app/&lt;tenant&gt;/</small></div>
      <div class="crm-stat"><span>Datos operativos</span><strong>Separados</strong><small>Supabase propio del CRM</small></div>`;

    const note=document.getElementById('crm-cutover-note');
    if(note)note.innerHTML=active
      ?'<b>Producción activa:</b> ALVA utiliza las URLs canónicas registradas para CRM.'
      :'<b>Fase F preparada:</b> las URLs canónicas están registradas como planeadas. La activación productiva se realizará únicamente durante la Fase G, después del QA completo.';
  }

  const wait=setInterval(()=>{
    if(typeof state!=='undefined'&&state.user&&state.db){clearInterval(wait);load();}
  },250);
  setTimeout(()=>clearInterval(wait),15000);

  if(typeof openView==='function'){
    const previous=openView;
    openView=async function(id,push=true){
      await previous(id,push);
      if(id==='products')await load();
    };
  }
})();
