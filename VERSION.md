# Winnicott Chat — 版本日志

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
