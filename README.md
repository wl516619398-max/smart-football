# Project Athena

Project Athena 是一个深色科技风的足球数据分析与赛事信息平台，使用 Next.js、Supabase、可切换的 AI Provider 和足球数据 Provider。项目保留 Mock fallback，外部服务暂时不可用时不会阻塞基础页面。

## 技术栈

- Next.js 15 + App Router
- TypeScript
- Tailwind CSS
- Lucide React、Recharts
- Supabase PostgreSQL、Supabase Auth
- DeepSeek / OpenRouter AI Provider
- TheSportsDB、API-Football 与 Mock football Provider

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

## 环境变量

以 `.env.example` 为模板，在本地使用 `.env.local`，在 Vercel 使用 Project Settings → Environment Variables 配置。

### 必要的 Supabase 变量

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` 只能配置为服务端变量，不能使用 `NEXT_PUBLIC_` 前缀。

### AI Provider

```env
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openrouter/free
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_API_BASE_URL=https://api.deepseek.com
```

当前默认使用 OpenRouter；当 Provider 失败时，现有逻辑会继续尝试备用 Provider，并保留 Mock fallback。

### 足球数据 Provider

```env
FOOTBALL_DATA_PROVIDER=mock
FOOTBALL_API_PROVIDER=
FOOTBALL_API_KEY=
FOOTBALL_API_BASE_URL=
FOOTBALL_API_URL=
FOOTBALL_DATA_API_KEY=
FOOTBALL_DATA_API_BASE_URL=https://api.football-data.org/v4
FOOTBALL_DATA_COMPETITION=PL
FOOTBALL_LEAGUE_ID=39
FOOTBALL_SEASON=2024
THESPORTSDB_API_KEY=3
THESPORTSDB_LEAGUE_IDS=4328,4335,4331,4480
```

开发阶段可保持 `FOOTBALL_DATA_PROVIDER=mock`。启用真实 Provider 前，先配置对应 API Key；请求失败会自动回退到 Mock 数据。

### 同步任务

```env
CRON_SECRET=
MATCH_SYNC_SECRET=
```

生产环境的 `/api/cron/sync-matches` 使用 `CRON_SECRET`。旧版手动同步接口 `/api/matches/sync` 使用 `MATCH_SYNC_SECRET`，两者建议配置为不同的随机长字符串。

## Supabase 数据库

按文件名顺序执行 `supabase/migrations/` 中的 SQL migration。至少需要执行用户、比赛、AI缓存、分析次数和预测历史相关 migration，之后再部署依赖这些表的生产版本。

## Vercel 部署

1. 将项目提交并推送到 GitHub、GitLab 或 Bitbucket。
2. 在 Vercel 选择 **Add New Project**，导入项目仓库。
3. Framework Preset 选择 **Next.js**，Build Command 使用 `npm run build`。
4. 在 **Settings → Environment Variables** 中配置生产环境变量。建议先配置 Supabase、`CRON_SECRET`、AI Provider 以及选定的足球数据 Provider。
5. 在 Supabase 执行全部必要 migration 后，点击 **Deploy**。
6. 部署完成后，在 **Functions → Logs** 检查 API Route 和定时同步日志。
7. 使用生产域名验证 `/`、`/matches`、`/matches/{external_id}`、`/api/football` 和 `/api/cron/sync-matches`。

项目中的 `vercel.json` 已配置每日 UTC 00:00 调用 `/api/cron/sync-matches`，即北京时间 08:00。Vercel Cron 会携带 `CRON_SECRET` 对应的授权信息；也可以手动使用同样的 Bearer Header 测试。

PowerShell 手动测试示例：

```powershell
$headers = @{ Authorization = "Bearer $env:CRON_SECRET" }
Invoke-RestMethod -Method Post -Uri "https://你的域名.vercel.app/api/cron/sync-matches" -Headers $headers
```

## 主要路由

- `/`：首页赛事大厅、热门联赛和每日精选
- `/matches`：全部比赛列表
- `/matches/[external_id]`：比赛详情与 AI 分析
- `/recommend`：AI 推荐中心
- `/teams/[id]`：球队详情分析
- `/vip`：会员权益页面
- `/api/cron/sync-matches`：受保护的定时比赛同步接口

## 生产注意事项

- 不要提交 `.env.local`，该文件已被 `.gitignore` 忽略。
- 不要把服务端密钥写入客户端组件或以 `NEXT_PUBLIC_` 前缀配置。
- 生产构建前运行 `npm run lint` 和 `npm run build`。
- 外部 API 和 Supabase 暂不可用时，页面会使用已有 Mock fallback；这不代表生产数据同步已经成功，需要结合 Vercel Functions 日志确认。
