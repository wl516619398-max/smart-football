# Project Athena

Project Athena 是一个深色科技风的 AI 足球赛事分析平台 MVP，帮助用户快速查看比赛预测、比分分析、球员数据、xG 指标和体彩玩法数据分析参考。

当前版本使用 Mock Data 和浏览器 localStorage 模拟用户、收藏、VIP 与浏览记录状态，不连接数据库、真实 API、认证服务或支付系统。

## 技术栈

- Next.js 15
- React 19
- TypeScript
- App Router
- Tailwind CSS
- shadcn/ui 风格基础组件
- Lucide React
- Recharts

## 本地启动

~~~bash
npm install
npm run dev
~~~

默认访问 [http://localhost:3000](http://localhost:3000)。

## 生产构建

~~~bash
npm run lint
npm run build
npm run start
~~~

npm run start 会启动 Next.js 生产服务器。部署到 Vercel 时，平台会自动识别 Next.js 项目并执行生产构建。

## 环境变量

复制 .env.example 为 .env.local，再按实际环境补充变量：

~~~env
NEXT_PUBLIC_APP_NAME=Project Athena
~~~

当前没有真实 API，因此不需要额外的密钥配置。

## 页面路由

- /：首页、AI 今日精选、焦点比赛和 VIP 入口
- /matches：比赛列表
- /match/[id]：比赛详情、AI 分析、收藏和分享
- /ai：AI 足球赛事推荐
- /leagues：联赛数据
- /players：球员分析
- /login：MVP 登录页面
- /profile：个人中心、会员状态和浏览记录
- /favorites：收藏比赛中心
- /vip：VIP 会员权益与 Mock 升级

## 目录结构

~~~text
app/             App Router 页面、路由和全局样式
components/      公共组件、首页组件、比赛组件和用户组件
data/            Mock 比赛与球员数据
types/           TypeScript 领域类型
lib/             用户状态、存储和通用工具
public/          静态资源
~~~

## Vercel 部署

1. 将项目推送到 GitHub、GitLab 或 Bitbucket。
2. 在 Vercel 中选择 Add New Project。
3. 导入项目仓库。
4. Framework Preset 选择 Next.js。
5. 使用默认构建设置，或确认 Build Command 为 npm run build。
6. 添加 .env.example 中需要的环境变量。
7. 点击 Deploy。

本项目没有自定义服务器配置，适合直接使用 Vercel 的 Next.js Runtime。
