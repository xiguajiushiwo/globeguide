# Cloudflare 部署

## 现有资源

| 资源 | 配置 |
| --- | --- |
| 正式地址 | https://wayella.com/ |
| www | https://www.wayella.com/，跳转到主域名并保留路径和查询参数 |
| Pages 项目 | `globeguide`，生产分支 `main` |
| 原站地址 | https://globeguide.pages.dev/，保留访问 |
| 数据库 | D1 `globeguide-beta`，绑定名 `DB` |
| 配置 | `apps/edge/wrangler.jsonc` |

品牌名和基础设施标识不必相同。不要为了改名而新建数据库或替换已有 D1 ID。

## 发布步骤

在仓库根目录安装依赖、生成 Prisma Client，完成 README 中的检查并执行 `pnpm build`。然后在 `apps/edge` 执行：

```sh
pnpm exec wrangler login
pnpm exec wrangler d1 migrations list globeguide-beta --remote
```

如有新迁移，先审阅数据影响并记录 D1 恢复点，再执行：

```sh
pnpm exec wrangler d1 migrations apply globeguide-beta --remote
```

确认 `apps/web/out/index.html` 和 `_worker.js` 都存在，再发布：

```sh
pnpm exec wrangler pages deploy ../web/out --project-name globeguide --branch main
```

未提交的工作区发布需明确检查差异后加 `--commit-dirty=true`。普通 GitHub 推送只运行 CI，不自动部署。

## 密钥、邮件与初始化

在 `apps/edge` 使用 `pnpm exec wrangler pages secret put <NAME> --project-name globeguide` 逐项录入密钥，不写入仓库：

| 名称 | 用途 |
| --- | --- |
| `AUTH_SECRET` | 会话令牌 HMAC |
| `CODE_HMAC_KEY` | 验证码及限流键 HMAC |
| `MAIL_API_KEY` | 当前 Resend 邮件集成的 API key |
| `MAIL_FROM` | 已验证的发件地址 |

2026-11-05 已启用生产邮件：Resend 已验证 `wayella.com`，区域为 Tokyo（`ap-northeast-1`），发件人为 `Wayella <noreply@wayella.com>`。专用 API key 仅有该域名的 Sending access，保存在 Cloudflare Pages 的 production Secret `MAIL_API_KEY` 中；`MAIL_FROM` 同样配置在生产环境。密钥不写入源码或本地运维记录。

Cloudflare 中的邮件 DNS 记录如下，TTL 均为自动；两个 CNAME 必须使用 DNS only：

| 类型 | 名称 | 内容 |
| --- | --- | --- |
| TXT | `resend._domainkey` | Resend 域名详情页提供的 DKIM 公钥 |
| CNAME | `rsend` | `rsend-apne1.forge.rmta.net` |
| CNAME | `send` | `send.forge.rmta.net` |
| TXT | `_dmarc` | `v=DMARC1; p=none;` |

DMARC 当前为观察策略，不要求收件方拒绝伪造邮件。以上记录用于发送邮件；此配置未开通 `@wayella.com` 收件邮箱。以后重建发信域名或更换服务时，以服务商当时提供的记录为准。

更新 Pages Secret 后需要重新部署。`GET /api/auth/config` 的 `registrationAvailable` 和 `passwordResetAvailable` 应均为 `true`；这只说明发信参数已配置，实际投递还需从网站发出验证码并查看 Resend 的 Delivered 状态。2026-11-05 已通过正式网站的找回密码页面验证投递，注册、验证码及密码重置流程的 7 项测试通过。验证码只使用一次、10 分钟有效，测试用 `MAIL_SINK` 不部署到生产。

首次创建管理员使用 `apps/edge/scripts/bootstrap-admin.mjs --remote`。通过环境变量提供 `ADMIN_BOOTSTRAP_EMAIL`、`ADMIN_BOOTSTRAP_PASSWORD`（16–128 字符）、可选 `ADMIN_BOOTSTRAP_NAME`，并设置 `ADMIN_BOOTSTRAP_CONFIRM=globeguide-beta`。脚本仅在没有管理员时插入；密码不要放入命令历史或文件。

`seed-social-demo.mjs` 需要显式的 `DEMO_SEED_CONFIRM=globeguide-beta`，属于演示数据工具，不是每次发布的步骤。

## 域名与 HTTPS

两个域名已加入 Pages 自定义域名。Cloudflare DNS 配置：

| 类型 | 名称 | 目标 | 代理 |
| --- | --- | --- | --- |
| CNAME | `@` | `globeguide.pages.dev` | 已代理 |
| CNAME | `www` | `globeguide.pages.dev` | 已代理 |

TTL 自动，证书由 Cloudflare 管理。2026-11-02 已验证域名状态为 active。不同域名的 Cookie 和 localStorage 不互通：新域名需重新登录，旧行程可从原站导出后导入，地点收藏尚无自动迁移。

## 检查与回滚

发布后检查首页、攻略、地图、个人中心、创作、通知、商城、站点地图、公开 API 和匿名权限；确认 D1 绑定、邮件能力、HTTPS 和 www 跳转。

保存本次与上一版本部署 ID，应用回滚使用 Pages 部署历史。数据库恢复单独评估，因为恢复旧 D1 会影响发布后的用户写入。恢复书签与运维记录保存在私有归档，不作为源码附件提交。
