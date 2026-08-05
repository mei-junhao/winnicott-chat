# Winnicott Chat — 版本日志

## v5.5.1 (2026-08-05) — 修复流式语音朗读按钮

- 五个 TTS 页面增强 AI 气泡文本监听，流式 `innerHTML` 替换后自动补回 `🔊` 按钮并同步最新回复文本。
- 温尼科特、通用大师、咨询师页在流式回复成功收口时显式补加朗读按钮。
- 线上 `/tts` 接口回归返回 `200 audio/mpeg`，前端脚本与页面内联脚本检查通过。

## v5.4.1 (2026-08-04) — 修复语音朗读脚本页面溢出

- 修复 5 页接入语音朗读时，把主文档 `<script>` 错误拼进 `w.document.write()` 字符串的问题。
- 该错误会导致浏览器提前结束原页面脚本，随后将大量 JavaScript 源码直接渲染到页面，表现为进入界面后内容横向溢出、页面无法使用。
- 现已将语音朗读监听器放回主页面合法 `<script>` 标签内，同时保留邮箱导出的独立窗口功能。
- 已对大师单聊、温尼科特单聊、圆桌、AI 督导、咨询师 A 五页完成内联脚本语法、DOM 结构和本地真实浏览器回归。

## v5.4 (2026-08-03) — 全量体验层与卡伦·霍妮

### 全站体验

- 九个主要页面统一接入 `site-theme.css` 与 `site-shell.js`，在保留原业务逻辑和不重复功能的前提下，统一暖米色视觉、全局导航、页面宽度和高频入口。
- 首页支持 12 位大师入口；单聊增加高频快捷栏；圆桌明确“参与者 + 回应对象”；AI 督导按“材料—隐私确认—分析与追问”组织流程。
- 补齐 `100dvh`、移动端安全区、键盘焦点和 reduced-motion 降级。

### 卡伦·霍妮

- 复用 `master-chat.html?master=horney`，不新增重复聊天页。
- 低温交心加载仓颉版 `horney-perspective.md`；中高温咨询/教学加载女娲版 `horney-knowledge.md`。
- 首页、三档模式、多语言文案和圆桌邀请均已接入；圆桌新增“文化与自我组”预设及关系、焦虑、完美、“应该”等场景推荐。
- 明确采用透明理论视角：不冒充历史人物本人，不声称拥有未公开记忆或当代立场，不进行远程诊断，解释保持为可检验假说。

### 安全与可靠性

- 知识文件加载增加 HTTP 状态检查，避免把 404 页面当作知识库正文。
- 危机分流进一步区分现实意图与知识讨论，排除“想了解自杀理论”等误判，同时保留明确、迫近风险的本地阻断。
- 发布前四项门禁全部通过：脚本语法、危机分流、圆桌消息结构、存储迁移；并验证霍妮路由和两份知识文件可访问。

---

## v5.3.1 (2026-08-03) — 发布门禁补强

- 危机分流补齐“今晚/今晚上/今天晚上”等迫近他伤表达，并排除新闻、论文等非第一人称讨论语境。
- 圆桌“仅@回应”不再在缺少 `@` 时退回全体；多 `@` 不再错误折叠为第一个目标。
- 新增共享 `storage.js`：统一迁移旧键和旧字段，隔离脏消息、损坏 JSON，存储配额失败改为界面可见。
- 五个活动页均完成脚本语法、危机顺序、圆桌结构和存储迁移回归；本版本只创建本地提交，未推送远程。

---

## v5.3 (2026-08-02) — 临床数据治理、危机安全与核心可靠性修复

### 临床数据与安全

- AI 督导改为默认不自动保存临床材料，只有用户点击“主动保存”并二次确认后才写入浏览器。
- 督导历史升级为 `supervisor_history_v2` 纯文本结构，禁止保存/恢复可执行 HTML；旧格式不再执行。
- 增加手机号、身份证号、邮箱和明确身份字段的本地脱敏提示；文件限制为 2MB。
- 增加“删除全部督导数据”，同步清除新旧历史、当前记录和自定义 API 设置。
- 五个活动聊天页统一接入 `safety.js`：高风险输入在浏览器本地分流，不进入普通大师角色或督导生成流程。

### 核心可靠性

- 圆桌首轮历史排除当前用户消息，再单独追加本轮问题，修复重复提交。
- 圆桌历史改用 `speakerId` 结构化过滤，修复串行和 `@` 模式前缀判断失效。
- 圆桌增加 60 秒请求超时与全流程 `try/finally`，异常后恢复按钮和加载状态。
- 温尼科特页合并为唯一 `saveConversation()`，迁移旧存储键，并移除降级过程对 canonical conversation 的 `pop()`。
- 共享大师和咨询师 A 增加 120 秒超时、SSE 剩余 buffer 处理；历史保留最近 50 条而非最早 50 条。
- 所有聊天输入处理中文输入法 composition，避免按 Enter 确认候选时误发送。

### 发布说明

- 旧 API 密钥已经轮换；本版本不包含新的前端密钥。
- 咨询师 A 仍为前端软门禁，不构成真实访问控制；本版本未改变该产品边界。

---

## v5.2 (2026-07-11) — SCF 云函数代理 + 密钥安全升级

### 架构变更

- 🔑 **API Key 安全迁移**：前端所有明文 Key 全部移除，通过 SCF Web 函数 / 轻量服务器代理中转
- 🏗️ **新增代理层**：`https://xinjingchat.online/`（腾讯云轻量服务器，Node.js + nginx + HTTPS）
- 🔄 **流式透传**：nginx `proxy_buffering off` + `X-Accel-Buffering: no`，SSE 打字机效果无损

### 安全性

- 🔒 前端零密钥：已从 `master-chat.html` / `roundtable.html` / `winnicott-chat.html` / `v4-master-chat.html` 清除共 20+ 个硬编码 API Key
- 🛡️ CORS 白名单：服务器端 `Access-Control-Allow-Origin` 动态回显来源
- 🚫 防盗刷：Referer 白名单 + 防火墙 443 端口限制

### 具体改动

| 文件 | 改动 |
|---|---|
| `scf-proxy/index.py` | SCF Web 函数，单 DeepSeek 供应商，SSE 透传 |
| `edge-functions/api/proxy.js` | 适配 Makers 的 `export default` 格式 |
| `public/master-chat.html` | 增加 `SCF_URL` 三层回退（SCF > EdgeOne > 兜底） |
| `public/roundtable.html` | 添加 SCF 代理 + 去明文 Key |
| `public/winnicott-chat.html` | 添加 SCF 代理 + 去明文 Key + health check 改为检测 SCF |
| `public/v4-master-chat.html` | 添加 SCF 代理 + 去明文 Key |
| `proxy-config.json` | 去明文 Key，新增 `mode:scf` / `scfUrl` 字段 |
| `public/proxy.js` | 支持 SCF 模式探测 |

### 部署

- 腾讯云轻量服务器：Ubuntu 24 + Node.js 22 + nginx + Certbot（自动 HTTPS）
- 域名：`xinjingchat.online`（A 记录指向 43.138.198.165）
- Docker/systemd 守护：`chat-proxy.service` 自动重启

---

## v4.1 (2026-06-29) — AI 督导增强 + 全线体验优化

### AI 督导 (ai-supervisor.html)

**新增功能**
- 💾 自动保存：印象生成完成和每次聊天回复后自动保存到本地浏览器
- 📂 历史面板：弹窗式查看/加载/删除历史督导对话
- 📊 字数统计：textarea 下方实时显示字数，超 4000 字红色提醒

**体验优化**
- 🔽 整体印象可折叠：标题栏新增"收起/展开"按钮，折叠后不再遮挡对话区
- 📏 聊天区扩高：max-height 从 400px 升至 550px，对话空间更大
- 📎 文件上传不再硬截断：全文发送至 AI，仅显示"建议 4000 字以内"提示
- ⚠️ 超限警告：上传超 4000 字文件时黄色提示

### 多大师对话 (master-chat.html)

- 🌡️ 三档温度模式：在 MASTERS 配置中添加 modes 字段，支持 20/60/90 三档
- 🔧 流式输出修复：`sendMessage()` 中 `success` 变量未设 true 导致气泡消失
- 💾 保存按钮：设置面板新增"💾 保存对话"按钮
- 🌐 语言切换移入设置面板：顶栏仅保留返回链接 + 标题 + 设置

### 温尼科特对话 (winnicott-chat.html)

- 🧠 语义话题保存：自动保存从硬数 5 条改为 `checkChapterShift()` Jaccard 相似度触发
- 🌡️ 三档温度模式：URL `?temp=` 参数 + intro 三按钮支持
- 🛡️ 兜底保存：20 条未切换话题时强制保存

### 主页 (index.html)

- 🌡️ mode-overlay：点击大师卡片弹出三档温度选择层（20/60/90），每位大师定制文案

### 基础设施

- 🧹 清理误入仓库的 cloudflared.exe（51.7MB）和硬编码密钥
- 📝 `.gitignore` 新增 `.git-credentials` 等敏感文件排除规则
- 📖 PROJECT.md 更新至 v4.1

---

## v4.0 (2026-06-29) — GitHub Pages 迁移

- 🚀 迁移到 GitHub Pages：`mei-junhao.github.io/winnicott-chat/`
- 📄 新主页 master-select.html（8 位大师卡片）
- 🗂️ 7 个大师知识库文件完成（Freud/Jung/Klein/Bion/Rogers/Beck/Yalom）
- 🧑‍⚕️ AI 督导页面上线（密码保护，基于 alice-perspective 框架）
- 🛠️ PROJECT.md 项目手册创建

---

## v3.x 及更早

详见旧版部署记录。v3.1 源码保留为 `index.html` 作参考。
