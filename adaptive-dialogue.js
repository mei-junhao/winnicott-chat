/* ============================================================
 * adaptive-dialogue.js — 当前对话需要识别与轻量模式切换
 *
 * 只判断“此刻更需要什么回应”，不判断用户是不是来访者。
 * 不新增模型调用；状态默认只存在当前标签页会话。
 * 危机判断仍由 safety.js 优先负责。
 * ============================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'adaptive_dialogue_v1';
  var MIN_LOCK_ROUNDS = 3;
  var runtime = { onModeChange: null, storageKey: STORAGE_KEY };
  var state = {
    mode: 'balanced',
    confidence: 0,
    evidence: 0,
    roundsSinceChoice: MIN_LOCK_ROUNDS,
    confirmed: false,
    promptShown: false,
    suppressUntil: 0,
    source: 'default'
  };

  var SUPPORT_PATTERNS = [
    /我(现在|最近|一直|总是|真的|好像|很|特别|非常|有点)/,
    /(害怕|担心|难受|痛苦|崩溃|孤独|无助|委屈|羞耻|失去|被抛下|撑不住|受不了)/,
    /(不知道怎么办|想说说|能不能听我|只想聊聊|陪我|理解我|听听我)/,
    /(我和|我跟|我对|他对我|她对我|这段关系|咨询师|治疗师).*(依赖|舍不得|害怕|不安|离开|失去)/,
    /(依赖|舍不得|害怕|不安).{0,12}(咨询师|治疗师|他|她)/
  ];
  var KNOWLEDGE_PATTERNS = [
    /(什么是|如何理解|请解释|请介绍|区别|比较|定义|概念|原文|出处|页码|引用|论文|理论)/,
    /(温尼科特|拉康|弗洛伊德|克莱因|荣格|比昂|罗杰斯|贝克|亚隆|阿德勒|霍妮|科胡特).*(认为|理论|观点|术语|概念)/,
    /(个案|案例|督导|咨询师用户|临床工作|教学|备课|写作|知识库).*(分析|讨论|整理|说明)/
  ];
  var EXPLICIT_SUPPORT = /(先别分析|不要分析|少讲理论|多听我说|先听我说|我只想倾诉|只想被听见|陪我聊聊)/;
  var EXPLICIT_KNOWLEDGE = /(请深入分析|多分析一点|详细解释|用专业术语|从理论上说|给我文献|学术一点|教学模式|我是在学习|我是咨询师|我是治疗师)/;

  function safeRead() {
    try {
      var raw = sessionStorage.getItem(runtime.storageKey);
      if (!raw) return;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return;
      Object.keys(state).forEach(function (key) {
        if (Object.prototype.hasOwnProperty.call(parsed, key)) state[key] = parsed[key];
      });
    } catch (e) {}
  }

  function safeWrite() {
    try { sessionStorage.setItem(runtime.storageKey, JSON.stringify(state)); } catch (e) {}
  }

  function countMatches(text, patterns) {
    var count = 0;
    patterns.forEach(function (pattern) { if (pattern.test(text)) count++; });
    return count;
  }

  function classify(text, options) {
    text = typeof text === 'string' ? text.trim() : '';
    options = options || {};
    var risk = options.riskLevel || 'none';
    if (!text || risk !== 'none') {
      return { need: 'balanced', confidence: 0, signals: [], riskLevel: risk, safetyOverride: risk !== 'none' };
    }

    var support = countMatches(text, SUPPORT_PATTERNS);
    var knowledge = countMatches(text, KNOWLEDGE_PATTERNS);
    var signals = [];
    if (support) signals.push('personal_distress');
    if (knowledge) signals.push('knowledge_request');
    if (EXPLICIT_SUPPORT.test(text)) {
      return { need: 'support', confidence: 0.98, signals: signals.concat(['explicit_preference']), riskLevel: risk };
    }
    if (EXPLICIT_KNOWLEDGE.test(text)) {
      return { need: 'knowledge', confidence: 0.98, signals: signals.concat(['explicit_preference']), riskLevel: risk };
    }
    if (support > knowledge && support >= 2) {
      return { need: 'support', confidence: Math.min(0.94, 0.64 + support * 0.08), signals: signals, riskLevel: risk };
    }
    if (knowledge > support && knowledge >= 1) {
      return { need: 'knowledge', confidence: Math.min(0.90, 0.60 + knowledge * 0.08), signals: signals, riskLevel: risk };
    }
    if (support && knowledge) {
      return { need: 'mixed', confidence: 0.58, signals: signals, riskLevel: risk };
    }
    return { need: 'balanced', confidence: 0.35, signals: signals, riskLevel: risk };
  }

  function normalizeNeed(need) {
    if (need === 'support') return 'support';
    if (need === 'knowledge' || need === 'analytic') return 'analytic';
    return 'balanced';
  }

  function modeLabel(mode) {
    return mode === 'support' ? '先听你说' : mode === 'analytic' ? '深入分析' : '平衡';
  }

  function applyMode(mode, source, confidence) {
    var nextMode = normalizeNeed(mode);
    var changed = state.mode !== nextMode;
    state.mode = nextMode;
    state.source = source || 'inferred';
    state.confidence = confidence || 0;
    state.roundsSinceChoice = 0;
    safeWrite();
    if (changed && typeof runtime.onModeChange === 'function') {
      runtime.onModeChange(state.mode);
    }
  }

  function canChange() {
    return state.source !== 'manual' && !state.confirmed && state.roundsSinceChoice > MIN_LOCK_ROUNDS;
  }

  function inspect(text, options) {
    safeRead();
    state.roundsSinceChoice += 1;
    var result = classify(text, options);
    result.mode = normalizeNeed(result.need);
    result.label = modeLabel(result.mode);
    result.currentMode = state.mode;
    result.shouldSuggest = false;
    result.showConfirm = false;

    if (result.safetyOverride) {
      result.mode = state.mode;
      result.label = modeLabel(state.mode);
      safeWrite();
      return result;
    }

    var explicitPreference = result.signals.indexOf('explicit_preference') >= 0;
    if (result.mode === 'support' && result.confidence >= 0.80 && (explicitPreference || canChange()) && state.mode !== 'support') {
      var hadPrompt = state.promptShown;
      applyMode('support', explicitPreference ? 'explicit-text' : 'inferred', result.confidence);
      result.shouldSuggest = true;
      result.showConfirm = !explicitPreference && !hadPrompt;
    } else if (result.mode === 'analytic' && result.confidence >= 0.66 && (explicitPreference || canChange()) && state.mode !== 'analytic') {
      applyMode('analytic', explicitPreference ? 'explicit-text' : 'inferred', result.confidence);
      result.shouldSuggest = false;
    } else if (result.mode === 'balanced' || result.need === 'mixed') {
      result.shouldSuggest = false;
    }
    result.activeMode = state.mode;
    result.activeLabel = modeLabel(state.mode);
    safeWrite();
    return result;
  }

  function systemInstruction(result, personaName) {
    safeRead();
    var name = personaName || '当前大师';
    if (state.mode === 'support') {
      return '\n\n【当前回应方式：先听你说】你正在回应可能在谈论自身处境的用户。先回应用户刚才表达的感受，不急着解释或归类。使用短句和短段落，少用理论术语；除非用户主动要求，否则不要用专业概念解释用户本人。每轮最多提出一个问题，优先邀请用户继续说。不要从一句关系表达推导诊断、人格或确定的动力学结论。可以说“我不想急着替你下结论”。保持' + name + '的声音，但不要许诺永远陪伴或强化用户对 AI 的依赖。危机相关内容仍由安全规则优先处理。回应尽量控制在 2 至 5 句。\n';
    }
    if (state.mode === 'analytic') {
      return '\n\n【当前回应方式：深入分析】用户明确或持续表现出希望理解理论。可以使用必要术语，但仍须区分理论假设与对个人的确定判断；先回应问题，再解释概念。\n';
    }
    return '\n\n【当前回应方式：平衡】先简短回应用户当下的表达，再给出有限的理解或理论线索。避免一次堆叠多个术语，保留继续倾听的空间。\n';
  }

  function ensureStyleBar() {
    var existing = document.getElementById('adaptiveStyleBar');
    if (existing) return existing;
    var bar = document.createElement('div');
    bar.id = 'adaptiveStyleBar';
    bar.setAttribute('role', 'status');
    bar.setAttribute('aria-live', 'polite');
    bar.style.cssText = 'display:none;margin:8px 16px 0;padding:8px 10px;border:1px solid var(--border);border-radius:10px;background:var(--card);color:var(--muted);font-size:12px;line-height:1.5;align-items:center;gap:8px;flex-wrap:wrap;';
    var messages = document.getElementById('messages');
    if (messages) messages.appendChild(bar);
    return bar;
  }

  function showSuggestion(result) {
    if (!result || !result.showConfirm) return;
    var bar = ensureStyleBar();
    if (!bar) return;
    state.promptShown = true;
    safeWrite();
    bar.innerHTML = '<span>我先少讲理论，多听你说。这样合适吗？</span><button type="button" data-adaptive="support" style="border:1px solid var(--accent);border-radius:8px;padding:4px 8px;background:var(--accent);color:#fff;font:inherit;cursor:pointer;">合适</button><button type="button" data-adaptive="analytic" style="border:1px solid var(--border);border-radius:8px;padding:4px 8px;background:transparent;color:var(--text);font:inherit;cursor:pointer;">多分析一点</button>';
    bar.style.display = 'flex';
    if (typeof bar.scrollIntoView === 'function') bar.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    bar.querySelectorAll('[data-adaptive]').forEach(function (button) {
      button.addEventListener('click', function () { choose(button.getAttribute('data-adaptive')); });
    });
  }

  function choose(mode) {
    safeRead();
    state.mode = normalizeNeed(mode);
    state.confirmed = false;
    state.source = 'user';
    state.confidence = 1;
    state.roundsSinceChoice = 0;
    safeWrite();
    if (typeof runtime.onModeChange === 'function') runtime.onModeChange(state.mode);
    var bar = document.getElementById('adaptiveStyleBar');
    if (bar) {
      bar.textContent = '回应方式：' + modeLabel(state.mode) + ' · 可随时说“先听我说”或“多分析一点”';
      setTimeout(function () { if (bar) bar.style.display = 'none'; }, 5000);
    }
  }

  function reset() {
    try { sessionStorage.removeItem(runtime.storageKey); } catch (e) {}
    state.mode = 'balanced'; state.confidence = 0; state.evidence = 0; state.roundsSinceChoice = MIN_LOCK_ROUNDS; state.confirmed = false; state.promptShown = false; state.suppressUntil = 0; state.source = 'default';
    if (typeof runtime.onModeChange === 'function') runtime.onModeChange(state.mode);
    var bar = document.getElementById('adaptiveStyleBar');
    if (bar) bar.style.display = 'none';
  }

  safeRead();
  window.AdaptiveDialogue = {
    version: '2026-08-04.1',
    inspect: inspect,
    classify: classify,
    instruction: systemInstruction,
    showSuggestion: showSuggestion,
    choose: choose,
    configure: function (options) { options = options || {}; runtime.onModeChange = typeof options.onModeChange === 'function' ? options.onModeChange : null; runtime.storageKey = STORAGE_KEY + (options.scope ? '_' + String(options.scope).replace(/[^a-z0-9_-]/gi, '') : ''); safeRead(); },
    noteManualMode: function (mode) { state.mode = normalizeNeed(mode); state.confirmed = true; state.source = 'manual'; state.confidence = 1; state.roundsSinceChoice = 0; safeWrite(); },
    reset: reset,
    getState: function () { safeRead(); return JSON.parse(JSON.stringify(state)); },
    label: modeLabel
  };
})();
