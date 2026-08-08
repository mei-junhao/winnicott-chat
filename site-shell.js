(function(){
  'use strict';
  var path=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  var type=path==='index.html'?'home':path==='roundtable.html'?'roundtable':path==='ai-supervisor.html'?'supervisor':(['winnicott-chat.html','master-chat.html','consultant-a.html'].indexOf(path)!==-1?'chat':'content');
  document.body.classList.add('preview-ui','preview-'+type);

  function node(tag,cls,html){var el=document.createElement(tag);if(cls)el.className=cls;if(html!==undefined)el.innerHTML=html;return el}
  function activeFor(href){if(href==='index.html')return path==='index.html';if(href==='winnicott-chat.html')return path==='master-chat.html'||path==='winnicott-chat.html'||path==='consultant-a.html';return path===href}
  function makeNav(){
    var nav=node('nav','preview-global-nav');nav.setAttribute('aria-label','全站导航');
    var brand=node('a','preview-brand','<span class="preview-brand-mark">心</span><span class="preview-brand-text"><strong>心灵对话</strong><small>心理学大师智能对话</small></span>');brand.href='index.html';
    var mobile=node('button','preview-mobile-nav','导航');mobile.type='button';mobile.setAttribute('aria-label','展开导航');
    var links=node('div','preview-nav-links');
    [['index.html','选择大师'],['winnicott-chat.html','温尼科特'],['roundtable.html','圆桌'],['ai-supervisor.html','AI 督导'],['xinjing-landing.html','心镜']].forEach(function(item){var a=node('a',activeFor(item[0])?'active':'',item[1]);a.href=item[0];links.appendChild(a)});
    var about=node('a',activeFor('about-winnicott-chat.html')?'active':'','关于');about.href='about-winnicott-chat.html';links.appendChild(about);
    mobile.addEventListener('click',function(){links.classList.toggle('open')});
    nav.appendChild(brand);nav.appendChild(mobile);nav.appendChild(links);nav.appendChild(node('span','preview-badge','v5.4'));
    document.body.insertBefore(nav,document.body.firstChild);
  }
  function toast(text){var t=document.querySelector('.preview-toast');if(!t){t=node('div','preview-toast');document.body.appendChild(t)}t.textContent=text;t.classList.add('show');clearTimeout(t._timer);t._timer=setTimeout(function(){t.classList.remove('show')},1800)}
  window.PreviewUI={toast:toast};
  makeNav();

  function home(){
    var app=document.querySelector('.app');if(!app)return;
    var title=app.querySelector('h1'),sub=app.querySelector('.sub');
    if(title)title.textContent='今天，你想从哪里开始？';if(sub)sub.textContent='按人物或议题选择入口，点击后直接进入对话。所有原有对话能力继续保留。';
    var firstNotice=app.querySelector('[data-i18n-html="idx_local_notice"]');
    var xinjing=app.querySelector('.card[onclick*="xinjing-landing"]');
    var cards=Array.prototype.slice.call(app.querySelectorAll('.card[data-master]'));
    var hero=node('section','preview-home-hero');
    hero.innerHTML='<div class="preview-intent"><h2>先从困扰出发，也可以直接找熟悉的大师</h2><p>搜索人物、流派或议题。原站三档对话风格没有删除，进入页面后仍可在设置中调整。</p><label class="preview-search"><span>⌕</span><input id="previewMasterSearch" type="search" placeholder="例如：关系、梦、育儿、温尼科特、CBT"></label><div class="preview-topic-row"><button class="preview-topic active" data-topic="">全部</button><button class="preview-topic" data-topic="关系|依恋|情感">关系与依恋</button><button class="preview-topic" data-topic="自体|自卑|价值|成长">自我理解</button><button class="preview-topic" data-topic="梦|无意识|原型">梦与无意识</button><button class="preview-topic" data-topic="认知|思维|CBT">情绪与思维</button><button class="preview-topic" data-topic="客体|母亲|育儿">早期关系</button></div></div><aside class="preview-guide"><div class="kicker">推荐入口</div><blockquote>如果你还不确定选谁，先从温尼科特开始。你不必先理解一种理论，直接说此刻最想谈的事。</blockquote><small>选择人物后直接进入默认对话；需要更简洁、更深入或更偏理论时，再在对话设置中调整。</small></aside>';
    if(sub&&sub.nextSibling)app.insertBefore(hero,sub.nextSibling);else app.insertBefore(hero,app.firstChild);
    var head=node('div','preview-section-head','<div><h2>大师对话</h2><p>十二位大师入口，温尼科特页内仍可切换拉康。</p></div><p>点击后直接进入，不增加新的前置弹窗</p>');
    var grid=node('section','preview-master-grid');cards.forEach(function(c){grid.appendChild(c)});
    if(firstNotice)app.insertBefore(head,firstNotice);else app.appendChild(head);app.insertBefore(grid,head.nextSibling);
    var services=[];Array.prototype.slice.call(app.children).forEach(function(el){if(el.getAttribute&&el.getAttribute('onclick')&&(/ai-supervisor|roundtable|consultant-a/.test(el.getAttribute('onclick'))))services.push(el)});
    if(services.length){var sh=node('div','preview-section-head','<div><h2>专业工作区</h2><p>原有圆桌、AI 督导与定制服务完整保留。</p></div>');var sg=node('section','preview-service-grid');services.forEach(function(el){sg.appendChild(el)});var anchor=app.querySelector('.msg-section');app.insertBefore(sh,anchor||null);app.insertBefore(sg,anchor||null)}
    if(xinjing&&firstNotice){firstNotice.parentNode.insertBefore(xinjing,firstNotice.nextSibling)}
    function filter(text){var terms=(text||'').toLowerCase().split('|').map(function(x){return x.trim()}).filter(Boolean);cards.forEach(function(c){var hay=c.textContent.toLowerCase();var matched=!terms.length||terms.some(function(term){return hay.indexOf(term)!==-1});c.classList.toggle('preview-hidden',!matched)})}
    var search=document.getElementById('previewMasterSearch');if(search)search.addEventListener('input',function(){filter(search.value)});
    document.querySelectorAll('.preview-topic').forEach(function(btn){btn.addEventListener('click',function(){document.querySelectorAll('.preview-topic').forEach(function(b){b.classList.remove('active')});btn.classList.add('active');filter(btn.dataset.topic||'')})});
    app.querySelectorAll('div.card[onclick]').forEach(function(c){c.setAttribute('role','link');c.tabIndex=0;c.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();c.click()}})});
    document.title='心灵对话 · 选择大师';
  }

  function call(name){var fn=window[name];if(typeof fn==='function')return fn.apply(window,Array.prototype.slice.call(arguments,1));toast('此入口保留，但当前页面尚未准备好')}
  function chat(){
    var app=document.querySelector('.app');if(!app)return;
    var header=app.querySelector('.header');var panel=document.getElementById('settingsPanel');
    if(header){var bar=node('div','preview-commandbar');bar.innerHTML='<button type="button" data-action="back">返回首页</button><button type="button" data-action="home">首页</button><button type="button" data-action="history">历史</button><button type="button" data-action="save">保存</button><button type="button" data-action="share">分享 / 转发</button><button type="button" data-action="settings">设置</button><span class="preview-spacer"></span><span class="preview-context">人物标题会在开始对话后自动隐藏</span>';header.insertAdjacentElement('afterend',bar);
      bar.addEventListener('click',function(e){var a=e.target.dataset.action;if(!a)return;if(a==='back'||a==='home'){window.location.href='index.html'}else if(a==='history'){call('showHistory')}else if(a==='save'){if(typeof window.saveToHistory==='function')call('saveToHistory');else call('saveChat')}else if(a==='share'){call('toggleForwardMode')}else if(a==='settings'){call('toggleSettings')}});
    }
    if(panel){panel.querySelectorAll('hr').forEach(function(hr){hr.style.borderColor='var(--preview-line)'});}
    function syncHeader(){
      var el=app.querySelector('.header');if(!el)return;
      var msgs=document.getElementById('messages');
      var hasContent=msgs&&msgs.querySelector('.msg,.chapter-divider');
      el.classList.toggle('is-min',!!hasContent);
    }
    var msgs=document.getElementById('messages');
    if(msgs&&window.MutationObserver){var ob=new MutationObserver(syncHeader);ob.observe(msgs,{childList:true,subtree:true});syncHeader()}
    else syncHeader();
    if(typeof setupChatComposerHeight==='function')setupChatComposerHeight();
    document.title=document.title||'大师对话';
  }

  function setupChatComposerHeight(){
    var composer=document.querySelector('.bottom-bar');if(!composer||!document.body.classList.contains('preview-chat'))return;
    function apply(){
      var rect=composer.getBoundingClientRect();
      var h=Math.max(80,Math.min(260,Math.round(window.innerHeight-rect.top)));
      document.documentElement.style.setProperty('--chat-composer-h',h+'px');
    }
    apply();
    if(window.ResizeObserver){var ro=new ResizeObserver(apply);ro.observe(composer)}
    window.addEventListener('resize',apply);
    window.addEventListener('load',apply);
    if(window.visualViewport){window.visualViewport.addEventListener('resize',apply)}
  }
  window.setupChatComposerHeight=setupChatComposerHeight;

  function roundtable(){
    var app=document.querySelector('.app');if(!app)return;
    var toolbar=app.querySelector('.toolbar');var avatar=app.querySelector('.avatar-bar');
    if(toolbar)Array.prototype.slice.call(toolbar.children).forEach(function(el){el.classList.add('preview-source-control')});
    var control=node('div','preview-round-control');control.innerHTML='<button type="button" data-action="participants">管理参与者</button><label for="previewResponseTarget">本轮谁回应</label><select id="previewResponseTarget"><option value="all">全体参与者</option></select><span class="preview-spacer"></span><button type="button" data-action="save">保存</button><button type="button" data-action="history">历史</button><details class="preview-advanced"><summary>更多</summary><div class="preview-advanced-body"><button type="button" data-action="presets">预设组合</button><button type="button" data-action="new">新对话</button><label><input id="previewSerial" type="checkbox" checked> 串行</label><button type="button" data-action="fontDown">A−</button><button type="button" data-action="fontUp">A+</button></div></details>';
    if(toolbar)toolbar.insertAdjacentElement('beforebegin',control);else app.querySelector('.header').insertAdjacentElement('afterend',control);
    var help=node('div','preview-round-help','只需要理解两件事：谁在场、这一轮谁回应。原有 @ 指定、预设、串行、多轮、历史、导图和自定义 API 均保留。');control.insertAdjacentElement('afterend',help);
    function names(){var items=Array.prototype.slice.call(document.querySelectorAll('.avatar-item .aname'));return items.map(function(x){return x.textContent.trim()}).filter(Boolean)}
    function sync(){var select=document.getElementById('previewResponseTarget');var cur=select.value;select.innerHTML='<option value="all">全体参与者</option>';names().forEach(function(n){var o=document.createElement('option');o.value=n;o.textContent=n;select.appendChild(o)});if(Array.prototype.some.call(select.options,function(o){return o.value===cur}))select.value=cur}
    setTimeout(sync,300);if(avatar)new MutationObserver(sync).observe(avatar,{childList:true,subtree:true});
    control.addEventListener('click',function(e){var a=e.target.dataset.action;if(!a)return;var map={participants:'openInvite',save:'saveHistory',history:'showHistory',presets:'openPresets',new:'clearChat',fontDown:'zoomFont',fontUp:'zoomFont'};if(a==='fontDown')call('zoomFont',-1);else if(a==='fontUp')call('zoomFont',1);else call(map[a])});
    document.getElementById('previewSerial').addEventListener('change',function(){var src=document.getElementById('roundsCheck');if(src){src.checked=this.checked;call('updateRounds')}});
    document.getElementById('previewResponseTarget').addEventListener('change',function(){var input=document.getElementById('inputEl');if(!input)return;var val=this.value;if(val==='all'){if(window.respondMode==='mention')call('setRespondMode');input.placeholder='向全体参与者提问……'}else{if(window.respondMode!=='mention')call('setRespondMode');input.value='@'+val+' '+input.value.replace(/^@[^\s]+\s*/,'');input.placeholder='追问'+val+'……';input.focus()}});
    document.title='多大师圆桌';
  }

  function supervisor(){
    var main=document.getElementById('main');var gate=document.getElementById('gate');if(gate)gate.style.display='none';if(main)main.style.display='block';
    var header=main&&main.querySelector('.header');if(header){var steps=node('div','preview-supervisor-steps','<div class="preview-step active"><span>1</span>材料</div><div class="preview-step-line"></div><div class="preview-step"><span>2</span>隐私确认</div><div class="preview-step-line"></div><div class="preview-step"><span>3</span>分析与追问</div>');header.insertAdjacentElement('afterend',steps);var privacy=node('div','preview-privacy-card','<div><strong>先脱敏，再分析。</strong><br>请移除姓名、联系方式、单位、精确地址、病历号等可识别信息。原有本地识别检查仍会在提交时运行。</div><label><input type="checkbox" id="previewPrivacyConfirm"> 我已脱敏并获得适当授权</label>');steps.insertAdjacentElement('afterend',privacy)}
    var analyze=document.getElementById('analyzeBtn');if(analyze&&typeof window.generateImpression==='function'){var original=window.generateImpression;window.generateImpression=function(){var ok=document.getElementById('previewPrivacyConfirm');if(ok&&!ok.checked){toast('请先确认材料已脱敏并获得适当授权');ok.focus();return}document.querySelectorAll('.preview-step').forEach(function(s,i){s.classList.toggle('active',i>=1)});return original.apply(this,arguments)}}
    var row=main&&main.querySelector('.btn-row');if(row){var danger=Array.prototype.slice.call(row.querySelectorAll('.danger'));if(danger.length){var zone=node('details','preview-danger-zone');zone.innerHTML='<summary>数据管理与危险操作</summary><div class="preview-danger-zone-body"></div>';var body=zone.querySelector('.preview-danger-zone-body');danger.forEach(function(b){body.appendChild(b)});row.insertAdjacentElement('afterend',zone)}}
    var upload=document.getElementById('uploadZone');if(upload)upload.classList.add('open');
    document.title='AI 临床督导';
  }
  function content(){document.body.classList.add('preview-content');var note=node('div','preview-page-note','完整保留原内容页面；统一导航用于返回对话、圆桌、督导与项目介绍。');var nav=document.querySelector('.preview-global-nav');nav.insertAdjacentElement('afterend',note)}

  function boot(){if(type==='home')home();else if(type==='chat')chat();else if(type==='roundtable')roundtable();else if(type==='supervisor')supervisor();else content()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
