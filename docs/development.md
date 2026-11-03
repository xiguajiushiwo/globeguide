# 开发指南

## 安装与页面开发

使用 Node.js 22+ 和根目录 `package.json` 指定的 pnpm 11：

```sh
pnpm install --frozen-lockfile
pnpm --filter @globeguide/api prisma:generate
pnpm --filter @globeguide/web dev
```

http://127.0.0.1:3000/ 提供页面热更新；Next.js 开发服务器不包含生产 Pages Worker 的 `/api/*` 接口。

## 完整 Pages 本地预览

将 `apps/edge/.dev.vars.example` 复制为同目录的 `.dev.vars`，然后执行：

```sh
pnpm build
pnpm --filter @globeguide/edge db:migrate:local
pnpm preview
```

地址同样为 http://127.0.0.1:3000/，先停止同端口的 Next.js 服务。修改代码后需重新构建。本地数据保存在 `apps/edge/.wrangler/state`，普通清理不删除这个目录。`--local` 迁移不会触及生产 D1。

预览不会自动创建管理员或发送邮件。账号流程测试使用内存 SQLite 和测试邮件接收器；真实邮件配置见 [部署指南](deployment.md)。示例密钥仅供本地使用。

## 可选 NestJS API

只有开发 `apps/api` 时需要 PostgreSQL 和 PostGIS。创建 `globeguide` 数据库和用户，以具备权限的数据库账号启用 `postgis` 扩展。将根目录 `.env.example` 复制为 `apps/api/.env` 并填写连接信息。

```sh
pnpm --filter @globeguide/api prisma:generate
pnpm --filter @globeguide/api prisma:migrate
pnpm --filter @globeguide/api prisma:seed
pnpm --filter @globeguide/api dev
```

健康检查：http://127.0.0.1:3001/v1/health 。运行 `pnpm --filter @globeguide/api openapi` 可生成 `apps/api/openapi/openapi.json`，该文件不提交 Git，接口定义以控制器代码为准。

## 测试与生成文件

根目录 `pnpm check:repo`、`pnpm lint`、`pnpm typecheck`、`pnpm test` 和 `pnpm build` 是提交前检查。浏览器测试：

```sh
pnpm --filter @globeguide/web exec playwright install chromium
pnpm --filter @globeguide/web test:e2e
```

浏览器测试默认端口 4173，可用 `PLAYWRIGHT_PORT` 修改；已有 Edge 的 Windows 环境可设置 `PLAYWRIGHT_CHANNEL=msedge`，CI 使用 Chromium。预览和测试共用锁定的 Wrangler，不依赖全局 `npx`。

- Web 开发／构建命令从 `maplibre-gl` 包复制 Worker、source map 和许可文本，地图地址保持为 `/maplibre-gl-worker.js`。
- 根目录 `pnpm build` 先构建 Web，再将 Edge `_worker.js` 写入 `apps/web/out`。Edge 任务禁用 Turbo 缓存，避免 Web 恢复缓存后遗漏 Worker。
- `.next`、`.turbo`、`out`、`dist`、测试报告、TypeScript 缓存和 OpenAPI JSON 都可重新生成。

`bin/gbg.mjs` 保留 `gbg init <directory>` 和 `gbg doctor` 协作入口；PostgreSQL 是可选检查。GitHub 访问由已有 Git 凭据处理，不把令牌放进命令、源码或仓库 URL。
