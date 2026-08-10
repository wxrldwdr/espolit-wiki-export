(() => {
  const Core = window.SurwaveEditorCoreV2;
  const refs = window.SurwaveEditorBlockRefs;
  const ensure = window.SurwaveEnsureGradientStates;
  if (!Core || !refs || !ensure) return;

  const STATE_LABELS = {
    normal:'Обычный вид',
    hover:'Наведение',
    active:'Нажатие',
    copied:'Скопировано · 5 секунд'
  };
  const MODE_OPTIONS = [
    ['center','От центра'],['left','Слева'],['right','Справа'],['top','Сверху'],['bottom','Снизу']
  ];
  const ANIM_OPTIONS = [
    ['none','Без анимации'],
    ['pulse','Пульсация'],
    ['flow','Переливание цветов'],
    ['orbit','Вращение по контуру'],
    ['shimmer','Бегущий блик'],
    ['wave','Волна'],
    ['glow','Дыхание / свечение']
  ];

  function markDirty() {
    const field = document.getElementById('pagePath');
    if (field) field.dispatchEvent(new Event('input',{bubbles:true}));
  }
  function label(text,control) {
    const l=document.createElement('label');l.className='sw-adv-field';
    const s=document.createElement('span');s.textContent=text;l.append(s,control);return l;
  }
  function select(options,value,onChange) {
    const s=document.createElement('select');s.className='field';
    options.forEach(([v,t])=>{const o=document.createElement('option');o.value=v;o.textContent=t;s.appendChild(o)});
    s.value=value;s.onchange=()=>{onChange(s.value);markDirty()};return s;
  }
  function number(value,min,max,step,onChange,suffix='') {
    const wrap=document.createElement('div');wrap.className='sw-adv-number';
    const input=document.createElement('input');input.type='number';input.className='field';input.min=min;input.max=max;input.step=step;input.value=value;
    input.oninput=()=>{const v=Math.max(+min,Math.min(+max,+input.value||0));onChange(v);markDirty()};wrap.appendChild(input);
    if(suffix){const x=document.createElement('span');x.textContent=suffix;wrap.appendChild(x)}return wrap;
  }
  function checkbox(text,checked,onChange) {
    const l=document.createElement('label');l.className='sw-adv-check';
    const i=document.createElement('input');i.type='checkbox';i.checked=!!checked;i.onchange=()=>{onChange(i.checked);markDirty()};
    const s=document.createElement('span');s.textContent=text;l.append(i,s);return l;
  }
  function color(value,onChange) {
    const wrap=document.createElement('div');wrap.className='sw-adv-color';
    const picker=document.createElement('input');picker.type='color';picker.value=/^#[0-9a-f]{6}$/i.test(value||'')?value:'#00ff78';
    const text=document.createElement('input');text.className='field mono';text.value=value||'';text.placeholder='#00ff78';
    picker.oninput=()=>{text.value=picker.value;onChange(picker.value);markDirty()};
    text.onchange=()=>{const v=text.value.trim();if(/^#[0-9a-f]{6}$/i.test(v))picker.value=v;onChange(v);markDirty()};
    wrap.append(picker,text);return wrap;
  }

  function stateEditor(block,layer,name) {
    const state=block.gradientStates[layer][name];
    const section=document.createElement('section');section.className='sw-adv-state';
    const head=document.createElement('div');head.className='sw-adv-state-head';head.textContent=STATE_LABELS[name];section.appendChild(head);

    const grid=document.createElement('div');grid.className='sw-adv-grid';
    grid.append(
      label('Режим градиента',select(MODE_OPTIONS,state.mode,v=>state.mode=v)),
      label('Анимация',select(ANIM_OPTIONS,state.animation,v=>state.animation=v)),
      label('Скорость',number(state.speed,0.2,60,0.1,v=>state.speed=v,'сек.')),
      label('Цвет 1',color(state.color1,v=>state.color1=v)),
      label('Видимость цвета 1',number(state.alpha1,0,100,1,v=>state.alpha1=v,'%'))
    );

    const second=checkbox('Использовать второй цвет',state.useSecond,v=>{
      state.useSecond=v;
      color2Wrap.classList.toggle('is-disabled',!v);
    });
    const color2Wrap=document.createElement('div');color2Wrap.className='sw-adv-second'+(state.useSecond?'':' is-disabled');
    color2Wrap.append(
      label('Цвет 2',color(state.color2,v=>state.color2=v)),
      label('Видимость цвета 2 / конца',number(state.alpha2,0,100,1,v=>state.alpha2=v,'%'))
    );
    section.append(grid,second,color2Wrap);

    const note=document.createElement('div');note.className='sw-adv-note';
    note.textContent= name==='copied'
      ? 'Это состояние работает все 5 секунд, пока отображается «Скопировано». Анимация повторяется до окончания таймера.'
      : name==='active'
        ? 'Короткое состояние непосредственно во время нажатия кнопки.'
        : '0% видимости делает соответствующий край/цвет полностью прозрачным.';
    section.appendChild(note);
    return section;
  }

  function layerEditor(block,layer,includeCopied) {
    const d=document.createElement('details');d.className='sw-adv-layer';d.open=layer==='border';
    const summary=document.createElement('summary');summary.textContent=layer==='border'?'Градиент рамки':'Градиент текста';d.appendChild(summary);
    const body=document.createElement('div');body.className='sw-adv-layer-body';
    const enabledKey=layer==='border'?'borderGradient':'textGradient';
    body.appendChild(checkbox('Включить',block[enabledKey],v=>block[enabledKey]=v));
    const states=document.createElement('div');states.className='sw-adv-states';
    ['normal','hover','active',...(includeCopied?['copied']:[])].forEach(name=>states.appendChild(stateEditor(block,layer,name)));
    body.appendChild(states);d.appendChild(body);return d;
  }

  function inject(card,block) {
    if (!card || card.querySelector(':scope > .block-body > .sw-advanced-gradient-editor')) return;
    if (!['servercards','linkgroup'].includes(block.type)) return;
    ensure(block);
    const body=card.querySelector(':scope > .block-body');if(!body)return;
    const box=document.createElement('div');box.className='sw-advanced-gradient-editor';
    const title=document.createElement('div');title.className='sw-advanced-title';
    title.textContent=block.type==='servercards'?'Состояния IP-карточек':'Состояния блока ссылок';
    const help=document.createElement('div');help.className='sw-adv-help';
    help.textContent='До двух цветов. Для каждого состояния отдельно задаются направление, прозрачность цветов, тип анимации и скорость. Цвет 2 можно выключить — тогда получится одноцветный градиент/затухание.';
    box.append(title,help,layerEditor(block,'border',block.type==='servercards'),layerEditor(block,'text',block.type==='servercards'));
    body.prepend(box);
  }

  function scan() {
    document.querySelectorAll('.block-card[data-editor-path]').forEach(card=>{
      const block=refs.get(card.dataset.editorPath);if(block)inject(card,block);
    });
  }
  const observer=new MutationObserver(()=>queueMicrotask(scan));observer.observe(document.body,{childList:true,subtree:true});
  [0,100,250,500,1000].forEach(ms=>setTimeout(scan,ms));
})();