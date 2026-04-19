# 数学星球（Shanghai Edition）

面向上海初中生的数学练习平台前端（React + Vite + Tailwind）。

## 本地开发

```bash
cd "E:\Trae Projects\Math\web"
npm install
npm run dev
```

后端本地启动：

```bash
cd "E:\Trae Projects\Math\web\server"
npm install
npm run dev
```

## 生产构建

```bash
npm run build
```

产物目录：`dist`

## 主站 + 备站部署

详细见：

- [DEPLOY_MAIN_BACKUP_GUIDE.md](./DEPLOY_MAIN_BACKUP_GUIDE.md)
- [DEPLOY_ENV_TEMPLATES.md](./DEPLOY_ENV_TEMPLATES.md)

核心思路：

- 前端主站：Cloudflare Pages
- 前端备站：Netlify
- 后端主备：Render 双实例
- 前端支持 API 自动主备切换（主失败自动走备）
