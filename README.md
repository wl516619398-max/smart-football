# Project Athena

Project Athena 是一个深色科技风的足球赛事数据与 AI 赛前分析平台。项目使用统一的数据 Provider、Analysis Engine 和 Supabase 数据层，并保留 Mock fallback，适合先以 MVP 形式部署到 Vercel。

## 技术栈

- Next.js 15 + App Router
- TypeScript
- Tailwind CSS
- Lucide React、Recharts
- Supabase PostgreSQL / Auth
- DeepSeek、OpenRouter 和 Skill Analysis Provider
- API-Football / TheSportsDB / Mock Football Provider

## 本地启动

```bash
npm install
copy .env.example .env.local
npm run dev
```

打开 <http://localhost:3000>。

生产构建检查：

```bash
npm run lint
npm run build
npm run start
```

## 生产环境变量

在 Vercel 的 **Project Settings → Environment Variables** 中配置，Production、Preview、Development 按需分别设置。

### 站点与 Supabase

```env
NEXT_PUBLIC_APP_NAME=Project Athena
NEXT_PUBLIC_SITE_URL=https://your-project.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` 只允许作为服务端变量保存，绝不能使用 `NEXT_PUBLIC_` 前缀，也不要提交到 GitHub。

### AI Provider

```env
AI_PROVIDER=deepseek
ANALYSIS_PROVIDER=skill
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_API_BASE_URL=https://api.deepseek.com
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openrouter/free
```

AI Provider 失败时会按现有逻辑 fallback；没有 Key 时页面应保持可访问，但不会生成真实外部 AI 内容。

### 足球数据 Provider

```env
FOOTBALL_DATA_PROVIDER=api-football
FOOTBALL_API_PROVIDER=api-football
FOOTBALL_API_KEY=
FOOTBALL_API_URL=https://v3.football.api-sports.io
FOOTBALL_API_BASE_URL=https://v3.football.api-sports.io
FOOTBALL_LEAGUE_ID=39
FOOTBALL_SEASON=2025
```

如暂不配置真实额度，可使用：

```env
FOOTBALL_DATA_PROVIDER=mock
```

请求失败会自动回退到 Mock 数据。生产环境建议先确认 API 配额、Supabase 写入权限和 Vercel Function 日志。

### 定时任务与管理员接口

```env
CRON_SECRET=
MATCH_SYNC_SECRET=
ANALYSIS_ADMIN_SECRET=
```

请为这些密钥生成随机长字符串。`/api/cron/sync-matches` 使用 `CRON_SECRET`，手动比赛同步接口使用 `MATCH_SYNC_SECRET`，管理员分析接口使用 `ANALYSIS_ADMIN_SECRET`。

## Supabase 初始化

在 Supabase SQL Editor 中按文件名顺序执行 `supabase/migrations/` 下需要的 migration，至少包括比赛、用户、AI 分析缓存、预测历史和数据采集相关表。执行后再运行同步脚本或 Cron 接口。

## Vercel 部署

1. 将仓库推送到 GitHub、GitLab 或 Bitbucket。
2. 在 Vercel 选择 **Add New Project** 并导入仓库。
3. Framework Preset 选择 **Next.js**，Build Command 使用 `npm run build`。
4. 配置上面的 Production 环境变量，尤其是 Supabase、AI Provider、足球数据 Provider 和 `CRON_SECRET`。
5. 在 Supabase 执行所需 migration 后点击 Deploy。
6. 部署后检查：`/`、`/matches`、`/history`、`/matches/{external_id}`、`/share/{id}`。
7. 在 Vercel Functions 日志中确认 `/api/cron/sync-matches` 和 AI 接口状态。

项目中的 `vercel.json` 已配置每日 UTC 00:00 执行 `/api/cron/sync-matches`，对应北京时间 08:00。Vercel Cron 会携带配置的授权信息；也可以手动测试：

```powershell
$headers = @{ Authorization = "Bearer $env:CRON_SECRET" }
Invoke-RestMethod -Method Post -Uri "https://your-project.vercel.app/api/cron/sync-matches" -Headers $headers
```

## 分享页面

- `/share/{id}`：适合通过系统分享或复制链接打开的轻量比赛摘要页。
- `/matches/{external_id}`：完整比赛分析页。

## 安全检查

- 不要提交 `.env.local`、Service Role Key、AI Key 或 Football API Key。
- 只在服务端读取私密环境变量。
- 生产构建前运行 `npm run lint` 和 `npm run build`。
- 外部 API 失败时检查 Vercel Logs，并确认页面 fallback 是否符合预期。
