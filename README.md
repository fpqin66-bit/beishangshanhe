# 背上的山河
壮族背带文化数字叙事展。React + TypeScript + Vite，GSAP / ScrollTrigger、SVG、Canvas，无后端。

## 本地运行
需要 Node.js 20.19+ 或 22.12+（本环境验证 Node 24）。

```sh
npm ci --cache /workspace/.npm-cache
npm run dev
```

```sh
npm run build
npm run preview
```

五幕包含序章分镜、背带热点和生活场景、纹样观察问答、故事卷轴与文献阅读、1200×1600 PNG祝福卡。可键盘操作，支持小屏与减少动态效果设置，音频默认不启用。

## 内容管理
`src/data/` 的 exhibits、patterns、stories、sources JSON 管理展品、纹样、叙事和出处。`verified` 表示内容核验状态；`publishable` 控制故事是否可进入正式叙事。未核实展品只能以清晰标注的图像观察资料展示。艺术化改编必须明确类型，不能冒充史实。`npm run check:content` 在构建时自动执行。

素材来自用户提供的两份 Word 文档。当前已完成交互作品，尚未完成原始图版、文献及授权核验，不能宣称完成正式竞赛资料审查。详见 SOURCE_AUDIT.md。不得将文中的侗、苗、水等民族资料无差别归为壮族。

## 验证
```sh
CHROMIUM_PATH=/usr/bin/chromium npx playwright test
```

浏览器测试默认使用环境已有的 `/usr/bin/chromium`；其他机器通过 `CHROMIUM_PATH` 指向已安装的 Chromium。
