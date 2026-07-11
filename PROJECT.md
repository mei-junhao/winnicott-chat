# Winnicott Chat — 项目手册

> 最后更新：2026-07-11  
> 当前版本：v5.2  
> 生产环境：https://mei-junhao.github.io/winnicott-chat/ （GitHub Pages，固定 URL）  
> 入口文件：index.html（主页；旧的 master-select.html 已废弃并删除）  
> 仓库地址：https://github.com/mei-junhao/winnicott-chat

---

## 一、项目概述

精神分析大师 AI 对话平台。用户可以与温尼科特、拉康、弗洛伊德、克莱因、荣格、比昂、罗杰斯、贝克、亚隆、苏珊·约翰逊（EFT）等大师的 AI 模拟对话；另含「多大师圆桌对话」「AI 临床督导」「咨询师A 定制服务」三个独立模块。

**技术栈：** 纯 HTML + CSS + JS，零框架单文件部署，GitHub Pages 静态托管，localStorage 存储对话。各页内联 CSS/JS，无构建步骤。

---

## 二、文件结构

```
winnicott-chat/
├── public/                          ← 部署目录（所有静态资源，gh-pages 即此目录的子树镜像）
│   │
│   ├── 【核心页面】
│   ├── index.html                   ← ★ 主页：大师卡片网格（10 位大师）+ 留言板 + 三个模块入口
│   ├── winnicott-chat.html          ← 温尼科特 / 拉康 双人对话 (v4)
│   ├── master-chat.html             ← 多大师共享模板（?master=freud|klein|jung|bion|rogers|beck|yalom|susan_johnson）
│   ├── roundtable.html              ← 多大师圆桌对话（多位大师同空间回应，支持 @ 指定）
│   ├── consultant-a.html            ← 咨询师A 定制服务页（密码门 meijunhao123，温度锁 60）
│   ├── ai-supervisor.html           ← AI 临床督导（密码已取消，含免责声明）
│   │
│   ├── 【知识库 / 人格文件】
│   ├── winnicott-knowledge.md       ← 温尼科特知识库
│   ├── winnicott-knowledge-full.md  ← 温尼科特完整知识库（高温度）
│   ├── winnicott-emotional.md       ← 温尼科特情感模式（低温度）
│   ├── lacan-knowledge.md           ← 拉康知识库
│   ├── freud-knowledge.md           ← 弗洛伊德
│   ├── klein-knowledge.md           ← 克莱因
│   ├── jung-knowledge.md            ← 荣格
│   ├── bion-knowledge.md            ← 比昂
│   ├── rogers-knowledge.md          ← 罗杰斯
│   ├── beck-knowledge.md            ← 贝克
│   ├── yalom-knowledge.md           ← 亚隆
│   ├── sue-johnson-knowledge.md     ← 苏珊·约翰逊（EFT）
│   ├── consultant-a-knowledge.md    ← 咨询师A（温尼科特取向咨询师人格，由 style doc 提炼）
│   ├── *-perspective.md             ← 各大师视角设定（Marvis skill 提炼，部分用于 KB 生成）
│   ├── adler-knowledge.md / cangjie-perspective-full.md / nvwa-perspective-full.md  ← 待接入/素材
│   │
│   ├── 【资源】
│   ├── lacan-avatar.jpg             ← 拉康头像
│   ├── reward-qr.jpg                ← 打赏二维码
│   ├── about-winnicott-chat.html / about-winnicott-chat-video.html  ← 关于页
│   │
│   └── 【遗留 / 备份（可清理，勿线上依赖）】
│       ├── backup-00-original.html / backup-01~03-*.html
│       ├── index-dev.html / index-dev2.html / original-index.html
│       └── v4-master-chat.html / v4-master-select.html / v4-winnicott.html
│
├── home-proxy/                      ← 家庭 PC 代理（cloudflared 隧道 + Python 代理）
├── server.js                        ← 本地开发服务器
└── PROJECT.md                       ← 本文件
```

> 注：`version-release-notes.md` 此前引用但当前仓库已不存在，版本记录以本文件「九、变更记录」为准。

---

## 三、页面架构

### 3.1 页面关系

```
index.html（主页：大师卡片 + 留言板 + 模块入口）
    ├── → winnicott-chat.html（温尼科特 / 拉康 双人对话）
    ├── → master-chat.html?master=freud        （弗洛伊德）
    │      ?master=klein / jung / bion / rogers / beck / yalom / susan_johnson
    ├── → roundtable.html                       （多大师圆桌对话）
    ├── → consultant-a.html                     （咨询师A 定制服务，密码门）
    └── → ai-supervisor.html                    （AI 临床督导）
```

- `master-chat.html` 左上角「← 返回」按钮指向 `index.html`（旧 master-select.html 已删除）。
- 所有页面「了解作者」按钮统一指向 `https://mei-junhao.github.io/mei-personal-site/`。

### 3.2 winnicott-chat.html 功能清单（v4）

- 🎭 双人物切换（温尼科特 ↔ 拉康，含主题/知识库/温度标签切换）
- 🔄 四层自动降级：DeepSeek Pro → Flash → MiniMax M3 → Agnes
- 🌐 中英双语 i18n（完整字典）
- 📋 对话历史：多条记录保存/加载/删除
- ✂️ 转发：勾选消息生成分享卡片（**已重写** `renderShareCard()`，截图移出可视区避免背景错乱、`.catch` 兜底、二维码 `fetch→blob` 同源化、桌面端自动下载）
- 📏 温度滑块 + 回复长度控制
- 🌙 暗黑模式（温尼科特：暖棕 / 拉康：深紫黑）
- 🔌 自用 API 模式 + 快速预设
- 🟢 API 线路健康检测
- ☕ 打赏弹窗（**温尼科特专属 15 轮**自动弹出 + 手动按钮）
- 📥 导出对话
- 🤖 AI 督导链接
- 💡 反馈/匿名问卷
- 📖 对话自动章节分隔
- 📊 访问统计（busuanzi）

### 3.3 master-chat.html 功能

- 通过 `?master=` 参数切换大师（当前：freud / klein / jung / bion / rogers / beck / yalom / susan_johnson）
- 每位大师独立知识库文件（`<master>-knowledge.md`，经 `loadSystemPrompt()` 加载）
- 共享 API 路由和四层降级逻辑（与 winnicott-chat.html 相同）
- 个性化主题色 + Wikipedia 真实照片
- 左上角「← 返回」按钮指向 `index.html`
- ☕ 打赏：**10 轮**自动弹出 + 手动按钮（`mcUserMsgCount` / `maybeAutoRewardMC()`）
- **复用模式**：新增大师页只需复制本文件，将 `var MASTERS` 整体重赋值为仅含目标大师的对象即可完全复用界面（consultant-a.html 即此模式）

### 3.4 ai-supervisor.html（AI 督导）功能

- 🔓 **密码已取消**（原 SHA-256 验证已移除），保留「进入」按钮
- ⚠️ 进入区下方新增红色免责框：「禁止将未脱敏的材料上传，仅代表温尼科特取向观点，不构成临床建议，不能替代真人督导」
- 📎 文件上传（.txt/.md/.docx，建议 4000 字以内，实时字数统计）
- 🔍 整体印象：可折叠/展开
- 💬 督导对话
- 💾 自动保存：印象生成 + 每次对话后自动存 localStorage
- 📂 历史对话：弹窗面板查看/加载/删除
- 📚 基于 alice-perspective SKILL.md 的完整督导框架
- ☕ 打赏：**10 轮**自动弹出 + 手动按钮（`spvUserMsgCount` / `spvMaybeAutoReward()`）
- 🔄 四层 API 降级

### 3.5 roundtable.html（多大师圆桌对话）

- 进入需输入「你的名字」（`.name-overlay` 默认 `display:none`，输入后进入）
- 多位大师在同一对话空间轮流回应，支持 `@大师名` 指定回应者
- **修复**：`MASTERS` 的 `font` 字段曾因语法错误（`font:''"..."`）导致整段脚本崩溃、名字弹窗失效 → 已批量修正
- **修复**：接力/总结阶段 `max_tokens` 原为 200 触顶导致对话截断 → 改为 `summary ? 600 : (react ? 400 : 512)`
- ☕ 打赏：**10 轮**自动弹出 + 手动按钮（`rtUserMsgCount` / `rtMaybeAutoReward()`）

### 3.6 consultant-a.html（咨询师A 定制服务页）

- **完全复用 master-chat.html 界面**：复制后把 `var MASTERS` 重赋值为仅 `consultantA` 一位，对话逻辑/打赏/分享全沿用，零重写
- 人格来源：`consultant-a-knowledge.md`（由 style doc / 女娲生成的 SKILL.md 提炼的温尼科特取向咨询师人格），复用 `loadSystemPrompt()` 机制
- **温度锁 60 不可调**：`talkTemp` 强制 60、覆盖 `updateTemp` 忽略传入值并禁用 `#tempSlider`（长度滑块仍可用）；三个模式按钮 temp 标 20/60/90 仅用于显示「交心/咨询/教学」标签，实际温度恒为 60
- **密码门**：进入即弹覆盖层，门面文案「本页面为定制服务，具体请联系开发者」，密码 `meijunhao123`（前端明文校验，软门禁，**非真实鉴权**）
- 首页入口：index.html 圆桌对话卡片正下方「定制服务」（副文案「咨询师A · 需密码进入」）

### 3.7 全局 UI 优化（Tier A/B/C）

- 在 5 个活动页（index / winnicott-chat / master-chat / roundtable / ai-supervisor）的 `<head>` 内统一注入 `<style id="ui-optimize">` 视觉层，**仅增 CSS、不改结构/JS/字体/主题色**
- Tier A：按钮 `:active` 物理下沉、`hover` 微抬升、`:focus-visible` 键盘焦点环、输入框聚焦染色阴影、`scroll-behavior:smooth`
- Tier B：弹窗 `uiPop` 淡入、消息气泡 hover 极轻阴影、温度 chip 选中态内描边
- Tier C：新消息气泡 `uiMsgIn` 淡入（圆桌排除 `.master` 开场白）；带 `prefers-reduced-motion` 降级

---

## 四、API 路由架构

### 4.1 四层降级（winnicott-chat.html）

| 层级 | 名称 | 端点 | Key 尾号 | 模型名 |
|------|------|------|----------|--------|
| 1 | DeepSeek Pro | `api.kkdmx.com/v1` | `…e22DROJR` | `deepseek-ai/deepseek-v4-pro` |
| 2 | DeepSeek Flash | `api.kkdmx.com/v1` | `…wgmIIX21` | `deepseek-ai/deepseek-v4-flash` |
| 3 | MiniMax M3 | `api.kkdmx.com/v1` | `…fCxooKvD` | `minimaxai/minimax-m3` |
| 4 | Agnes | `apihub.agnes-ai.com/v1` | `…gqppC2e` | `agnes-2.0-flash` |

> 注：kkdmx 的 DeepSeek 线路曾出现 Pro/Flash 超时，实际调用已常切至 MiniMax M3（第 3 层）。四层回退逻辑保持不变。

### 4.2 降级逻辑（关键变量）

```javascript
var _tierLevel = 0;  // 当前线路索引
```

- 每条消息尝试当前 `_tierLevel` 线路
- 失败则 `_tierLevel++`，尝试下一条
- 成功则保持当前线路，不再尝试
- **新对话/切换人物/加载历史/新对话** → 重置 `_tierLevel = 0`
- 超时 `_maxRetry` 次（最多3次）后切下一条

### 4.3 master-chat.html API 配置

位于 `TIERS` 数组，结构同上。

---

## 五、知识库文件清单

### 已就绪 ✅

| 文件 | 用途 | 来源 |
|------|------|------|
| `winnicott-knowledge.md` | 温尼科特默认 | git 原版 |
| `winnicott-knowledge-full.md` | 温尼科特高温度 | git 原版 |
| `winnicott-emotional.md` | 温尼科特低温度 | git 原版 |
| `lacan-knowledge.md` | 拉康 | git 原版 |
| `freud-knowledge.md` | 弗洛伊德 | Marvis skill → 提炼 |
| `klein-knowledge.md` | 克莱因 | Marvis skill → 提炼 |
| `jung-knowledge.md` | 荣格 | Marvis skill → 提炼 |
| `bion-knowledge.md` | 比昂 | Marvis skill → 提炼 |
| `rogers-knowledge.md` | 罗杰斯 | Marvis skill → 提炼 |
| `beck-knowledge.md` | 贝克 | Marvis skill → 提炼 |
| `yalom-knowledge.md` | 亚隆 | Marvis skill → 提炼 |
| `sue-johnson-knowledge.md` | 苏珊·约翰逊（EFT） | Marvis skill → 提炼 |
| `consultant-a-knowledge.md` | 咨询师A 定制 | style doc → 提炼 |

### Skill 源文件路径（更新 KB 时参考）

```
C:\Users\Administrator\AppData\Roaming\Tencent\Marvis\User\oAN1i2TkarGXJ5_iqPWv0-tIVJqI\skills\
├── sigmund-freud-perspective/SKILL.md
├── melanie-klein-perspective/SKILL.md
├── carl-jung-perspective/SKILL.md
├── wilfred-bion-perspective/SKILL.md
├── carl-rogers-perspective/SKILL.md
├── aaron-beck-perspective/SKILL.md
├── irvin-yalom-perspective/SKILL.md
├── sue-johnson-perspective/SKILL.md
└── market/alice-perspective/SKILL.md   ← AI 督导
```

---

## 六、修改指南

### 6.1 修改流程（严格遵守）

1. **从当前文件开始**，不要重新写
2. **每次只改一个功能**，改完 → 本地校验 → 部署测试
3. **任何 HTML 文件修改前**先保存备份
4. **API/模型名**必须先用 curl 验证后再写到代码里
5. **修改完成后更新本文件**（末尾变更记录 + 相关章节）
6. **本地校验**：改动后用 `node --check` 抽验内联脚本语法；提交前确认 `</head>` 唯一、注入块位置正确
7. **先审后行**：改前先给方案，用户确认（「部署吧」/「开始」/「要」）后再推送；未确认不得 push

### 6.2 部署命令（GitHub Pages）

**生产环境部署：** 所有修改完成后执行以下命令。GitHub Pages 自动构建，1-2 分钟后生效。
更新后的页面在固定 URL：`https://mei-junhao.github.io/winnicott-chat/`

```bash
cd C:\Users\Administrator\WorkBuddy\2026-06-21-10-33-32\winnicott-chat

# 1. 提交改动
git add public/<改动的 files>
git commit -m "描述改了什么"

# 2. 推送 main 分支
git push origin main

# 3. 拆分 public/ 子树并强推 gh-pages
git branch -D gh-pages-build 2>/dev/null
git subtree split --prefix=public HEAD -b gh-pages-build
git push origin gh-pages-build:gh-pages --force
git branch -D gh-pages-build 2>/dev/null
```

**说明：**
- `main` 分支存储完整源码
- `gh-pages` 分支是 `public/` 目录的子树镜像，作为 GitHub Pages 部署源
- 推送后用 `git show origin/gh-pages:<file> | grep '<关键串>'` 校验关键改动已上线
- **禁止再使用 CloudStudio 沙箱部署**——URL 不固定，无法增量更新

### 6.3 验证 API 可用性

```bash
# 验证模型列表
curl -s -H 'Authorization: Bearer <KEY>' 'https://api.kkdmx.com/v1/models' | python3 -c "import sys,json; [print(m['id']) for m in json.load(sys.stdin)['data']]"

# 验证聊天可用
curl -s -X POST 'https://api.kkdmx.com/v1/chat/completions' \
  -H 'Authorization: Bearer <KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"model":"<MODEL>","messages":[{"role":"user","content":"hi"}],"max_tokens":5}'
```

### 6.4 关键代码位置（winnicott-chat.html）

| 功能 | 行号范围 |
|------|---------|
| CSS 样式 | 7-449 |
| HTML 结构 | 450-818 |
| API 路由配置 | 844-849 |
| i18n 字典 | 854-931 |
| 人物配置 | 932-1007 |
| `togglePersona()` 人物切换 | 1008-1065 |
| `sendMessage()` 主发送逻辑 | 1574-1785 |
| `runHealthCheck()` 线路检测 | 1478-1499 |
| `saveToHistory()` 历史保存 | 1390-1414 |
| `resetConversation()` 新对话 | 1567-1572 |
| `forwardMessages()` 转发 | 1346-1388 |
| 章节分隔逻辑 | 1872-1886 |

---

## 七、已知问题

1. **GitHub remote URL 硬编码 PAT 明文**（如 `https://mei-junhao:ghp_***@github.com/...`），属 P0 安全隐患，**需用户本人在 GitHub 后台轮换 PAT**；轮换后清理本地 `.git-credentials` 与 remote URL 明文。该明文未进入公开 git 历史。
2. **consultant-a 密码为前端明文校验**（meijunhao123 写在源码），仅软门禁、非真实鉴权；任何查看源码者均可获取。如需真正限制访问应改服务端鉴权。
3. `master-select.html` 已废弃删除，主页统一为 `index.html`；旧文档/链接若仍指向 master-select 属失效引用。
4. AI 督导 docx 解析依赖外部 JSZip CDN。
5. 温尼科特分享截图依赖 html2canvas，跨域图片仍可能触发 SecurityError（已有 `.catch` 兜底，失败时不阻断对话）。

---

## 八、待办事项

- [x] 创建 7 个缺失的知识库文件（freud/jung/klein/bion/rogers/beck/yalom）
- [x] AI 督导页面（原密码保护 + 整体印象 + 后续对话）
- [x] 大师真实照片（Wikipedia URL）
- [x] 主页设为 index.html（替代 master-select.html）
- [x] 新增 苏珊·约翰逊（EFT）大师
- [x] 全局 UI 优化（5 页注入 CSS 视觉层 Tier A/B/C）
- [x] 圆桌 / 大师 / 督导 三页加 10 轮自动打赏（温尼科特保持 15 轮）
- [x] 修复温尼科特分享截图 bug（背景错乱 / 桌面无法保存 / 二维码死链）
- [x] 修复圆桌「输入名字无法进入」「大师交流截断」bug
- [x] 取消 AI 督导密码 + 加免责声明
- [x] 作者链接统一改为 mei-personal-site
- [x] 新增 咨询师A 定制服务页（密码门 + 温度锁 60）
- [ ] **GitHub PAT 明文轮换 + 清理本地凭证（P0）**
- [ ] consultant-a 改为服务端鉴权（当前仅前端软门禁）
- [ ] 清理开发备份文件（backup-*/index-dev*/original-index.html/v4-*）
- [ ] 对话自动章节改为基于语义相似度
- [ ] 接入 adler / cangjie / nvwa 等待接入素材

---

## 九、变更记录

| 日期 | 变更内容 |
|------|---------|
| 2026-06-29 | 🚀 迁移到 GitHub Pages：`mei-junhao.github.io/winnicott-chat/`，URL 固定不再变 |
| 2026-06-29 | 部署生产环境（入口 master-select.html） |
| 2026-06-29 | 创建 7 个大师知识库文件（来源：Marvis skills 提炼） |
| 2026-06-29 | 创建 AI 督导页面 ai-supervisor.html（密码 MJH SHA-256） |
| 2026-06-29 | master-chat.html：删除"换大师"链接，返回指向 master-select |
| 2026-06-29 | winnicott-chat.html 保持 v4 原样不动 |
| 2026-06-29 | 架构确定：master-select 主页 → winnicott-chat 和 master-chat 同级 |
| 2026-06-29 | 从旧部署恢复完整 v4 源码 |
| 2026-06-29 | 创建 PROJECT.md 项目手册 |
| 2026-06-29 | **v4.1** ai-supervisor 大改：整体印象可折叠、字数统计、自动保存、历史面板 |
| 2026-06-29 | master-chat：新增三档温度模式、修复流式 bug、保存按钮、语言按钮移入设置面板 |
| 2026-06-29 | winnicott-chat：自动保存改为语义话题切换触发 + 三档温度模式支持 |
| 2026-06-29 | index.html：新增 mode-overlay 三档温度选择层 |
| 2026-07-06 | **v5.2** 主线稳定版；主页切到 index.html，master-select.html 废弃 |
| 2026-07-07 | 全部界面「了解作者」按钮链接统一替换为 `mei-junhao.github.io/mei-personal-site/`（76+77 文件字节级替换） |
| 2026-07-07 | ai-supervisor.html：取消密码门，进入区加免责声明「禁止将未脱敏的材料上传…不能替代真人督导」 |
| 2026-07-07 | 大师 / 圆桌 / 督导 三页加入 10 轮自动打赏（温尼科特保持 15 轮）；清理 master-chat 打赏死代码 |
| 2026-07-07 | 修复圆桌「输入名字无法进入」（`MASTERS.font` 字段语法错误致脚本崩溃）+ `.name-overlay` 默认隐藏双保险 |
| 2026-07-07 | 修复圆桌大师交流截断（`max_tokens` 200→400/600） |
| 2026-07-07 | 修复温尼科特分享截图 bug（截图移出可视区、`.catch`/try-catch 兜底、二维码 `fetch→blob` 同源化、桌面自动下载） |
| 2026-07-07 | 全局 UI 优化：5 个活动页注入 `<style id="ui-optimize">`（Tier A/B/C 视觉层，仅 CSS） |
| 2026-07-10 | 新增 咨询师A 定制服务页 `consultant-a.html`：复用 master-chat 界面（MASTERS 重赋值仅 consultantA），温度锁 60 不可调，密码门 meijunhao123（门面「本页面为定制服务，具体请联系开发者」）；首页圆桌下加「定制服务」入口；人格 `consultant-a-knowledge.md` |
| 2026-07-10 | 更新 PROJECT.md：整合 UI 优化 / 打赏节奏 / consultant-a / 圆桌 / 已知 PAT 安全议题等新情况；移除 master-select.html 失效引用；部署命令改为 subtree 分支强推 |
