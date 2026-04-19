# 数学星球上线变量模板（可直接复制）

以下按你的目标组织：  
- 最终域名：`cap.afinance.site`  
- 备案前入口：Cloudflare Pages / Netlify  
- 主备 API：Render 双实例（同库）

---

## 1) 后端（Render）变量模板

`math-api-main` 与 `math-api-backup` 都填同一组（除服务名外）：

```text
PORT=3001
APP_ORIGIN=https://cap.afinance.site,https://<你的cloudflare-pages域名>,https://<你的netlify域名>
JWT_SECRET=<同一串强随机密钥，主备必须一致>
RESEND_API_KEY=<你的resend_key>
MAIL_FROM=<已验证发件地址，如 no-reply@afinance.site>
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<db>?sslmode=require
```

注意：
- `APP_ORIGIN` 可逗号分隔多个域名（已支持）。
- `JWT_SECRET` 必须主备一致，否则登录态会互不认。
- `DATABASE_URL` 必须指向同一个库，才能保证数据一致。

---

## 2) 前端（Cloudflare Pages 主站）变量模板

```text
VITE_API_BASE_URL=https://<math-api-main域名>
VITE_API_BACKUP_BASE_URL=https://<math-api-backup域名>
```

Build 配置：

```text
Build command: npm run build
Output directory: dist
```

---

## 3) 前端（Netlify 备站）变量模板

```text
VITE_API_BASE_URL=https://<math-api-main域名>
VITE_API_BACKUP_BASE_URL=https://<math-api-backup域名>
```

Build 配置：

```text
Build command: npm run build
Publish directory: dist
```

`netlify.toml` 已在仓库中配置好 SPA 路由回退。

---

## 4) 备案前后切换策略（不丢数据）

### 备案前（现在）

- 用户从 `pages.dev` / `netlify.app` 访问  
- API 都写入同一 `DATABASE_URL`

### 备案通过后

- 只做 DNS：`cap.afinance.site` 指向现有前端发布平台  
- 前端可重新发版（或仅改域名配置）  
- **API 与数据库不迁移、不切库**

这样注册账号、登录态、练习记录、错题数据都持续有效。

---

## 5) 上线后验收清单（建议顺序）

1. 打开主 API 健康检查  
   - `https://<math-api-main域名>/api/health`
2. 打开备 API 健康检查  
   - `https://<math-api-backup域名>/api/health`
3. 检查返回中的 `storage` 是否为 `postgresql`
4. 主站注册账号 -> 登录 -> 做题 3~5 道 -> 错题本确认
5. 切到备站同账号登录，确认数据一致
6. 临时让主 API 不可用，确认前端可自动走备 API
7. 恢复主 API 后复测登录与做题

---

## 6) 推荐的密钥生成方式

本地 PowerShell 生成 64 字节 JWT 密钥：

```powershell
[Convert]::ToBase64String((1..64 | ForEach-Object {Get-Random -Minimum 0 -Maximum 256}))
```

