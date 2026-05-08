# 腾讯云服务器部署 Math

目标是让 Math 参照 CPA 的部署方式运行：

- DNS：`math.afinance.site` 使用 A 记录指向 `124.223.10.239`
- 前端：nginx 从服务器本地 `/opt/math/app/dist` 提供静态文件
- 发布：服务器执行 `/opt/math/app/deploy.sh`，流程与 CPA 的 `/opt/cpa/app/deploy.sh` 基本一致
- 后端 API：继续使用 Render 的 `math-api-main` 和 `math-api-backup`

## 1. 服务器目录

```bash
mkdir -p /opt/math
cd /opt/math
git clone https://github.com/andyjinqi-lab/Math-Middle-School.git app
cd /opt/math/app
```

如果仓库已经存在：

```bash
cd /opt/math/app
git pull origin main
```

## 2. 前端生产环境变量

在 `/opt/math/app/.env.production` 写入：

```bash
VITE_API_BASE_URL=https://math-api-main.onrender.com
VITE_API_BACKUP_BASE_URL=https://math-api-backup.onrender.com
```

这点和 CPA 的实际效果一致：前端页面在自己的服务器上，登录/注册 API 仍然请求 Render。

## 3. nginx 站点配置

把仓库里的模板复制到 nginx 配置目录：

```bash
cp /opt/math/app/deploy/nginx-math.afinance.site.conf /etc/nginx/conf.d/math.afinance.site.conf
nginx -t
```

如果证书还没创建，先临时注释掉模板里的 `listen 443` server 块，保留 80 端口，等证书生成后再恢复。

## 4. 证书

如果服务器使用 certbot：

```bash
certbot --nginx -d math.afinance.site
nginx -t
systemctl reload nginx
```

## 5. 第一次构建

```bash
cd /opt/math/app
chmod +x deploy.sh
./deploy.sh
```

## 6. DNS 切换

确认 nginx 和证书都准备好后，再到 DNSPod 修改：

```text
主机记录：math
记录类型：A
记录值：124.223.10.239
TTL：600
```

同时删除或暂停原来的：

```text
math CNAME math-middle-school.pages.dev
```

同一个主机记录不能同时保留 CNAME 和 A。

## 7. 验收

```bash
curl -I https://math.afinance.site
curl https://math-api-main.onrender.com/api/health
curl https://math-api-backup.onrender.com/api/health
```

预期：

- 首页响应头里 `Server` 变成 `nginx`
- 页面标题仍然是 `数学星球｜初中数学同步练习系统`
- 登录/注册能正常完成
- Render API health 返回 `{"ok":true,"storage":"postgresql",...}`
