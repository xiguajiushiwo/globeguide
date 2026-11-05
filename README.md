# Wayella

**看见世界，让世界看见你。**

*See the world. Share yours.*

Wayella 是一个从旅行出发的内容社区：查找目的地和实用攻略，把喜欢的地点排成行程，再分享旅途中的故事与发现。

**[访问 Wayella →](https://wayella.com/)** · [日本攻略](https://wayella.com/guides/japan/) · [世界地图](https://wayella.com/map/) · [旅行社区](https://wayella.com/stories/)

> 项目处于早期内测阶段，原名 GlobeGuide。产品已更名为 Wayella；GitHub 仓库、工作区包名和 Cloudflare 项目沿用 `globeguide`，以保持现有部署和数据兼容。源码仓库为私有，线上网站可公开访问。

## 这个项目可以做什么

| 场景 | 当前能力 |
| --- | --- |
| 发现目的地 | 世界地图、国家首都与中国城市目录，中英文地点搜索，东京、巴黎、纽约城市指南 |
| 阅读实用攻略 | 日本总攻略、机场／住宿／交通／预约等专题、逐日路线与动漫景点地图；伊朗文化与旅行准备资料 |
| 规划旅行 | 收藏地点、编辑行程、安排停靠顺序、日本路线模板、JSON 导入与导出 |
| 发布旅行内容 | Guide 与 Moment、草稿、提交审核、内容管理；支持图片、视频和直播间链接 |
| 社区互动 | 点赞、帖子收藏、关注、评论与回复、表情、图片链接和语音评论、私信及群聊 |
| 管理个人账号 | 邮箱验证码注册、邮件找回密码、公开资料、个人中心、互动通知、密码修改、举报、拉黑及黑名单管理 |
| 交易探索 | 发布旅行相关商品、查看商品并提交购买意向 |

## 当前边界

- **邮箱注册与密码找回已开放**：通过 Resend 从 `noreply@wayella.com` 发送 8 位验证码，10 分钟有效；设有重发间隔、请求限流与错误次数限制。2026-11-05 已验证生产环境邮件投递；服务额度或收件方过滤可能影响后续送达。
- **媒体目前以链接为主**：尚未接入图片／视频文件上传、转码和自建直播推流；评论中的语音录制是基础实现，表情包入口目前是内置表情。
- **商城尚未接入支付**：当前提交的是购买意向，没有在线扣款、结算或物流系统。
- **地点收藏与旅行行程保存在浏览器**：暂不跨设备或跨域名同步；行程可导出备份。账号、帖子和社交数据存储在 Cloudflare D1。
- **攻略是编辑资料，不是实时承诺**：保留来源和查阅日期；签证、票价、开放状态和安全提醒需要出发前复核。伊朗内容当前包含暂缓非必要旅游的提醒。

## 技术架构

```text
浏览器 → wayella.com → Cloudflare Pages
                         ├─ Next.js 静态页面、图片和地图
                         └─ /api/* → Pages Worker → Cloudflare D1

可选地理服务：NestJS + Fastify → Prisma → PostgreSQL / PostGIS
```

前端使用 **Next.js、React、TypeScript、MapLibre GL**；线上账号与社区 API 使用 **Cloudflare Workers 和 D1**。仓库通过 **pnpm workspace + Turborepo** 管理，用 **Vitest 和 Playwright** 验证。

`apps/api` 是独立的地理服务，保留自己的接口和测试；当前 Pages 网站不依赖它运行。

## 快速开始

需要 Node.js 22+、pnpm 11 和此私有仓库的 GitHub 访问权限。

```sh
git clone https://github.com/xiguajiushiwo/globeguide.git
cd globeguide
pnpm install --frozen-lockfile
pnpm --filter @globeguide/api prisma:generate
pnpm --filter @globeguide/web dev
```

打开 **http://127.0.0.1:3000/**。此模式用于开发页面、地图和攻略；账号、发帖及社交接口需要使用完整本地预览：

```sh
pnpm build
pnpm --filter @globeguide/edge db:migrate:local
```

将 `apps/edge/.dev.vars.example` 复制为同目录的 `.dev.vars`，然后运行：

```sh
pnpm preview
```

完整预览同样使用 3000 端口，请先停止前面的 Next.js 开发服务。本地预览使用本地 D1，不会写入生产数据库；邮件验证码仍需要配置邮件服务。

## 项目结构

```text
apps/
  web/          页面、组件、攻略内容、静态资源与浏览器测试
  edge/         生产 API、D1 迁移、账号与社区逻辑
  api/          可选的 NestJS 地理服务与 PostgreSQL 模型
packages/
  domain/       地点目录、共享类型、校验与行程规则
bin/            私有仓库安装和环境检查 CLI
scripts/        仓库文件及文档链接检查
test/           CLI 测试
docs/           开发、部署、架构、内容来源和维护说明
```

## 验证与协作

```sh
pnpm check:repo
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --filter @globeguide/web exec playwright install chromium
pnpm --filter @globeguide/web test:e2e
```

GitHub Actions 在推送和 Pull Request 时执行仓库检查、类型检查、测试、构建及桌面／手机浏览流程。**推送 GitHub 不会自动部署网站**，生产发布使用 Wrangler 手动执行。

| 文档 | 内容 |
| --- | --- |
| [开发指南](docs/development.md) | 本地 D1、可选 PostgreSQL、浏览器测试、CLI 和生成文件 |
| [部署指南](docs/deployment.md) | Cloudflare Pages、域名、密钥、迁移、发布与回滚 |
| [架构与功能边界](docs/architecture.md) | 模块职责、数据存储、认证、内容审核与后续方向 |
| [内容与第三方来源](docs/content-and-attribution.md) | 攻略维护规则、地图数据和图片许可 |
| [仓库维护](docs/maintenance.md) | 文件保留与清理规则 |

## English

**Wayella is a travel community for discovering places, planning journeys, and sharing stories.** The beta combines destination guides, interactive maps, personal itineraries, creator tools, and community features. Visit **[wayella.com](https://wayella.com/)**. Media uploads, live streaming infrastructure, payments, and cross-device itinerary sync are not yet available; production email registration and password recovery await mail-service configuration.
