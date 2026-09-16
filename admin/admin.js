const labels = {
  dashboard:'Dashboard', clients:'Clientes / Empresas', products:'Productos y servicios',
  subscriptions:'Suscripciones / Licencias', users:'Usuarios y accesos', billing:'Cobranza',
  support:'Soporte', audit:'Auditoría', settings:'Configuración'
};

const state = { db:null, user:null, profile:null, role:null, companies:[], products:[], audit:[] };
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const fmtDate = value => value ? new Intl.DateTimeFormat('es-MX',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value)) : '—';
const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

function toast(message, error=false){
  const el=$('#toast'); if(!el) return; el.textContent=message; el.className=`toast show${error?' error':''}`; clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.className='toast',2800);
}
function badge(status){
  const map={active:'green',prospect:'amber',reserved:'amber',inactive:'',suspended:'red',retired:'red'};
  return `<span class="badge ${map[status]||''}">${esc(status)}</span>`;
}
function initials(name){return (name||'ALVA').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()}
function showLogin(message=''){$('#login-screen').hidden=false;$('#admin-app').hidden=true;$('#login-error').textContent=message}
function showApp(){$('#login-screen').hidden=true;$('#admin-app').hidden=false}

async function init(){
  if(!window.supabase || !window.ALVA_SUPABASE){showLogin('No fue posible cargar la conexión segura.');return}
  state.db=window.supabase.createClient(window.ALVA_SUPABASE.url,window.ALVA_SUPABASE.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const {data:{session}}=await state.db.auth.getSession();
  if(session) await authorize(session.user); else showLogin();
  state.db.auth.onAuthStateChange(async (event,session)=>{
    if(event==='SIGNED_OUT'){state.user=null;state.profile=null;showLogin()}
    if(event==='SIGNED_IN' && session && !state.user) await authorize(session.user);
  });
}

async function authorize(user){
  state.user=user;
  const {data:profile,error}=await state.db.from('alva_profiles').select('id,full_name,display_name,role_id,is_active,created_at').eq('id',user.id).maybeSingle();
  if(error || !profile || !profile.is_active){await state.db.auth.signOut();showLogin('Esta cuenta no tiene acceso autorizado a ALVA Admin.');return}
  const {data:role,error:roleError}=await state.db.from('alva_roles').select('slug,name').eq('id',profile.role_id).maybeSingle();
  if(roleError || !role){await state.db.auth.signOut();showLogin('No fue posible validar el rol administrativo.');return}
  state.profile=profile; state.role=role;
  $('#session-user').textContent=user.email||profile.display_name||'';
  $('#logout-button').textContent=initials(profile.display_name||profile.full_name||user.email);
  showApp(); bindApp(); await loadDashboard();
  const initial=location.hash.replace('#',''); openView(labels[initial]?initial:'dashboard',false);
}

$('#login-form')?.addEventListener('submit',async e=>{
  e.preventDefault(); $('#login-error').textContent='';
  const button=e.currentTarget.querySelector('button[type="submit"]'); button.disabled=true; button.textContent='Ingresando…';
  const {error}=await state.db.auth.signInWithPassword({email:$('#login-email').value.trim(),password:$('#login-password').value});
  if(error) $('#login-error').textContent='No se pudo iniciar sesión. Verifica correo y contraseña.';
  button.disabled=false; button.textContent='Iniciar sesión';
});

function bindApp(){
  if(bindApp.done) return; bindApp.done=true;
  $$('.nav-item').forEach(item=>item.addEventListener('click',()=>openView(item.dataset.view)));
  $$('[data-go]').forEach(button=>button.addEventListener('click',()=>openView(button.dataset.go)));
  $('.sidebar-toggle')?.addEventListener('click',()=>$('.sidebar')?.classList.toggle('open'));
  $('#logout-button')?.addEventListener('click',async()=>{await state.db.auth.signOut();toast('Sesión cerrada')});
  $('#new-company')?.addEventListener('click',()=>openCompany());
  $('#new-product')?.addEventListener('click',()=>openProduct());
  $('#refresh-audit')?.addEventListener('click',loadAudit);
  $('#company-form')?.addEventListener('submit',saveCompany);
  $('#product-form')?.addEventListener('submit',saveProduct);
  $$('[data-close-dialog]').forEach(b=>b.addEventListener('click',()=>document.getElementById(b.dataset.closeDialog)?.close()));
}

async function openView(id,push=true){
  $$('.nav-item').forEach(item=>item.classList.toggle('active',item.dataset.view===id));
  $$('.view').forEach(view=>view.classList.toggle('active',view.id===id));
  $('#page-title').textContent=labels[id]||'ALVA Admin'; $('.sidebar')?.classList.remove('open');
  if(push) history.replaceState(null,'',`#${id}`);
  if(id==='clients') await loadCompanies();
  if(id==='products') await loadProducts(true);
  if(id==='users') await loadUsers();
  if(id==='audit') await loadAudit();
}

async function loadDashboard(){
  const [c,p,u]=await Promise.all([
    state.db.from('alva_companies').select('*',{count:'exact',head:true}).eq('status','active'),
    state.db.from('alva_products').select('*',{count:'exact',head:true}).eq('status','active'),
    state.db.from('alva_profiles').select('*',{count:'exact',head:true}).eq('is_active',true)
  ]);
  $('#metric-clients').textContent=c.count??'—'; $('#metric-products').textContent=p.count??'—'; $('#metric-users').textContent=u.count??'—';
  $('#metric-role').textContent=state.role?.name||'—'; $('#metric-role-detail').textContent=state.profile?.display_name||'Acceso protegido';
  await Promise.all([loadProducts(false),loadAudit(true)]);
}

async function loadProducts(full=false){
  const {data,error}=await state.db.from('alva_products').select('*').order('sort_order',{ascending:true}).order('name',{ascending:true});
  if(error){toast('No se pudo cargar el catálogo.',true);return} state.products=data||[];
  const dash=$('#dashboard-products');
  if(dash) dash.innerHTML=state.products.slice(0,4).map((p,i)=>`<div class="data-row"><span class="data-icon ${i===1?'dark':p.status==='reserved'?'muted':''}">${esc(p.code.slice(0,2))}</span><div><strong>${esc(p.name)}</strong><small>${esc(p.description||'Producto ALVA')}</small></div>${badge(p.status)}</div>`).join('')||'<div class="empty-state">Sin productos.</div>';
  if(full){
    const grid=$('#products-grid'); grid.classList.remove('loading-state');
    grid.innerHTML=state.products.map(p=>`<article class="catalog-card"><div class="catalog-top"><span class="catalog-code">${esc(p.code)}</span>${badge(p.status)}</div><h3>${esc(p.name)}</h3><p>${esc(p.description||'Sin descripción')}</p><div class="catalog-meta"><span>${esc(p.product_type)}</span><span>${esc(p.billing_mode)}</span><span>${p.base_price==null?'Precio por definir':new Intl.NumberFormat('es-MX',{style:'currency',currency:p.currency||'MXN'}).format(p.base_price)}</span></div><div class="catalog-actions"><button class="row-button" data-edit-product="${p.id}">Editar</button></div></article>`).join('')||'<div class="empty-state">Sin productos.</div>';
    $$('[data-edit-product]').forEach(b=>b.addEventListener('click',()=>openProduct(b.dataset.editProduct)));
  }
}

async function loadCompanies(){
  const {data,error}=await state.db.from('alva_companies').select('*').order('updated_at',{ascending:false});
  if(error){toast('No se pudieron cargar las empresas.',true);return} state.companies=data||[];
  const body=$('#companies-table'); body.innerHTML=state.companies.map(c=>`<tr><td><strong>${esc(c.trade_name)}</strong><small>${esc(c.legal_name||'')}</small></td><td><strong>${esc(c.contact_name||'—')}</strong><small>${esc(c.email||c.phone||'')}</small></td><td>${esc(c.tax_id||'—')}</td><td>${badge(c.status)}</td><td>${fmtDate(c.updated_at)}</td><td><div class="row-actions"><button class="row-button" data-edit-company="${c.id}">Editar</button></div></td></tr>`).join('');
  $('#companies-empty').hidden=state.companies.length>0; $$('[data-edit-company]').forEach(b=>b.addEventListener('click',()=>openCompany(b.dataset.editCompany)));
}

function openCompany(id=null){
  const c=state.companies.find(x=>x.id===id); $('#company-dialog-title').textContent=c?'Editar empresa':'Nueva empresa';
  $('#company-id').value=c?.id||''; $('#company-trade-name').value=c?.trade_name||''; $('#company-legal-name').value=c?.legal_name||''; $('#company-tax-id').value=c?.tax_id||''; $('#company-status').value=c?.status||'active'; $('#company-contact').value=c?.contact_name||''; $('#company-email').value=c?.email||''; $('#company-phone').value=c?.phone||''; $('#company-notes').value=c?.notes||''; $('#company-dialog').showModal();
}
async function saveCompany(e){
  e.preventDefault(); const id=$('#company-id').value;
  const payload={trade_name:$('#company-trade-name').value.trim(),legal_name:$('#company-legal-name').value.trim()||null,tax_id:$('#company-tax-id').value.trim().toUpperCase()||null,status:$('#company-status').value,contact_name:$('#company-contact').value.trim()||null,email:$('#company-email').value.trim()||null,phone:$('#company-phone').value.trim()||null,notes:$('#company-notes').value.trim()||null,updated_by:state.user.id};
  let result; if(id) result=await state.db.from('alva_companies').update(payload).eq('id',id); else result=await state.db.from('alva_companies').insert({...payload,created_by:state.user.id});
  if(result.error){toast(result.error.message.includes('unique')?'El RFC ya está registrado.':'No se pudo guardar la empresa.',true);return}
  $('#company-dialog').close(); toast('Empresa guardada'); await loadCompanies(); await loadDashboard();
}

function openProduct(id=null){
  const p=state.products.find(x=>x.id===id); $('#product-dialog-title').textContent=p?'Editar producto':'Nuevo producto';
  $('#product-id').value=p?.id||''; $('#product-code').value=p?.code||''; $('#product-code').disabled=!!p; $('#product-name').value=p?.name||''; $('#product-type').value=p?.product_type||'software'; $('#product-status').value=p?.status||'active'; $('#product-billing').value=p?.billing_mode||'custom'; $('#product-price').value=p?.base_price??''; $('#product-description').value=p?.description||''; $('#product-dialog').showModal();
}
async function saveProduct(e){
  e.preventDefault(); const id=$('#product-id').value;
  const payload={name:$('#product-name').value.trim(),product_type:$('#product-type').value,status:$('#product-status').value,billing_mode:$('#product-billing').value,base_price:$('#product-price').value===''?null:Number($('#product-price').value),description:$('#product-description').value.trim()||null,updated_by:state.user.id};
  let result; if(id) result=await state.db.from('alva_products').update(payload).eq('id',id); else result=await state.db.from('alva_products').insert({...payload,code:$('#product-code').value.trim().toUpperCase(),sort_order:(state.products.length+1)*10,created_by:state.user.id});
  if(result.error){toast('No se pudo guardar el producto.',true);return}
  $('#product-dialog').close(); toast('Producto guardado'); await loadProducts(true); await loadDashboard();
}

async function loadUsers(){
  const [{data:profiles,error},{data:roles}]=await Promise.all([state.db.from('alva_profiles').select('*').order('created_at'),state.db.from('alva_roles').select('id,slug,name')]);
  if(error){toast('No se pudieron cargar los usuarios.',true);return} const roleMap=Object.fromEntries((roles||[]).map(r=>[r.id,r]));
  $('#users-table').innerHTML=(profiles||[]).map(p=>`<tr><td><strong>${esc(p.display_name||p.full_name||'Usuario')}</strong><small>${p.id===state.user.id?esc(state.user.email||'Cuenta actual'):esc(p.id)}</small></td><td>${esc(roleMap[p.role_id]?.name||'—')}</td><td>${p.is_active?'<span class="badge green">Activo</span>':'<span class="badge red">Inactivo</span>'}</td><td>${fmtDate(p.created_at)}</td></tr>`).join('');
}

async function loadAudit(dashboardOnly=false){
  const {data,error}=await state.db.from('alva_audit_logs').select('id,table_name,record_id,action,created_at').order('created_at',{ascending:false}).limit(dashboardOnly?5:50);
  if(error){if(!dashboardOnly)toast('No se pudo cargar la auditoría.',true);return} state.audit=data||[];
  const dash=$('#dashboard-audit'); if(dash) dash.innerHTML=state.audit.slice(0,5).map(a=>`<div class="data-row"><span class="data-icon muted">${a.action==='INSERT'?'+':a.action==='UPDATE'?'↻':'−'}</span><div><strong>${esc(a.action)} · ${esc(a.table_name.replace('alva_',''))}</strong><small>${fmtDate(a.created_at)}</small></div></div>`).join('')||'<div class="empty-state">Sin actividad registrada.</div>';
  if(!dashboardOnly){$('#audit-table').innerHTML=state.audit.map(a=>`<tr><td>${fmtDate(a.created_at)}</td><td>${badge(a.action.toLowerCase()==='insert'?'active':a.action.toLowerCase()==='delete'?'retired':'reserved')}</td><td>${esc(a.table_name.replace('alva_',''))}</td><td><code>${esc((a.record_id||'—').slice(0,12))}</code></td></tr>`).join('')||'<tr><td colspan="4">Sin actividad.</td></tr>'}
}

init().catch(error=>{console.error(error);showLogin('Ocurrió un problema al iniciar ALVA Admin.')});
