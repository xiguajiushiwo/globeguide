# GlobeGuide 全球旅行指南

GlobeGuide 是可公开浏览的全球旅行指南内测版。首页保留东京、巴黎、纽约的深度编辑指南，同时提供全球交互地图、31 个中国大陆省级中心城市，以及香港、澳门和台北入口。登录不是浏览前置条件；登录后可发布攻略或旅行日常，公开内容需经过审核。

## 先看这里

| 你是谁 | 如何使用 |
| --- | --- |
| 内测用户 | 打开下方的 Cloudflare Pages 地址即可使用，不需要下载代码、安装 Node.js 或配置数据库。 |
| 获授权的开发协作者 | 使用下方的一条 npm 命令，通过已授权的 GitHub 账号获取私有代码并安装依赖。 |

**内测地址：[globeguide.pages.dev](https://globeguide.pages.dev/)。** 网页已部署并通过主要浏览器流程验收。当前 `http://127.0.0.1:3000/` 只在开发者自己的电脑上可用，不能作为发给内测用户的地址。

**数据限制：收藏和行程仍保存在当前浏览器。** 账号、会话和创作者帖子保存在 Cloudflare D1；收藏和行程暂不随账号跨设备同步。清除浏览器网站数据可能导致它们丢失。换设备前，请先导出行程文件，再到新浏览器导入。内测版不提供预订、付款或 AI 旅行建议。交通、票价等可能变化的信息请以页面链接的官方来源为准。

**邮件限制：** 当前没有配置真实发件域名或事务邮件服务。公网环境没有配置邮件发送时，注册和密码重置会明确返回“邮件服务尚未启用”，不会伪造已发送验证码。部署 Resend（或兼容服务）并验证发件域名后，再设置 `MAIL_API_KEY` 与 `MAIL_FROM` 才能开放真实注册。自动化测试可注入仅测试用的 `MAIL_SINK`，该绑定不应部署到公网。

GitHub 仓库及可安装源码保持**私有**。内测网页部署后可由持有网址的人访问，但不会开放源码。

## 协作者一条命令安装

准备条件：拥有私有仓库 [`xiguajiushiwo/globeguide`](https://github.com/xiguajiushiwo/globeguide) 的访问权限；本机已安装 Git、Node.js 22 或更新版本，以及 Corepack 或 pnpm 11。先为 Git 配置 GitHub HTTPS 登录，可使用 `gh auth login` 加 `gh auth setup-git`，或 Git Credential Manager。不要把访问令牌写进命令或仓库 URL。

在准备放置项目的目录运行（PowerShell，已在 Windows 验证）：

```powershell
$env:GIT_CONFIG_COUNT='1'; $env:GIT_CONFIG_KEY_0='url.https://github.com/.insteadOf'; $env:GIT_CONFIG_VALUE_0='ssh://git@github.com/'; npm exec --yes --package=git+https://github.com/xiguajiushiwo/globeguide.git -- gbg init globeguide
```

部分 npm/Git 组合会把 GitHub HTTPS 包地址改走 SSH；命令前面的 Git 映射确保当前 PowerShell 会话使用已配置的 HTTPS 凭据。该命令经 GitHub 授权获取 CLI，克隆私有仓库到 `./globeguide`，然后执行 `pnpm install --frozen-lockfile`。它**不会向公开 npm 仓库发布源码**；`gbg` 是私有 Git 包提供的命令，并非公开的 `npm install gbg` 包。若目标目录已经存在，命令会拒绝覆盖。

已配置 GitHub SSH 密钥、且 HTTPS 克隆也已授权的协作者，可直接使用跨平台简写：

```sh
npm exec --yes --package=git+https://github.com/xiguajiushiwo/globeguide.git -- gbg init globeguide
```

安装后检查本地环境：

```sh
cd globeguide
node bin/gbg.mjs doctor
```

`doctor` 检查 Node.js、Git、Corepack/pnpm，以及 `127.0.0.1:5432` 上的 PostgreSQL 端口；不会读取或打印密码。远程数据库或其他端口需单独检查。若 npm Git 安装在本机环境中不可用，可执行 `gh repo clone xiguajiushiwo/globeguide`，进入项目目录后运行 `corepack pnpm install --frozen-lockfile`。

## 本地开发

Web 使用 Next.js 静态导出；生产账号和创作者 API 是同源 Cloudflare Pages Advanced Worker + D1。既有 API 使用 NestJS/Fastify、Prisma 和 PostgreSQL/PostGIS，供后续地理服务开发。部署后的 Web 内测版不依赖开发者电脑或本地 API；开发旧 API 时才需要 PostgreSQL 和与其版本匹配的 PostGIS 扩展。

1. 安装 PostgreSQL 和 PostGIS，创建 `globeguide` 数据库及用户，以管理员身份在该数据库启用 `postgis` 扩展。首个迁移也会执行 `CREATE EXTENSION IF NOT EXISTS postgis`。
2. 将仓库根目录的 `.env.example` 复制为 `apps/api/.env`，把 `replace-me` 换成自己的数据库密码；密码如含特殊字符，需要做 URL 编码。`.env` 已被 Git 忽略。
3. 在仓库根目录生成 Prisma Client、执行迁移并导入三个城市的初始数据：

```sh
corepack pnpm --filter @globeguide/api prisma:generate
corepack pnpm --filter @globeguide/api prisma:migrate
corepack pnpm --filter @globeguide/api prisma:seed
```

分别在两个终端启动 Web 和 API：

```sh
corepack pnpm --filter @globeguide/web dev
```

```sh
corepack pnpm --filter @globeguide/api dev
```

本地 Web 地址是 `http://127.0.0.1:3000/`；API 健康检查是 `http://127.0.0.1:3001/v1/health`。API 从 `apps/api/.env` 读取配置。API 停止时，Web 内测版的精选指南、搜索和浏览器本地数据仍可使用。

## 检查质量

在仓库根目录执行：

```sh
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

`pnpm test` 包含 CLI、领域和 API 测试。API 端到端测试可单独运行 `corepack pnpm --filter @globeguide/api test:e2e`。Web 生产构建将静态文件输出到 `apps/web/out`。

静态站点的桌面和手机浏览器流程可在构建后运行；CI 也会执行同一检查：

```sh
corepack pnpm --filter @globeguide/web test:e2e
```

## 发布 Cloudflare Pages 内测版

发布内容是 `apps/web/out` 中的静态 Web 文件。协作者在已授权的本地仓库中执行：

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm --filter @globeguide/web build
corepack pnpm --filter @globeguide/edge build
npx wrangler login
npx wrangler d1 migrations apply globeguide-beta --remote --config apps/edge/wrangler.jsonc
npx wrangler pages deploy apps/web/out --project-name globeguide --branch main --commit-dirty=true
```

Pages 项目 `globeguide` 已创建并部署在上方内测地址，无需再次执行 `pages project create`。`apps/edge/wrangler.jsonc` 将 `DB` 绑定到专用的 `globeguide-beta` D1，不会修改其他数据库。先设置生产密钥（不要写入仓库）：

```sh
npx wrangler pages secret put AUTH_SECRET --project-name globeguide
npx wrangler pages secret put CODE_HMAC_KEY --project-name globeguide
# 配置真实发件服务后才设置：
npx wrangler pages secret put MAIL_API_KEY --project-name globeguide
npx wrangler pages secret put MAIL_FROM --project-name globeguide
```

首次部署后，用受控终端创建管理员。邮箱从环境变量读取，密码不会写入脚本或 Git；`ADMIN_BOOTSTRAP_CONFIRM` 是防误操作确认值：

```powershell
$env:ADMIN_BOOTSTRAP_EMAIL='your-admin@example.com'
$env:ADMIN_BOOTSTRAP_PASSWORD=Read-Host 'Admin password (16+ characters)'
$env:ADMIN_BOOTSTRAP_CONFIRM='globeguide-beta'
node apps/edge/scripts/bootstrap-admin.mjs --remote
Remove-Item Env:ADMIN_BOOTSTRAP_PASSWORD,Env:ADMIN_BOOTSTRAP_CONFIRM
```

当前通过 Wrangler 手动发布，推送 GitHub 不会自动更新线上网页。仓库仍为私有；Cloudflare 只接收构建后的静态站点和 Worker。不要上传 `apps/api/.env`、数据库备份或源码访问凭据。每次发布后检查搜索、目的地、地图归属、故事审核、账号错误状态、桌面和手机布局、CI 通过，以及 GitHub 仓库仍显示为私有。

## 项目结构

- `apps/web`：面向旅行者的 Web 内测版。
- `apps/api`：版本化 API、Prisma 和 PostGIS 迁移。
- `packages/domain`：共享的地点与行程规则。
- `docs/superpowers/specs/2026-10-19-globeguide-platform-design.md`：长期平台设计。
- `docs/superpowers/specs/2026-10-20-globeguide-beta-design.md`：本次内测范围和限制。

不要提交个人行程导出文件、数据库凭据或真实用户信息。浏览器本地存储并非备份，重要行程应导出留存。

## English quick start

Invited testers can use the hosted Web URL above. Authorized GitHub collaborators can run the PowerShell `npm exec` command in this README, then follow the local database and development steps. The source repository remains private; saved data is browser-local and does not sync between devices.
