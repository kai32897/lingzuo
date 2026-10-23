# 灵作 · MADE WITH AI

把 AI 做的东西，玩起来。玩一局、追一集、读两页、学一手。

灵作是一个 AI 作品分享社区的演示项目：每个作品都可以带配方，每个人都能接力。站点名、分类名、分类色集中配置，方便替换。

公网演示：https://lingzuo-ai.netlify.app

## 当前阶段：阶段五（功能扩展与上线准备）

### 已完成

- **浏览**：首页、发现、四个分类、统一搜索、工具库
- **体验**：游戏详情 + 试玩、短剧详情 + 竖屏连刷（一次滑动只切一集）、小说详情 + 阅读器、教程详情、工具详情、动态详情、话题 / 合集 / 挑战
- **发布**：
  - 三步发布器：内容 → 配方 → 发布设置
  - 四种作品类型，提示词 / 工作流 / 教程步骤均可选
  - 封面上传，常用尺寸：16:9、4:3、1:1、3:4、9:16；作品卡和详情会按所选比例显示，避免裁掉图片
  - 游戏：站内文字试玩、上传 HTML 单文件、外部试玩链接、游戏截图
  - 短剧：按集上传 MP4 / WebM，可加集 / 删集；详情和连刷真实播放，播放器右下角全屏按钮直达沉浸连刷
  - 小说：写作工作台、多章节、字数统计、剪贴板粘贴、封面
  - 教程：文字 / 图片 / 视频内容块，步骤可留空
  - 草稿自动保存；发布后进入首页今日上新、搜索、分类、个人主页和我的
- **个人**：公开主页、我的工作台、消息、设置、关于 / 规范 / AI 声明
- **作品管理**：已发布作品可从详情页再次编辑，标题、封面、正文、配方同步更新，链接和浏览 / 喜欢数据保持不变；删除先移入回收站
- **动态管理**：自己的社区动态可编辑或删除，保留原 ID、发布时间、点赞和评论
- **评论管理**：自己的评论可编辑或删除，编辑后会标记「已编辑」；支持两级回复串，删除根评论会同时清理下面的回复；评论点赞可取消，也可举报
- **删除体验**：作品详情右侧作品管理面板提供大号「编辑 / 删除」；删除有独立确认弹窗，先移入回收站，视频和封面暂时保留；剧集编辑中的删除按钮带文字
- **回收站**：作品 / 动态软删除后可恢复；只有「彻底删除」才清理视频、封面、教程图片和 HTML 文件
- **版本历史**：每次编辑已发布作品自动保留上一版，最多 8 版；可查看并恢复旧版，恢复前当前内容也会留档
- **分享**：复制链接、系统分享、三种文案、3:4 / 9:16 海报（含封面图）下载
- **风格**：纸刊 / 夜刊 / 薄荷 / 白页四套主题；顶栏调色盘、页脚或设置可切换，本地保存
- **配方库**：`/recipes` 按类型 / 工具筛选、搜索提示词和工作流、收藏配方
- **PWA / 离线**：manifest、图标、Service Worker；生产构建首次加载后可离线打开，缓存版本更新后自动切换
- **错误兜底**：页面渲染失败时显示「重新加载 / 回首页」，不再白屏
- **上线基础（B2）**：40 条种子详情页预渲染元信息、18 张作品独立 OG 图、sitemap / robots、canonical；详情页动态写入 description、og:title、og:description、og:type、og:url、og:image
- **基础埋点**：page_view / search / share_copy / share_poster / work_publish / work_update / recipe_save，写入本地 `lz:analytics`，并兼容 `window.plausible` 与 `dataLayer`
- **性能**：首页之外的路由按需加载，主包约 428 KB（gzip 145 KB）

## 视觉风格

- 纸刊：默认暖白纸底
- 夜刊：深色纸面，适合低光阅读
- 薄荷：冷绿纸面，更轻的实验感
- 白页：纯白底、黑字与细线，最干净的版本

切换方式：桌面顶栏调色盘循环切换、页脚风格按钮、设置 → 外观风格。风格只改界面，不影响作品数据。

### 素材与数据

- 图片 / 视频 / HTML 存在浏览器 IndexedDB（`src/lib/media.ts`），作品只保存素材 ID
- 上限：图片 12MB、视频 300MB、HTML 2MB
- 没有后端、登录、真实 AI API、云存储或转码；换设备 / 清空站点数据后素材不会保留
- 演示版二维码为占位，正式版才生成短链二维码

### 主要路由

```text
/                     首页
/search               统一搜索
/discover             发现
/games /dramas /novels /tutorials /tools
/recipes              配方库
/games/:slug/play     游戏试玩
/dramas/:slug/watch   短剧连刷
/novels/:slug/read/:n 阅读器
/create               发布入口
/create/:type         三步发布器
/create/post          发布动态
/u/:handle            个人主页
/me                   我的工作台
/trash                回收站
/works/:id/versions   作品版本历史
/notifications        消息
/settings             设置
/about /guidelines /ai-policy
```

## 开发

```bash
pnpm install
pnpm dev
pnpm build
```

当前演示地址：`http://127.0.0.1:5173`

## 部署

```bash
# 复制 .env.example 为 .env.production.local，并填写真实域名
pnpm build           # 构建 + 预渲染 40 条种子详情页 + sitemap / robots
pnpm preview         # 本地检查 dist
pnpm og              # 种子作品增加 / 改名后重新生成 OG 图
```

- Vercel：`vercel.json` 已配置 SPA 回退 + `cleanUrls`
- Netlify：已部署到 https://lingzuo-ai.netlify.app；`netlify.toml` / `public/_redirects` 已配置
- Netlify 站点已关闭 Team SSO，公开可访问；`VITE_SITE_URL` 已写入站点环境变量
- 产物：`dist/`，含 `og/`（18 张作品图）、`sitemap.xml`、`robots.txt`、预渲染目录和对应的 `.html` 文件
- `sitemap` / `robots` / canonical 使用 `VITE_SITE_URL`；不配置时会回落到本地地址
- 预渲染只写入正确的 title、description、OG、canonical 和 SPA 挂载点，正文仍由前端渲染；这是当前无后端版本的边界
- 用户新发布的作品不会生成独立 OG，统一使用 `og-default.png`

## 设计系统

- 暖白纸底 `#F4F0E6`、墨黑 `#15130F`、电蓝 `#2F4BFF`
- 分类色：游戏 `#D8FF3E`、短剧 `#FF5A3C`、小说 `#B9A6FF`、教程 `#FFC24B`、工具 `#8FE3FF`、动态 `#FFD6E7`
- 标题得意黑（本地打包），正文 Noto Sans SC / PingFang SC，阅读器 Noto Serif SC，配方 JetBrains Mono
- 断点：390 / 768 / 1024 / 1440

## 说明

- 种子内容在 `src/data/seed.ts`；发布数据层在 `src/lib/userContent.ts`
- 作品、作者、互动数据均为虚构示例
- 不使用未授权 IP、真实人物肖像或隐私信息
- 当前构建无后端；B2 已完成静态 SEO、预渲染元信息、OG、sitemap 与基础埋点，生产版还需登录、数据库、云存储和审核
