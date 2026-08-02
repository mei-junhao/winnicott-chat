/* ============================================================
 * mindmap.js — winnicott-chat 思维导图功能（公共模块）
 * 2026-08-02
 *
 * 用法（各页面在 </body> 前引入，并调用初始化）：
 *   <script src="mindmap.js"></script>
 *   <script>
 *     MindmapFeature.init({
 *       pageKey: 'master',                 // 历史导图按页面分开的键
 *       getConversation: function(){...},  // 返回 [{role,content},...]（统一格式）
 *       getActiveConfig: function(){...},  // 返回 {api,key,model}（跟随当前线路）
 *       minMessages: 10,                   // 触发门槛
 *       buttonEl: document.getElementById('mmBtn')  // 输入框旁的按钮
 *     });
 *   </script>
 *
 * 依赖（CDN，页面需引入）：
 *   d3 + markmap-view（渲染）；PNG 导出走 SVG 序列化 → canvas（无需 html2canvas）
 * ============================================================ */
(function () {
  'use strict';

  var cfg = null;
  var lastMd = '';
  var isGenerating = false;

  // ---------- 弹层 DOM（一次性构建） ----------
  var overlay, loadingEl, mindmapEl, histPanel, histList;

  function buildDOM() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:none;align-items:center;justify-content:center;padding:20px;';
    overlay.innerHTML =
      '<div style="background:#fff;border-radius:14px;max-width:820px;width:100%;height:78vh;display:flex;flex-direction:column;box-shadow:0 8px 40px rgba(0,0,0,.3);">' +
      '  <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid #e0d5c8;">' +
      '    <h3 style="margin:0;font-size:15px;color:#4a3f35;flex:1;">🧠 对话思维导图</h3>' +
      '    <button id="mmHistBtn" style="padding:5px 12px;border-radius:8px;border:1px solid #e0d5c8;background:#fff;color:#8b8178;font-size:12px;cursor:pointer;">📚 历史导图</button>' +
      '    <button id="mmPngBtn" style="padding:5px 12px;border-radius:8px;border:1px solid #e0d5c8;background:#fff;color:#8b8178;font-size:12px;cursor:pointer;">⬇ PNG</button>' +
      '    <button id="mmMdBtn" style="padding:5px 12px;border-radius:8px;border:1px solid #e0d5c8;background:#fff;color:#8b8178;font-size:12px;cursor:pointer;">⬇ MD</button>' +
      '    <button id="mmCloseBtn" style="padding:5px 12px;border-radius:8px;border:1px solid #8a6f5d;background:#fff;color:#8a6f5d;font-size:12px;cursor:pointer;">✕ 关闭</button>' +
      '  </div>' +
      '  <div style="flex:1;overflow:hidden;position:relative;background:#fafafa;">' +
      '    <div id="mmLoading" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#fff;">' +
      '      <div style="width:36px;height:36px;border:3px solid #eee;border-top-color:#8a6f5d;border-radius:50%;animation:mmspin 1s linear infinite;"></div>' +
      '      <p style="font-size:13px;color:#8b8178;">AI 正在分析对话并生成思维导图…（约 3-10 秒）</p>' +
      '    </div>' +
      '    <div id="mmMindmap" style="position:absolute;inset:0;overflow:hidden;"></div>' +
      '    <div id="mmHistPanel" style="position:absolute;right:0;top:0;bottom:0;width:240px;background:#fff;border-left:1px solid #e0d5c8;box-shadow:-4px 0 16px rgba(0,0,0,.08);display:flex;flex-direction:column;transform:translateX(100%);transition:transform .2s;">' +
      '      <div style="display:flex;align-items:center;padding:10px 12px;border-bottom:1px solid #e0d5c8;"><span style="flex:1;font-size:13px;color:#4a3f35;font-weight:600;">历史导图</span><button id="mmHistClose" style="padding:4px 10px;border-radius:8px;border:1px solid #e0d5c8;background:#fff;color:#8b8178;font-size:12px;cursor:pointer;">✕</button></div>' +
      '      <div id="mmHistList" style="flex:1;overflow-y:auto;padding:8px;"></div>' +
      '    </div>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(overlay);
    loadingEl = overlay.querySelector('#mmLoading');
    mindmapEl = overlay.querySelector('#mmMindmap');
    histPanel = overlay.querySelector('#mmHistPanel');
    histList = overlay.querySelector('#mmHistList');

    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    overlay.querySelector('#mmCloseBtn').addEventListener('click', close);
    overlay.querySelector('#mmPngBtn').addEventListener('click', exportPng);
    overlay.querySelector('#mmMdBtn').addEventListener('click', exportMd);
    overlay.querySelector('#mmHistBtn').addEventListener('click', function () { histPanel.style.transform = histPanel.style.transform === 'translateX(100%)' ? 'none' : 'translateX(100%)'; renderHist(); });
    overlay.querySelector('#mmHistClose').addEventListener('click', function () { histPanel.style.transform = 'translateX(100%)'; });

    // 加载动画 keyframes
    var st = document.createElement('style');
    st.textContent = '@keyframes mmspin{to{transform:rotate(360deg);}}';
    document.head.appendChild(st);
  }

  function close() {
    if (!overlay) return;
    overlay.style.display = 'none';

  }

  // ---------- AI 生成 ----------
  function buildPrompt(messages) {
    var lines = [];
    messages.forEach(function (m) {
      var who = m.role === 'user' ? '来访者' : '咨询师';
      var t = (m.content || '').replace(/\s+/g, ' ').slice(0, 300);
      lines.push(who + '：' + t);
    });
    return '请将下面的心理咨询对话总结为一幅 Markdown 格式的思维导图大纲。\n' +
      '要求：\n' +
      '1. 第一行是标题：# <简短标题>\n' +
      '2. 用 ## 作为一级主题（4-6 个），涵盖：核心议题、来访者表达的关键主题、咨询师（大师）观点、双方达成的理解、待探索方向\n' +
      '3. 用 - 与缩进表示二级、三级细节（每个一级主题下 2-3 层）\n' +
      '4. 语言与对话保持一致；每个节点尽量简短（10-20 字）\n' +
      '5. 只输出 Markdown 大纲本身，不要其他解释\n\n' +
      '对话内容（最近 ' + messages.length + ' 条）：\n' + lines.join('\n');
  }

  function generate() {
    if (!cfg) return;
    if (isGenerating) { toast('正在生成中，请稍候…'); return; }
    var messages = normalizeMessages(cfg.getConversation());
    if (messages.length < cfg.minMessages) {
      toast('对话至少需要 ' + cfg.minMessages + ' 条消息才能生成思维导图');
      return;
    }
    var slice = messages.slice(-50); // 成本控制：最近 50 条
    var ac = cfg.getActiveConfig();
    if (!ac || !ac.api) { toast('当前未配置可用 API 线路'); return; }
    // 安全：仅允许 https 端点（防自定义 API 钓鱼面把对话+key 发往任意域名）
    if (!/^https:\/\//i.test(ac.api)) { toast('仅支持 https 的 API 地址'); return; }

    isGenerating = true;
    if (cfg.buttonEl) cfg.buttonEl.disabled = true;
    buildDOM();
    overlay.style.display = 'flex';
    loadingEl.style.display = 'flex';
    mindmapEl.innerHTML = '';
    histPanel.style.transform = 'translateX(100%)';
    var ac2 = new AbortController();
    var tm = setTimeout(function () { ac2.abort(); }, 60000);

    var body = JSON.stringify({
      model: ac.model || 'deepseek-v4-pro',
      messages: [{ role: 'user', content: buildPrompt(slice) }],
      temperature: 0.3,
      max_tokens: 1200,
      stream: false
    });
    var headers = { 'Content-Type': 'application/json' };
    if (ac.key) headers['Authorization'] = 'Bearer ' + ac.key;

    fetch(ac.api, { method: 'POST', headers: headers, body: body, signal: ac2.signal })
      .then(function (r) {
        clearTimeout(tm);
        if (r.status === 429) { throw new Error('请求过于频繁，请稍后重试'); }
        if (!r.ok) { throw new Error('AI 返回 ' + r.status); }
        return r.json();
      })
      .then(function (data) {
        var content = '';
        if (data && data.choices && data.choices[0] && data.choices[0].message) {
          content = data.choices[0].message.content || '';
        } else if (data && data.content) {
          content = data.content;
        }
        if (!content) throw new Error('AI 未返回有效内容');
        content = content.trim();
        // 确保有 # 标题
        if (content.indexOf('#') !== 0) content = '# 对话思维导图\n' + content;
        lastMd = content;
        isGenerating = false;
        if (cfg.buttonEl) refreshButton();
        loadingEl.style.display = 'none';
        renderMap(content);
        saveHistory(content);
      })
      .catch(function (e) {
        clearTimeout(tm);
        isGenerating = false;
        if (cfg.buttonEl) refreshButton();
        loadingEl.style.display = 'none';
        var msg = e && e.name === 'AbortError' ? '生成超时（60 秒），请重试' : (e && e.message ? e.message : '生成失败，请重试');
        showError(msg);
      });
  }

  // ---------- 渲染 ----------
  function renderMap(md) {
    var mm = window.markmap;
    if (!mm || !mm.Transformer || !mm.Markmap) {
      var pre = document.createElement('pre');
      pre.style.cssText = 'padding:16px;font-size:12px;white-space:pre-wrap;color:#333;';
      pre.textContent = md;
      mindmapEl.innerHTML = '';
      mindmapEl.appendChild(pre);
      return;
    }
    try {
      // markmap-lib@0.18 构造器签名: Transformer(plugins=[]) — 无 options 参数
      var t = new mm.Transformer();
      var root = t.transform(md).root;
      mindmapEl.innerHTML = '';
      // markmap-view 的 Markmap.create 需要 <svg> 容器（官方签名: create(svg, opts, data)）
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      mindmapEl.appendChild(svg);
      mm.Markmap.create(svg, { autoFit: true, duration: 300 }, root);
    } catch (e) {
      showError('渲染失败：' + (e && e.message ? e.message : String(e)));
    }
  }

  function showError(msg) {
    mindmapEl.innerHTML = '';
    var p = document.createElement('p');
    p.style.cssText = 'padding:24px;color:#c33;font-size:13px;';
    p.textContent = msg;
    var btn = document.createElement('button');
    btn.style.cssText = 'margin-left:12px;padding:4px 12px;border-radius:8px;border:1px solid #8a6f5d;background:#fff;color:#8a6f5d;font-size:12px;cursor:pointer;';
    btn.textContent = '重试';
    btn.addEventListener('click', generate);
    mindmapEl.appendChild(p);
    mindmapEl.appendChild(btn);
  }

  // ---------- 导出 ----------
  function exportPng() {
    if (!lastMd) { toast('暂无可导出的导图'); return; }
    var svg = mindmapEl.querySelector('svg');
    if (!svg) { toast('暂无可导出的导图'); return; }
    toast('正在生成 PNG…');
    try {
      // 方案：SVG 序列化 → Image → canvas 绘制（html2canvas 1.4 不支持内联 SVG）
      var xml = new XMLSerializer().serializeToString(svg);
      var blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var img = new Image();
      img.onload = function () {
        try {
          var canvas = document.createElement('canvas');
          var scale = 2;
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          var ctx = canvas.getContext('2d');
          ctx.fillStyle = '#fafafa';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          var a = document.createElement('a');
          a.download = 'mindmap-' + cfg.pageKey + '-' + Date.now() + '.png';
          a.href = canvas.toDataURL('image/png');
          a.click();
          toast('✅ PNG 已导出');
        } catch (e2) {
          toast('PNG 生成失败，请改用 MD 导出');
        } finally {
          URL.revokeObjectURL(url);
        }
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        toast('PNG 生成失败，请改用 MD 导出');
      };
      img.src = url;
    } catch (e) {
      toast('PNG 生成失败，请改用 MD 导出');
    }
  }

  function exportMd() {
    if (!lastMd) { toast('暂无可导出的导图'); return; }
    var blob = new Blob([lastMd], { type: 'text/markdown;charset=utf-8' });
    var a = document.createElement('a');
    a.download = 'mindmap-' + cfg.pageKey + '-' + Date.now() + '.md';
    a.href = URL.createObjectURL(blob);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    toast('✅ MD 已导出');
  }

  // ---------- 历史 ----------
  function histKey() { return 'mm_hist_' + cfg.pageKey; }

  function loadHistory() {
    try {
      var raw = localStorage.getItem(histKey());
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  function saveHistory(md) {
    try {
      var arr = loadHistory();
      var title = (md.split('\n')[0] || '').replace(/^#+\s*/, '').slice(0, 24) || '对话思维导图';
      arr.unshift({ id: Date.now().toString(36), title: title, time: new Date().toISOString(), md: md });
      arr = arr.slice(0, 10); // 最近 10 份
      localStorage.setItem(histKey(), JSON.stringify(arr));
    } catch (e) { /* localStorage 满等忽略 */ }
  }

  function renderHist() {
    var arr = loadHistory();
    histList.innerHTML = '';
    if (!arr.length) {
      var empty = document.createElement('p');
      empty.style.cssText = 'padding:10px;font-size:12px;color:#8b8178;';
      empty.textContent = '暂无历史导图';
      histList.appendChild(empty);
      return;
    }
    arr.forEach(function (h) {
      var div = document.createElement('div');
      div.style.cssText = 'padding:8px 10px;border:1px solid #e0d5c8;border-radius:8px;margin-bottom:8px;font-size:12px;cursor:pointer;';
      div.addEventListener('click', function () {
        histPanel.style.transform = 'translateX(100%)';
        loadingEl.style.display = 'none';
        lastMd = h.md;
        renderMap(h.md);
      });
      var del = document.createElement('span');
      del.textContent = '🗑';
      del.style.cssText = 'float:right;color:#c66;cursor:pointer;font-size:11px;';
      del.addEventListener('click', function (ev) {
        ev.stopPropagation();
        var arr2 = loadHistory().filter(function (x) { return x.id !== h.id; });
        try { localStorage.setItem(histKey(), JSON.stringify(arr2)); } catch (e) {}
        renderHist();
      });
      var t = document.createElement('span');
      t.textContent = h.title;
      t.style.cssText = 'color:#4a3f35;font-weight:500;display:block;padding-right:16px;';
      var d = document.createElement('span');
      d.style.cssText = 'color:#8b8178;font-size:11px;';
      d.textContent = h.time ? new Date(h.time).toLocaleString() : '';
      div.appendChild(del);
      div.appendChild(t);
      div.appendChild(d);
      histList.appendChild(div);
    });
  }

  // ---------- 工具 ----------
  function normalizeMessages(msgs) {
    // 统一为 [{role:'user'|'assistant', content}]；兼容 {name,text} 结构
    return (msgs || []).map(function (m) {
      if (m && typeof m === 'object' && 'role' in m && 'content' in m) return m;
      if (m && typeof m === 'object' && 'text' in m) {
        var name = m.name || '';
        var isUser = name === 'user' || name === '我';
        return { role: isUser ? 'user' : 'assistant', content: (isUser ? '' : (name + '：')) + (m.text || '') };
      }
      return { role: 'assistant', content: String(m || '') };
    }).filter(function (m) { return m.content && m.content.trim() && m.role !== 'system'; });
  }

  function toast(msg) {
    var t = document.getElementById('mmToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'mmToast';
      t.style.cssText = 'position:fixed;top:16px;left:50%;transform:translateX(-50%);background:#4a3f35;color:#fff;padding:8px 18px;border-radius:10px;font-size:12px;z-index:10000;display:none;';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.display = 'block';
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.style.display = 'none'; }, 3000);
  }

  // ---------- 初始化 ----------
  function refreshButton() {
    if (!cfg || !cfg.buttonEl) return;
    var msgs = normalizeMessages(cfg.getConversation());
    var ready = msgs.length >= cfg.minMessages;
    cfg.buttonEl.disabled = !ready;
    cfg.buttonEl.title = ready ? '生成对话思维导图' : '对话至少需要 ' + cfg.minMessages + ' 条消息';
  }

  function init(opts) {
    cfg = opts;
    if (!cfg.buttonEl) return;
    cfg.minMessages = cfg.minMessages || 10;
    cfg.buttonEl.style.cssText = (cfg.buttonEl.style.cssText || '') + 'margin-left:6px;padding:6px 10px;border-radius:9px;border:1px solid #e0d5c8;background:#fff;color:#8b8178;font-size:12px;cursor:pointer;';
    cfg.buttonEl.addEventListener('click', generate);
    refreshButton();
    window.MindmapFeature = window.MindmapFeature || {};
    window.MindmapFeature.refresh = refreshButton;
    // 轮询兜底（每 3s，成本极低）
    setInterval(refreshButton, 3000);
  }

  window.MindmapFeature = window.MindmapFeature || {};
  window.MindmapFeature.init = init;
  window.MindmapFeature.refresh = refreshButton;
})();
