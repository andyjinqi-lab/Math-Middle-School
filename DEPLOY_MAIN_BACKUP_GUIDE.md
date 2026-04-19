# 数学星球部署方案（按 CPA 思路修正版）

## 目标（与你的原始需求一致）

- 域名：`afinance.site`
- 最终主站：`cap.afinance.site`（备案通过后启用）
- 备案未通过期间：走海外备站（Cloudflare / Netlify）
- **无论前端落在主站还是备站，用户注册/登录/学习数据必须一致，不受切站影响**

---

## 一、先明确一个关键点

如果后端仍是“每台服务本地 JSON 存储”，就无法保证主备一致。  
因为主 API 和备 API 各写各的文件，数据天然会分叉。

所以要满足你的目标，必须使用：

1. **统一数据库（单一真相源）**：PostgreSQL（可用 Supabase PG / Render PG）
2. API 主备都连同一库（或只保留一套 API）
3. JWT_SECRET、邮件配置等保持一致

---

## 二、推荐架构（最稳妥）

### 1) 前端层

- 备案前：
  - 入口可为 `xxx.pages.dev`（Cloudflare）
  - 可同时保留 Netlify 备份入口
- 备案后：
  - `cap.afinance.site` CNAME 到 Cloudflare Pages（或你最终主站平台）

> 前端只是“壳”，切前端域名不影响数据，只要 API 与数据库不变。

### 2) API 层

- 主 API：`math-api-main`（Render）
- 备 API：`math-api-backup`（Render，可选）
- 两者都连接同一个 PostgreSQL

### 3) 数据层

- 一个 PostgreSQL 库（统一 users / attempts / wrongbook 等表）
- 任何前端入口、任何 API 实例都写入同一库

---

## 三、备案前后“无感切换”操作

### 阶段 A：备案中（现在）

1. 前端部署到 Cloudflare Pages（可再保留 Netlify 作为备）
2. 前端环境变量：

```text
VITE_API_BASE_URL=https://<主API域名>
VITE_API_BACKUP_BASE_URL=https://<备API域名>
```

3. API 层连统一 PostgreSQL
4. 开放 CORS 白名单包含：
   - 备案前前端域名（pages.dev / netlify.app）
   - 将来的 `https://cap.afinance.site`

### 阶段 B：备案通过后

1. 只改 DNS：让 `cap.afinance.site` 指向现有前端发布平台
2. 前端重新发版（若需要）并把主访问入口切到 `cap.afinance.site`
3. API 和数据库不迁移（保持原样）

结果：用户账号、密码、错题记录、学习数据全部延续。

---

## 四、和当前项目的差异（需要你确认）

当前 `web/server/index.js` 仍是本地 JSON 存储。  
这适合本地开发，不适合你这个“主备一致”目标。

下一步建议：

1. 把 auth + attempts 持久层改为 PostgreSQL
2. 提供初始化 SQL 与迁移脚本
3. 再做一次主备切换演练（断主 API 自动走备 API）

---

## 五、环境变量建议

### 前端（Cloudflare / Netlify）

```text
VITE_API_BASE_URL=https://api-main.afinance.site
VITE_API_BACKUP_BASE_URL=https://api-backup.afinance.site
```

### 后端（Render）

```text
PORT=3001
APP_ORIGIN=https://cap.afinance.site,https://<pages.dev域名>,https://<netlify域名>
JWT_SECRET=<同一套强随机密钥>
RESEND_API_KEY=<你的resend key>
MAIL_FROM=<已验证发件地址>
DATABASE_URL=postgresql://...
```

---

## 六、结论（对你这次澄清的直接回应）

你要的不是“单纯双部署”，而是“**切域名不切数据**”。  
正确方案是：**前端可切，API可主备，但数据库必须唯一且持续不变**。

