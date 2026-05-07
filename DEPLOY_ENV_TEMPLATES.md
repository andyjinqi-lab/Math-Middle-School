# 数学星球上线环境变量模板

目标主站：

```text
https://math.afinance.site
```

## 后端环境变量

主 API 和备 API 如果同时存在，必须使用同一套数据库和 JWT 密钥。

```text
PORT=3001
APP_ORIGIN=https://math.afinance.site,https://<你的预览域名>
JWT_SECRET=<同一套强随机密钥>
RESEND_API_KEY=<你的 Resend API Key>
MAIL_FROM=<已验证发件地址，例如 no-reply@afinance.site>
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<db>?sslmode=require
```

注意：

- `APP_ORIGIN` 可以用逗号分隔多个域名。
- `JWT_SECRET` 主备必须一致，否则登录态互不承认。
- `DATABASE_URL` 必须指向同一个数据库，否则用户数据会分叉。

## 前端环境变量

Cloudflare Pages / Netlify / 其他前端平台均可使用：

```text
VITE_API_BASE_URL=https://api-main.afinance.site
VITE_API_BACKUP_BASE_URL=https://api-backup.afinance.site
```

如果暂时只有一个 API，可以只填：

```text
VITE_API_BASE_URL=https://<你的正式 API 域名>
```

## 构建配置

```text
Build command: npm run build
Output / Publish directory: dist
```

## DNS

```text
math.afinance.site CNAME -> <前端平台默认域名>
```

## 验收顺序

1. `https://math.afinance.site` 可以打开
2. HTTPS 证书正常
3. 登录 / 注册正常
4. 练习提交正常
5. 错题本数据正常
6. 举一反三 BYOK API 设置可保存
7. 手机端访问正常
