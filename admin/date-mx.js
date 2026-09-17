(() => {
  document.documentElement.lang='es-MX';
  const pad=n=>String(n).padStart(2,'0');
  const fmtDate=iso=>{const m=String(iso||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${m[3]}/${m[2]}/${m[1]}`:''};
  const fmtDateTime=iso=>{const m=String(iso||'').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);return m?`${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}`:''};
  const parseDate=text=>{const m=String(text||'').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);if(!m)return'';const d=Number(m[1]),mo=Number(m[2]),y=Number(m[3]),x=new Date(y,mo-1,d);return x.getFullYear()===y&&x.getMonth()===mo-1&&x.getDate()===d?`${y}-${pad(mo)}-${pad(d)}`:''};
  const parseDateTime=text=>{const m=String(text||'').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);if(!m)return'';const d=Number(m[1]),mo=Number(m[2]),y=Number(m[3]),h=Number(m[4]||0),mi=Number(m[5]||0),x=new Date(y,mo-1,d,h,mi);return x.getFullYear()===y&&x.getMonth()===mo-1&&x.getDate()===d&&h<24&&mi<60?`${y}-${pad(mo)}-${pad(d)}T${pad(h)}:${pad(mi)}`:''};
  const shells=new Set();

  function enhance(input){
    if(input.dataset.mxDateBound)return;
    const type=input.type;
    if(type!=='date'&&type!=='datetime-local')return;
    input.dataset.mxDateBound='1';
    const shell=document.createElement('span');
    shell.className='mx-date-shell';
    const display=document.createElement('input');
    display.type='text';display.autocomplete='off';display.inputMode='numeric';display.className='mx-date-display';
    display.placeholder=type==='date'?'dd/mm/aaaa':'dd/mm/aaaa hh:mm';
    display.setAttribute('aria-label',type==='date'?'Fecha en formato día/mes/año':'Fecha y hora en formato día/mes/año');
    const button=document.createElement('button');
    button.type='button';button.className='mx-date-button';button.textContent='📅';button.title='Elegir fecha';button.setAttribute('aria-label','Elegir fecha');
    input.parentNode.insertBefore(shell,input);shell.append(display,button,input);
    input.classList.add('mx-native-date');input.tabIndex=-1;

    const sync=()=>{const val=type==='date'?fmtDate(input.value):fmtDateTime(input.value);if(document.activeElement!==display&&display.value!==val)display.value=val;shell.dataset.lastValue=input.value||''};
    const commit=()=>{const raw=display.value.trim();if(!raw){input.value='';input.dispatchEvent(new Event('change',{bubbles:true}));shell.classList.remove('is-invalid');sync();return}const parsed=type==='date'?parseDate(raw):parseDateTime(raw);if(!parsed){shell.classList.add('is-invalid');sync();return}shell.classList.remove('is-invalid');input.value=parsed;input.dispatchEvent(new Event('change',{bubbles:true}));sync()};

    input.addEventListener('change',sync);input.addEventListener('input',sync);
    display.addEventListener('change',commit);display.addEventListener('blur',commit);display.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();commit();display.blur()}});
    button.addEventListener('click',()=>{try{input.showPicker?.()}catch{input.focus();input.click()}});
    shells.add({shell,input,display,sync});sync();
  }

  function scan(root=document){root.querySelectorAll?.('input[type="date"],input[type="datetime-local"]').forEach(enhance)}
  const style=document.createElement('style');style.textContent=`
    .mx-date-shell{position:relative;display:grid;grid-template-columns:minmax(0,1fr) 44px;gap:7px;width:100%}
    .mx-date-display{width:100%!important;min-width:0!important}
    .mx-date-button{min-height:44px;border:1px solid var(--line,#d8dce3);border-radius:12px;background:var(--input,#fff);color:inherit;cursor:pointer;font-size:1rem}
    .mx-date-button:hover{border-color:var(--accent,#ffc107)}
    .mx-native-date{position:absolute!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important;left:0!important;bottom:0!important}
    .mx-date-shell.is-invalid .mx-date-display{border-color:#d92d20!important;box-shadow:0 0 0 3px rgba(217,45,32,.12)!important}
    html[data-theme="dark"] .mx-date-button{background:#22272e;border-color:#343a43}
  `;document.head.appendChild(style);

  scan();
  new MutationObserver(muts=>{for(const m of muts){m.addedNodes.forEach(n=>{if(n.nodeType===1){if(n.matches?.('input[type="date"],input[type="datetime-local"]'))enhance(n);scan(n)}});if(m.type==='attributes'&&m.target.tagName==='DIALOG'&&m.target.open)setTimeout(()=>shells.forEach(x=>x.sync()),60)}}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open']});
  setInterval(()=>shells.forEach(x=>{if((x.input.value||'')!==x.shell.dataset.lastValue)x.sync()}),500);
})();
