/*
 * proxy.js — 代理「透明拦截」前端侧
 * ------------------------------------------------------------
 * 三种模式（由 proxy-config.json 的 mode 字段控制）：
 *
 *   "scf"    — 所有已知供应商请求转发到腾讯云 SCF Web 函数（scfUrl）。
 *              密钥只存在 SCF 环境变量，前端零密钥。
 *   "direct" — 直连真实 API（开发调试用，key 从 upstreams 读取）。
 *   (无/其他)— 旧版本地代理探测（localhost + 3000 端口），兼容现有 dev 环境。
 *
 * 安全：本文件只做「请求重路由」，不藏任何 key。
 *       SCF 模式下，即使前端代码被公开也无法获取密钥。
 */
(function () {
  'use strict';
  var REAL_FETCH = window.fetch ? window.fetch.bind(window) : null;
  if (!REAL_FETCH) return;

  var PROXY_HOSTS = ['api.deepseek.com', 'api.kkdmx.com', 'apihub.agnes-ai.com'];

  // 读取配置（由 local-server.js 注入 window.__PROXY_CONFIG__ 或异步加载）
  var configPromise = (function loadConfig() {
    if (window.__PROXY_CONFIG__) return Promise.resolve(window.__PROXY_CONFIG__);
    return REAL_FETCH('/proxy-config.json')
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  })();
  window.__PROXY_PROMISE__ = configPromise;

  // ── SCF 模式：单次探测 /health 确认可用 ──
  var scfReady = configPromise.then(function (cfg) {
    if (!cfg || cfg.mode !== 'scf' || !cfg.scfUrl) return null;
    var base = cfg.scfUrl.replace(/\/+$/, '');
    return REAL_FETCH(base + '/health', { method: 'GET' })
      .then(function (r) { return r.ok ? base : null; })
      .catch(function () { return null; });
  });

  // ── 旧版本地代理探测（兼容） ──
  var localCandidates = [];
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    localCandidates.push(location.origin);
  }
  localCandidates.push('http://localhost:3000');
  var localPromise = localCandidates.reduce(function (chain, base) {
    return chain.then(function (found) {
      if (found) return found;
      return REAL_FETCH(base + '/health', { method: 'GET' })
        .then(function (r) { return r.ok ? base : null; })
        .catch(function () { return null; });
    });
  }, Promise.resolve(null));

  window.fetch = function (input, init) {
    init = init || {};
    var url = (typeof input === 'string') ? input : (input && input.url) || '';
    if (!/^https?:\/\//i.test(url)) return REAL_FETCH(input, init);
    var host;
    try { host = new URL(url).host; } catch (e) { return REAL_FETCH(input, init); }
    if (PROXY_HOSTS.indexOf(host) === -1) return REAL_FETCH(input, init);
    if (init.method && String(init.method).toUpperCase() !== 'POST') return REAL_FETCH(input, init);

    var bodyObj = null;
    try { bodyObj = JSON.parse(init.body); } catch (e) { return REAL_FETCH(input, init); }
    if (!bodyObj || !Array.isArray(bodyObj.messages)) return REAL_FETCH(input, init);

    // 先试 SCF，再试本地代理
    return scfReady.then(function (scfBase) {
      if (scfBase) {
        // SCF 模式：转发到云函数
        var headers = {};
        if (init.headers) {
          if (typeof init.headers.forEach === 'function') {
            init.headers.forEach(function (v, k) {
              if (String(k).toLowerCase() !== 'authorization') headers[k] = v;
            });
          } else {
            Object.keys(init.headers).forEach(function (k) {
              if (String(k).toLowerCase() !== 'authorization') headers[k] = init.headers[k];
            });
          }
        }
        if (!headers['Content-Type'] && !headers['content-type'])
          headers['Content-Type'] = 'application/json';
        headers['x-upstream-host'] = host;

        var newInit = {};
        for (var k in init) if (init.hasOwnProperty(k)) newInit[k] = init[k];
        newInit.headers = headers;
        return REAL_FETCH(scfBase, newInit);
      }

      // 回退到本地代理
      return localPromise.then(function (base) {
        if (!base) return REAL_FETCH(input, init);
        var headers = {};
        if (init.headers) {
          if (typeof init.headers.forEach === 'function') {
            init.headers.forEach(function (v, k) {
              if (String(k).toLowerCase() !== 'authorization') headers[k] = v;
            });
          } else {
            Object.keys(init.headers).forEach(function (k) {
              if (String(k).toLowerCase() !== 'authorization') headers[k] = init.headers[k];
            });
          }
        }
        if (!headers['Content-Type'] && !headers['content-type'])
          headers['Content-Type'] = 'application/json';
        headers['x-upstream-host'] = host;

        var newInit2 = {};
        for (var k2 in init) if (init.hasOwnProperty(k2)) newInit2[k2] = init[k2];
        newInit2.headers = headers;
        newInit2.body = JSON.stringify(bodyObj);
        return REAL_FETCH(base + '/chat', newInit2);
      });
    });
  };
})();
