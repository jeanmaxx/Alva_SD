/* ALVA Admin — modelo comercial v2: plan funcional + condición comercial */
(()=>{
  const cm={conditions:[],prices:[],subscriptions:[],plans:[]};
  const freqLabel={monthly:'Mensual',annual:'Anual',quarterly:'Trimestral',semiannual:'Semestral',one_time:'Pago único',custom:'Personalizada'};
  const money=(v,c='MXN')=>new Intl.NumberFormat('es-MX',{style:'currency',currency:c||'MXN'}).format(Number(v||0));
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

  async function loadCommercial(){
    if(typeof state==='undefined'||!state.db||!state.user)return false;
    const [c,p,s,pl]=await Promise.all([
      state.db.from('alva_commercial_conditions').select('*').eq('status','active').order('sort_order'),
      state.db.from('alva_plan_prices').select('*').eq('status','active').order('billing_frequency'),
      state.db.from('alva_subscriptions').select('id,commercial_condition_id,plan_id,billing_frequency,contracted_price,company_id,product_id,status').order('updated_at',{ascending:false}),
      state.db.from('alva_product_plans').select('id,product_id,code,name,status,billing_frequency,price,currency').order('sort_order')
    ]);
    cm.conditions=c.data||[];cm.prices=p.data||[];cm.subscriptions=s.data||[];cm.plans=pl.data||[];
    return true;
  }

  const condition=id=>cm.conditions.find(x=>x.id===id);
  const normalCondition=()=>cm.conditions.find(x=>x.code==='NORMAL');
  const priceFor=(planId,frequency)=>cm.prices.find(x=>x.plan_id===planId&&x.billing_frequency===frequency)||cm.prices.find(x=>x.plan_id===planId&&x.is_default);

  function ensureAssets(){
    if(!document.querySelector('link[data-commercial-v2]')){
      const l=document.createElement('link');l.rel='stylesheet';l.href='./commercial-v2.css?v=20260916-1';l.dataset.commercialV2='1';document.head.appendChild(l);
    }
  }

  function ensureConditionField(){
    const plan=document.querySelector('#subscription-plan');
    if(!plan||document.querySelector('#subscription-condition'))return;
    const label=document.createElement('label');
    label.innerHTML='Condición comercial<select id="subscription-condition" required></select><small id="subscription-condition-note" class="activation-note"></small>';
    plan.closest('label')?.after(label);
    const price=document.querySelector('#subscription-price');
    if(price&&!document.querySelector('#subscription-activation-note')){
      const note=document.createElement('small');note.id='subscription-activation-note';note.className='activation-note';price.closest('label')?.appendChild(note);
    }
    document.querySelector('#subscription-condition')?.addEventListener('change',()=>syncCommercialFields(true));
    document.querySelector('#subscription-frequency')?.addEventListener('change',()=>syncCommercialFields(true));
    document.querySelector('#subscription-plan')?.addEventListener('change',()=>setTimeout(()=>syncCommercialFields(true),0));
  }

  function fillConditions(selected=''){
    const select=document.querySelector('#subscription-condition');if(!select)return;
    select.innerHTML=cm.conditions.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('');
    select.value=selected||normalCondition()?.id||cm.conditions[0]?.id||'';
  }

  function syncCommercialFields(overwritePrice=false){
    const planId=document.querySelector('#subscription-plan')?.value||'';
    const frequency=document.querySelector('#subscription-frequency')?.value||'';
    const conditionId=document.querySelector('#subscription-condition')?.value||'';
    const c=condition(conditionId),p=priceFor(planId,frequency);
    const priceInput=document.querySelector('#subscription-price');
    if(priceInput&&overwritePrice){
      if(c?.forces_zero_price)priceInput.value='0';
      else if(p)priceInput.value=Number(p.price).toFixed(2);
    }
    const conditionNote=document.querySelector('#subscription-condition-note');
    if(conditionNote)conditionNote.textContent=c?.forces_zero_price?'Esta condición establece precio contratado en $0.00.':c?.enables_cross_promotion?'Incluye promoción cruzada TTD.':'';
    const activation=document.querySelector('#subscription-activation-note');
    if(activation){
      if(!p)activation.textContent='';
      else if(p.activation_included)activation.textContent='Activación incluida en esta modalidad.';
      else if(Number(p.activation_fee)>0)activation.textContent=`Activación: ${money(p.activation_fee,p.currency)}.`;
      else activation.textContent='Sin cuota de activación.';
    }
  }

  function populateSubscriptionDialog(){
    const dialog=document.querySelector('#subscription-dialog');if(!dialog?.open)return;
    const id=document.querySelector('#subscription-id')?.value||'';
    const sub=cm.subscriptions.find(x=>x.id===id);
    fillConditions(sub?.commercial_condition_id||normalCondition()?.id||'');
    syncCommercialFields(!sub);
  }

  function decorateSubscriptions(){
    const tbody=document.querySelector('#subscriptions-table');if(!tbody)return;
    tbody.querySelectorAll('[data-edit-sub]').forEach(btn=>{
      const sub=cm.subscriptions.find(x=>x.id===btn.dataset.editSub);if(!sub)return;
      const cell=btn.closest('tr')?.children?.[1];if(!cell)return;
      cell.querySelector('.commercial-condition-pill')?.remove();
      const c=condition(sub.commercial_condition_id);if(!c)return;
      const pill=document.createElement('span');pill.className=`commercial-condition-pill ${c.code==='CROSS_PROMO'?'cross':c.code==='COURTESY'?'courtesy':c.code==='TRIAL'?'trial':''}`;pill.textContent=c.name;cell.appendChild(pill);
    });
  }

  function decoratePlans(){
    const strip=document.querySelector('#plans-strip');if(!strip)return;
    strip.querySelectorAll('[data-edit-plan]').forEach(btn=>{
      const plan=cm.plans.find(x=>x.id===btn.dataset.editPlan);const card=btn.closest('.plan-mini');if(!plan||!card)return;
      if(plan.code==='TTD-001'&&plan.status==='inactive'){card.hidden=true;return;}
      card.querySelector('.pricing-lines')?.remove();
      const prices=cm.prices.filter(x=>x.plan_id===plan.id);if(!prices.length)return;
      const box=document.createElement('div');box.className='pricing-lines';
      box.innerHTML=prices.map(p=>`<span><strong>${esc(freqLabel[p.billing_frequency]||p.billing_frequency)}</strong><em>${money(p.price,p.currency)}${p.activation_included?' · activación incluida':Number(p.activation_fee)>0?` · activación ${money(p.activation_fee,p.currency)}`:''}</em></span>`).join('');
      card.querySelector('footer')?.before(box);
    });
  }

  function renderConditionsLegend(){
    const summary=document.querySelector('#subscription-summary');if(!summary)return;
    let box=document.querySelector('#commercial-conditions-strip');if(!box){box=document.createElement('div');box.id='commercial-conditions-strip';box.className='commercial-conditions';summary.after(box);}
    box.innerHTML=cm.conditions.map(c=>`<span class="commercial-chip"><strong>${esc(c.name)}</strong>${c.forces_zero_price?'<small>$0 por regla</small>':''}</span>`).join('');
  }

  async function refreshDecorations(){
    await loadCommercial();ensureConditionField();renderConditionsLegend();decorateSubscriptions();decoratePlans();
  }

  function installObservers(){
    const subTable=document.querySelector('#subscriptions-table');if(subTable)new MutationObserver(()=>decorateSubscriptions()).observe(subTable,{childList:true,subtree:true});
    const plans=document.querySelector('#plans-strip');if(plans)new MutationObserver(()=>decoratePlans()).observe(plans,{childList:true,subtree:true});
    const dialog=document.querySelector('#subscription-dialog');if(dialog)new MutationObserver(()=>{if(dialog.open)setTimeout(populateSubscriptionDialog,0)}).observe(dialog,{attributes:true,attributeFilter:['open']});
  }

  function installSaveOverride(){
    const form=document.querySelector('#subscription-form');if(!form||form.dataset.commercialV2)return;form.dataset.commercialV2='1';
    form.addEventListener('submit',async e=>{
      e.preventDefault();e.stopImmediatePropagation();
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
      let r;
      if(id)r=await state.db.from('alva_subscriptions').update(payload).eq('id',id);
      else r=await state.db.from('alva_subscriptions').insert({...payload,created_by:state.user.id});
      if(r.error){toast('No se pudo guardar la suscripción.',true);return;}
      document.querySelector('#subscription-dialog').close();toast('Suscripción guardada');
      await refreshDecorations();
      if(typeof openView==='function')await openView('subscriptions',false);
      setTimeout(()=>{decorateSubscriptions();decoratePlans();},80);
    },true);
  }

  async function boot(){
    ensureAssets();
    for(let i=0;i<30&&!document.querySelector('#subscription-form');i++)await new Promise(r=>setTimeout(r,100));
    if(!document.querySelector('#subscription-form'))return;
    await refreshDecorations();installObservers();installSaveOverride();
    document.querySelector('#new-subscription')?.addEventListener('click',()=>setTimeout(populateSubscriptionDialog,0));
  }
  boot();
})();
