/* ============================================================
 * storage.js — 活动聊天页共享本地存储归一化与迁移层
 *
 * 只处理 JSON schema、旧键迁移、脏数据隔离和安全写入；
 * 不渲染 HTML，不执行历史内容，不记录用户输入。
 * ============================================================ */
(function () {
  'use strict';

  var VERSION = 2;
  var MAX_MESSAGE_LENGTH = 200000;

  function notify(options, message, error) {
    if (options && typeof options.onError === 'function') options.onError(message, error);
  }

  function cleanText(value) {
    if (typeof value !== 'string') return '';
    return value.slice(0, MAX_MESSAGE_LENGTH);
  }

  function validTime(value) {
    if (typeof value === 'number' && isFinite(value) && value > 0) return value;
    if (typeof value === 'string' && !isNaN(Date.parse(value))) return value;
    return new Date().toISOString();
  }

  function normalizeChatMessage(message) {
    if (!message || typeof message !== 'object') return null;
    var role = message.role;
    if (role !== 'user' && role !== 'assistant') {
      if (message.sender === 'user' || message.name === 'user') role = 'user';
      else if (message.sender === 'assistant' || message.name === 'assistant' || message.sender === 'ai') role = 'assistant';
    }
    var content = cleanText(typeof message.content === 'string' ? message.content : message.text);
    if ((role !== 'user' && role !== 'assistant') || !content.trim()) return null;
    return { role: role, content: content };
  }

  function normalizeChatMessages(messages) {
    return (Array.isArray(messages) ? messages : []).map(normalizeChatMessage).filter(Boolean);
  }

  function normalizeRoundMessage(message) {
    if (!message || typeof message !== 'object') return null;
    var name = typeof message.name === 'string' ? message.name : (message.role === 'user' ? 'user' : message.masterKey);
    var text = cleanText(typeof message.text === 'string' ? message.text : message.content);
    if (!name || !text.trim()) return null;
    return { name: name, text: text, time: typeof message.time === 'number' && isFinite(message.time) ? message.time : Date.now() };
  }

  function normalizeRoundMessages(messages) {
    return (Array.isArray(messages) ? messages : []).map(normalizeRoundMessage).filter(Boolean);
  }

  function normalizeChatHistoryEntry(entry, index) {
    if (!entry || typeof entry !== 'object') return null;
    var messages = normalizeChatMessages(Array.isArray(entry.messages) ? entry.messages : entry.conversation);
    if (!messages.length) return null;
    return {
      id: typeof entry.id === 'string' && entry.id ? entry.id : 'migrated-' + index + '-' + Date.now().toString(36),
      title: cleanText(entry.title) || '历史对话',
      time: validTime(entry.time),
      msgCount: messages.length,
      schemaVersion: VERSION,
      messages: messages
    };
  }

  function normalizeRoundHistoryEntry(entry, index) {
    if (!entry || typeof entry !== 'object') return null;
    var messages = normalizeRoundMessages(Array.isArray(entry.messages) ? entry.messages : entry.conversation);
    if (!messages.length) return null;
    var masters = (Array.isArray(entry.masters) ? entry.masters : []).filter(function (key) { return typeof key === 'string' && key; });
    return {
      id: typeof entry.id === 'string' && entry.id ? entry.id : 'rt-migrated-' + index + '-' + Date.now().toString(36),
      title: cleanText(entry.title) || '圆桌历史',
      time: validTime(entry.time),
      msgCount: messages.length,
      schemaVersion: VERSION,
      masters: masters,
      messages: messages
    };
  }

  function normalizeSupervisorHistoryEntry(entry, index) {
    if (!entry || typeof entry !== 'object') return null;
    var material = cleanText(entry.material);
    var impressionText = cleanText(typeof entry.impressionText === 'string' ? entry.impressionText : entry.impression);
    var chatMessages = normalizeChatMessages(Array.isArray(entry.chatMessages) ? entry.chatMessages : entry.messages);
    if (!material || !impressionText) return null;
    return {
      id: typeof entry.id === 'string' && entry.id ? entry.id : 'sv-migrated-' + index + '-' + Date.now().toString(36),
      time: validTime(entry.time),
      title: cleanText(entry.title) || material.replace(/\s+/g, ' ').slice(0, 30),
      schemaVersion: VERSION,
      material: material,
      impressionText: impressionText,
      chatMessages: chatMessages
    };
  }

  function normalizerFor(kind) {
    if (kind === 'roundMessages') return normalizeRoundMessages;
    if (kind === 'chatHistory') return function (value) { return (Array.isArray(value) ? value : []).map(normalizeChatHistoryEntry).filter(Boolean); };
    if (kind === 'roundHistory') return function (value) { return (Array.isArray(value) ? value : []).map(normalizeRoundHistoryEntry).filter(Boolean); };
    if (kind === 'supervisorHistory') return function (value) { return (Array.isArray(value) ? value : []).map(normalizeSupervisorHistoryEntry).filter(Boolean); };
    return normalizeChatMessages;
  }

  function write(key, value, options) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      notify(options, '浏览器本地存储写入失败，可能是空间不足。请先导出或清理旧历史。', error);
      return false;
    }
  }

  function read(key, options) {
    options = options || {};
    var keys = [key].concat(Array.isArray(options.legacyKeys) ? options.legacyKeys : []);
    var normalize = normalizerFor(options.kind);
    for (var i = 0; i < keys.length; i++) {
      var raw;
      try {
        raw = localStorage.getItem(keys[i]);
      } catch (error) {
        notify(options, '无法读取浏览器本地存储。', error);
        return [];
      }
      if (!raw) continue;
      var parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (error) {
        notify(options, '检测到损坏的本地历史，已隔离并跳过加载。', error);
        continue;
      }
      var normalized = normalize(parsed);
      var needsMigration = keys[i] !== key || JSON.stringify(parsed) !== JSON.stringify(normalized);
      if (needsMigration && write(key, normalized, options) && typeof options.onMigrated === 'function') {
        options.onMigrated(keys[i], key, normalized.length);
      }
      return normalized;
    }
    return [];
  }

  window.ChatStorage = {
    version: VERSION,
    normalizeChatMessage: normalizeChatMessage,
    normalizeChatMessages: normalizeChatMessages,
    normalizeRoundMessage: normalizeRoundMessage,
    normalizeRoundMessages: normalizeRoundMessages,
    read: read,
    write: write
  };
})();
