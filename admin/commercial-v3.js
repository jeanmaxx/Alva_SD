/* ALVA Admin — modelo comercial v3 (hotfix estable) */
(()=>{
  const cm={conditions:[],prices:[],subscriptions:[],plans:[]};
  const freqLabel={monthly:'Mensual',annual:'Anual',quarterly:'Trimestral',semiannual:'Semestral',one_time:'Pago único',custom:'Personalizada'};
  const money=(v,c='MXN')=>new Intl.NumberFormat('es-MX',{style:'currency',currency:c||'MXN'}).format(Number(v||0));
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  let loading=null;

  async function waitForReady(timeoutMs=12000){
    const started=Date.now();
    while(Date.now()-started<timeoutMs){
      try{
        if(typeof state!=='undefined'&&state?.db&&state?.user&&document.querySelector('#subscription-form'))return true;
      }catch(_){ }
      await sleep(100);
    }
    return false;
  }

  async function loadCommercial(force=false){
    if(loading&&!force)return loading;
    loading=(async()=>{
      if(!await waitForReady())return false;
      const [c,p,s,pl]=await Promise.all([
        state.db.from('alva_commercial_conditions').select('*').eq('status','active').order('sort_order'),
        state.db.from('alva_plan_prices').select('*').eq('status','active').order('billing_frequency'),
        state.db.from('alva_subscriptions').select('id,commercial_condition_id,plan_id,billing_frequency,contracted_price,company_id,product_id,status').order('updated_at',{ascending:false}),
        state.db.from('alva_product_plans').select('id,product_id,code,name,status,billing_frequency,price,currency').order('sort_order')
      ]);
      const err=c.error||p.error||s.error||pl.error;
      if(err){console.error('ALVA commercial-v3:',err);return false;}
      cm.conditions=c.data||[];cm.prices=p.data||[];cm.subscriptions=s.data||[];cm.plans=pl.data||[];
      return true;
    })();
    const ok=await loading;loading=null;return ok;
  }

  const condition=id=>cm.conditions.find(x=>x.id===id);
  const normalCondition=()=>cm.conditions.find(x=>x.code==='NORMAL');
  const priceFor=(planId,frequency)=>cm.prices.find(x=>x.plan_id===planId&&x.billing_frequency===frequency)||cm.prices.find(x=>x.plan_id===planId&&x.is_default);

  function ensureAssets(){
    if(document.querySelector('link[data-commercial-v3]'))return;
    const l=document.createElement('link');l.rel='stylesheet';l.href='./commercial-v2.css?v=20260916-3';l.dataset.commercialV3='1';document.head.appendChild(l);
  }

  function ensureConditionField(){
    const plan=document.querySelector('#subscription-plan');
    if(!plan)return null;
    let select=document.querySelector('#subscription-condition');
    if(!select){
      const label=document.createElement('label');
      label.innerHTML='Condición comercial<select id="subscription-condition" required><option value="">Cargando condiciones…</option></select><small id="subscription-condition-note" class="activation-note"></small>';
      plan.closest('label')?.after(label);
      select=label.querySelector('select');
      select?.addEventListener('change',()=>syncCommercialFields(true));
      document.querySelector('#subscription-frequency')?.addEventListener('change',()=>syncCommercialFields(true));
      plan.addEventListener('change',()=>setTimeout(()=>syncCommercialFields(true),0));
    }
    const price=document.querySelector('#subscription-price');
    if(price&&!document.querySelector('#subscription-activation-note')){
      const note=document.createElement('small');note.id='subscription-activation-note';note.className='activation-note';price.closest('label')?.appendChild(note);
    }
    return select;
  }

  function fillConditions(selected=''){
    const select=ensureConditionField();if(!select)return;
    if(!cm.conditions.length){select.innerHTML='<option value="">No disponible</option>';return;}
    const html=cm.conditions.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('');
    if(select.innerHTML!==html)select.innerHTML=html;
    const target=selected||normalCondition()?.id||cm.conditions[0]?.id||'';
    select.value=target;
    if(!select.value&&cm.conditions[0])select.value=cm.conditions[0].id;
  }

  function syncCommercialFields(overwritePrice=false){
    const planId=document.querySelector('#subscription-plan')?.value||'';
    const frequency=document.querySelector('#subscription-frequency')?.value||'';
    const c=condition(document.querySelector('#subscription-condition')?.value||'');
    const p=priceFor(planId,frequency);
    const priceInput=document.querySelector('#subscription-price');
    if(priceInput&&overwritePrice){
      if(c?.forces_zero_price)priceInput.value='0';
      else if(p)priceInput.value=Number(p.price).toFixed(2);
    }
    const conditionNote=document.querySelector('#subscription-condition-note');
    if(conditionNote)conditionNote.textContent=c?.enables_cross_promotion?'Incluye promoción cruzada TTD.':c?.forces_zero_price?'Esta condición establece precio contratado en $0.00.':'';
    const activation=document.querySelector('#subscription-activation-note');
    if(activation){
      if(!p)activation.textContent='';
      else if(p.activation_included)activation.textContent='Activación incluida en esta modalidad.';
      else if(Number(p.activation_fee)>0)activation.textContent=`Activación: ${money(p.activation_fee,p.currency)}.`;
      else activation.textContent='Sin cuota de activación.';
    }
  }

  async function populateSubscriptionDialog(){
    const dialog=document.querySelector('#subscription-dialog');if(!dialog?.open)return;
    if(!cm.conditions.length)await loadCommercial(true);
    const id=document.querySelector('#subscription-id')?.value||'';
    const sub=cm.subscriptions.find(x=>x.id===id);
    fillConditions(sub?.commercial_condition_id||normalCondition()?.id||'');
    syncCommercialFields(!sub);
  }

  function decorateSubscriptions(){
    const tbody=document.querySelector('#subscriptions-table');if(!tbody||!cm.conditions.length)return;
    tbody.querySelectorAll('[data-edit-sub]').forEach(btn=>{
      const sub=cm.subscriptions.find(x=>x.id===btn.dataset.editSub);if(!sub)return;
      const c=condition(sub.commercial_condition_id);if(!c)return;
      const cell=btn.closest('tr')?.children?.[1];if(!cell)return;
      const cls=`commercial-condition-pill ${c.code==='CROSS_PROMO'?'cross':c.code==='COURTESY'?'courtesy':c.code==='TRIAL'?'trial':''}`.trim();
      let pill=cell.querySelector('.commercial-condition-pill');
      if(!pill){pill=document.createElement('span');cell.appendChild(pill);}
      if(pill.className!==cls)pill.className=cls;
      if(pill.textContent!==c.name)pill.textContent=c.name;
    });
  }

  function decoratePlans(){
    const strip=document.querySelector('#plans-strip');if(!strip)return;
    strip.querySelectorAll('[data-edit-plan]').forEach(btn=>{
      const plan=cm.plans.find(x=>x.id===btn.dataset.editPlan);const card=btn.closest('.plan-mini');if(!plan||!card)return;
      if(plan.code==='TTD-001'&&plan.status==='inactive'){card.hidden=true;return;}
      card.hidden=false;
      const prices=cm.prices.filter(x=>x.plan_id===plan.id);if(!prices.length)return;
      const html=prices.map(p=>`<span><strong>${esc(freqLabel[p.billing_frequency]||p.billing_frequency)}</strong><em>${money(p.price,p.currency)}${p.activation_included?' · activación incluida':Number(p.activation_fee)>0?` · activación ${money(p.activation_fee,p.currency)}`:''}</em></span>`).join('');
      let box=card.querySelector('.pricing-lines');
      if(!box){box=document.createElement('div');box.className='pricing-lines';card.querySelector('footer')?.before(box);}
      if(box.innerHTML!==html)box.innerHTML=html;
    });
  }

  function renderConditionsLegend(){
    const summary=document.querySelector('#subscription-summary');if(!summary)return;
    let box=document.querySelector('#commercial-conditions-strip');
    if(!box){box=document.createElement('div');box.id='commercial-conditions-strip';box.className='commercial-conditions';summary.after(box);}
    const html=cm.conditions.map(c=>`<span class="commercial-chip"><strong>${esc(c.name)}</strong>${c.forces_zero_price?'<small>$0 por regla</small>':''}</span>`).join('');
    if(box.innerHTML!==html)box.innerHTML=html;
  }

  async function refresh(){
    if(!await loadCommercial(true))return false;
    ensureConditionField();renderConditionsLegend();decorateSubscriptions();decoratePlans();
    if(document.querySelector('#subscription-dialog')?.open)await populateSubscriptionDialog();
    return true;
  }

  function installObservers(){
    const tbody=document.querySelector('#subscriptions-table');
    if(tbody)new MutationObserver(()=>queueMicrotask(decorateSubscriptions)).observe(tbody,{childList:true});
    const plans=document.querySelector('#plans-strip');
    if(plans)new MutationObserver(()=>queueMicrotask(decoratePlans)).observe(plans,{childList:true});
    const dialog=document.querySelector('#subscription-dialog');
    if(dialog)new MutationObserver(()=>{if(dialog.open)setTimeout(populateSubscriptionDialog,0)}).observe(dialog,{attributes:true,attributeFilter:['open']});
  }

  function installSaveOverride(){
    const form=document.querySelector('#subscription-form');if(!form||form.dataset.commercialV3)return;form.dataset.commercialV3='1';
    form.addEventListener('submit',async e=>{
      e.preventDefault();e.stopImmediatePropagation();
      if(!cm.conditions.length&&!await loadCommercial(true)){toast('No se pudo cargar el catálogo comercial.',true);return;}
      const id=document.querySelector('#subscription-id').value;
      const status=document.querySelector('#subscription-status').value;
      const existing=cm.subscriptions.find(x=>x.id===id);
      const conditionId=document.querySelector('#subscription-condition')?.value||normalCondition()?.id||null;
      const c=condition(conditionId);
      const rawPrice=document.querySelector('#subscription-price').value;
      const payload={
        company_id:document.querySelector('#subscription-company').value,
        product_id:document.querySelector('#subscription-product').value,
        plan_id:document.querySelector('#subscription-plan').value||null,
        commercial_condition_id:conditionId,
        status,
        billing_frequency:document.querySelector('#subscription-frequency').value,
        contracted_price:c?.forces_zero_price?0:(rawPrice===''?null:Number(rawPrice)),
        seat_limit:document.querySelector('#subscription-seats').value===''?null:Number(document.querySelector('#subscription-seats').value),
        start_date:document.querySelector('#subscription-start').value,
        renewal_date:document.querySelector('#subscription-renewal').value||null,
        end_date:document.querySelector('#subscription-end').value||null,
        cancelled_at:status==='cancelled'?(existing?.cancelled_at||new Date().toISOString()):null,
        external_tenant_id:document.querySelector('#subscription-external').value.trim()||null,
        access_url:document.querySelector('#subscription-url').value.trim()||null,
        notes:document.querySelector('#subscription-notes').value.trim()||null,
        updated_by:state.user.id
      };
      const r=id
        ?await state.db.from('alva_subscriptions').update(payload).eq('id',id)
        :await state.db.from('alva_subscriptions').insert({...payload,created_by:state.user.id});
      if(r.error){console.error(r.error);toast('No se pudo guardar la suscripción.',true);return;}
      document.querySelector('#subscription-dialog').close();toast('Suscripción guardada');
      await refresh();
      if(typeof openView==='function')await openView('subscriptions',false);
    },true);
  }

  async function boot(){
    ensureAssets();
    if(!await waitForReady())return;
    ensureConditionField();installObservers();installSaveOverride();
    await refresh();
    document.querySelector('#new-subscription')?.addEventListener('click',()=>setTimeout(populateSubscriptionDialog,0));
  }

  boot().catch(err=>console.error('ALVA commercial-v3 boot:',err));
})();