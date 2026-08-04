/* ============================================================
 * safety.js — 全站统一心理危机输入安全层
 *
 * 目标：高风险输入不进入普通大师角色扮演/督导生成流程；
 *      仅在浏览器本地判断，不记录、不上传命中的原文。
 * 边界：这是保守的安全分流，不进行诊断，也不会自动联系任何机构。
 * ============================================================ */
(function () {
  'use strict';

  var VERSION = '2026-08-04.2';
  var IMMEDIATE_PATTERNS = [
    /(?:现在|马上|今晚|今天|已经|正在|准备|打算|计划).{0,12}(?:自杀|轻生|结束生命|杀死自己|不想活|跳楼|割腕|上吊|服毒|吞药)/i,
    /(?:自杀|轻生|结束生命|杀死自己|跳楼|割腕|上吊|服毒|吞药).{0,12}(?:现在|马上|今晚|今天|已经|正在|准备|打算|计划)/i,
    /(?:我有|手边有|拿着|准备了|准备好).{0,12}(?:刀|绳|药|枪|农药|毒药)/i,
    /(?:刀|绳|药|枪|农药|毒药).{0,16}(?:自杀|轻生|结束自己|结束生命|杀死自己|伤害自己|不想活)/i,
    /(?:现在|马上|今晚|今晚上|今天|今天晚上|已经|正在|准备|打算|计划).{0,12}(?:杀人|杀了他|杀了她|伤害别人|伤害他人|弄死)/i,
    /(?:杀人|杀了他|杀了她|伤害别人|伤害他人|弄死).{0,12}(?:现在|马上|今晚|今晚上|今天|今天晚上|已经|正在|准备|打算|计划)/i
  ];
  var CONCERN_PATTERNS = [
    /(?:自杀|轻生|不想活|活不下去|结束生命|死了算了|想死|自残|割腕|伤害自己)/i,
    /(?:杀人|伤害别人|伤害他人|弄死|同归于尽)/i,
    /(?:被打|打我|殴打我|家暴|虐待|性侵|强奸|被控制|被威胁)/i,
    /(?:不敢回家|没法离开|无法离开).{0,12}(?:他|她|家里|伴侣|父母|丈夫|妻子)?/i,
    /(?:听到声音|有人命令我|控制不住自己|完全失控|现实感消失)/i
  ];
  var NEGATION = /(?:没有|并没有|不是|不想|从未|不会|别担心).{0,6}(?:自杀|轻生|伤害自己|伤害别人|杀人)/i;
  var CONTEXTUAL_DISCUSSION = /(?:论文|文章|研究|报告|新闻|课程|课堂|理论|现象|议题).{0,12}(?:自杀|轻生|自残|杀人)|(?:自杀|轻生|自残|杀人).{0,12}(?:论文|文章|研究|报告|新闻|课程|课堂|理论|现象|议题)/i;
  var FIRST_PERSON_RISK = /(?:我|本人|自己).{0,10}(?:想(?!了解|研究|讨论|知道|询问)|要|准备|打算|计划|控制不住|忍不住).{0,6}(?:死|不活|自杀|轻生|自残|伤害自己|杀人|杀了他|杀了她|伤害别人|伤害他人|弄死)|(?:我|本人).{0,8}(?:活不下去|不想活)/i;

  function normalize(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
  }

  function assess(text) {
    var value = normalize(text);
    if (!value) return { level: 'none', version: VERSION };
    if (NEGATION.test(value) && !IMMEDIATE_PATTERNS.some(function (p) { return p.test(value); })) {
      return { level: 'none', version: VERSION };
    }
    if (CONTEXTUAL_DISCUSSION.test(value) && !FIRST_PERSON_RISK.test(value)) {
      return { level: 'none', version: VERSION };
    }
    if (IMMEDIATE_PATTERNS.some(function (p) { return p.test(value); })) {
      return { level: 'immediate', version: VERSION };
    }
    if (CONCERN_PATTERNS.some(function (p) { return p.test(value); })) {
      return { level: 'concern', version: VERSION };
    }
    return { level: 'none', version: VERSION };
  }

  function response(level) {
    if (level === 'immediate') {
      return '现实安全提示：你刚才描述的情况可能有迫近危险。现在先停止任何可能伤害自己或他人的行动，把药物、刀具、绳索、武器或其他危险物品交给身边可信任的人或放到无法立即取得的位置；立刻移动到有其他人在的安全地点，不要独处；立即联系当地急救、警方或最近的急诊，并联系一位能马上到场陪伴的人。若还能回复，请只告诉我：是否已经采取行动、身边是否有人、你所在的国家或地区。确认现实安全前，普通大师对话会暂停。';
    }
    return '现实安全提示：你提到的内容可能涉及自伤、他伤、暴力控制或急性失控。请先告诉我：现在是否有立即行动的打算、是否已准备具体方式或危险物品、身边是否有能联系的人。如果危险迫近，请立刻远离危险物品，移动到有人的安全地点，联系当地急救、警方或最近的急诊，并请可信任的人陪在身边。文字交流不能替代现场危机支持。';
  }

  function append(container, message, options) {
    if (!container) return;
    options = options || {};
    var el = document.createElement('div');
    el.className = options.className || 'msg ai safety-response';
    el.setAttribute('role', 'alert');
    el.setAttribute('data-safety-version', VERSION);
    if (typeof options.render === 'function') {
      options.render(el, message);
      var rendered = el.querySelector('.bubble') || el.firstElementChild || el;
      rendered.style.fontWeight = '700';
      rendered.setAttribute('data-safety-emphasis', 'strong');
    } else {
      var strong = document.createElement('strong');
      strong.textContent = message;
      el.appendChild(strong);
    }
    container.appendChild(el);
    if (typeof el.scrollIntoView === 'function') el.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }

  function guard(text, options) {
    var result = assess(text);
    if (result.level === 'none') return false;
    var message = response(result.level);
    append(options && options.container, message, options);
    if (options && typeof options.onBlocked === 'function') options.onBlocked(result, message);
    return true;
  }

  window.ChatSafety = {
    version: VERSION,
    assess: assess,
    response: response,
    guard: guard
  };
})();
