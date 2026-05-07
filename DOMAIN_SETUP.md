# math.afinance.site 域名接入清单

## 正式入口

- 主站入口：`https://math.afinance.site`
- 根域名：`https://afinance.site` 可暂不改动，也可后续跳转到 `https://math.afinance.site`

## 推荐 DNS 记录

如果前端部署在 Cloudflare Pages：

```text
Type: CNAME
Name: math
Target: <你的 Cloudflare Pages 默认域名，例如 xxx.pages.dev>
Proxy: Proxied
```

如果前端部署在 Netlify：

```text
Type: CNAME
Name: math
Target: <你的 Netlify 默认域名，例如 xxx.netlify.app>
```

添加后，在对应平台后台添加自定义域名：

```text
math.afinance.site
```

等待平台签发 HTTPS 证书，证书完成后再正式对外使用。

## 后端 CORS 白名单

后端环境变量 `APP_ORIGIN` 至少包含：

```text
https://math.afinance.site
```

如果保留预览站，也一起放进去：

```text
APP_ORIGIN=https://math.afinance.site,https://<你的-pages.dev>,https://<你的-netlify.app>
```

否则登录、注册、保存练习记录可能会被浏览器 CORS 拦截。

## 前端 API 环境变量

正式部署时，前端平台环境变量建议为：

```text
VITE_API_BASE_URL=https://api-main.afinance.site
VITE_API_BACKUP_BASE_URL=https://api-backup.afinance.site
```

如果 API 暂时还没有绑定自定义域名，可以先填当前 Render / Railway / Supabase Edge Function 等平台的 HTTPS 地址。

## 上线验证

1. 打开 `https://math.afinance.site`
2. 确认 HTTPS 正常，没有证书警告
3. 注册新账号
4. 登录后完成 1 道练习
5. 确认错题本 / 成长页有数据
6. 刷新页面，确认不会 404
7. 用手机访问，确认布局正常
