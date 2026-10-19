# 文创素材同步与接入记录

检查日期：2026-10-19（北京时间）。工作目录 `/workspace/beishangshanhe`，仓库 `fpqin66-bit/beishangshanhe`，本地分支 `main`。

检查时本地提交 `edfbb88`，远端 `main` 为 `f1fe78748458fc993cfa5a2b7592779484e27e64`。本地已有2D/3D未提交修改，未执行 pull、merge、reset、checkout 或丢弃修改。仅 fetch 远端对象，随后从该提交补入原先不存在的 `public/wenchuan/` 文件。分支仍为 main，未提交或推送本次修改。

## 实际图片与展品对应

所有下列原文件都在 `public/wenchuan/`，网页无损副本位于 `public/assets/wenchuan/`，扩展名统一为 `.webp`。

| 原文件 | 实际内容 | 应用位置 |
|---|---|---|
| beizi1.jpeg | 中心花卉、上下几何边饰随行杯 | 左前随行杯及详情 |
| bingxiangtie1.jpeg | 方形刺绣冰箱贴 | 前排左、中贴饰及详情主图（保留原有“繁花纹样贴饰”文案） |
| bingxiangtie2.jpeg | 花形刺绣冰箱贴 | 前排右侧两件贴饰、挂架装饰及详情第二原图 |
| fanbudai1.jpeg | 黑色花卉纹帆布包，含品牌文字和提带 | 左侧帆布包及详情 |
| shoujike1.jpeg | 手机壳正面、背面、侧面三视图 | 3D取中间背面，详情保留完整三视图 |
| wawa1.png | 胸前刺绣装饰娃娃，图片自带水印 | 娃娃详情第二原图，完整保留原图和水印 |
| wawa2.png | 蝴蝶结娃娃正面和背带背面，附英文视图文字 | 3D两个悬挂娃娃分别取正面、背面，详情展示完整双视图 |
| wenchuang1.png | 全套文创合照 | 抱枕、挂牌来自此图各自区域，尚无对应独立单品图 |
| yanzhao1.jpeg | 花鸟纹眼罩及带子 | 右前眼罩及详情 |
| yusan1.jpeg | 竖向折叠伞 | 前排横置，整图旋转90°且保持比例，详情保持原始方向 |
| guitai1.png | 带金框玻璃罩、网格架与红灯的整体柜台参考图 | 仅作空间与灯光参考，不当成单品图片 |

## 完整性核验

`.jpeg` 后缀的文件实际均为PNG编码，已逐张成功解码，未更名覆盖原文件。无损WebP副本尺寸、RGB像素与解码后的原图逐张完全一致。

| 原文件路径 | 尺寸 | 检查 |
|---|---|---|
| `public/wenchuan/beizi1.jpeg` | 2048×2048 | 原文件哈希一致；WebP解码像素一致 |
| `public/wenchuan/bingxiangtie1.jpeg` | 2048×2048 | 原文件哈希一致；WebP解码像素一致 |
| `public/wenchuan/bingxiangtie2.jpeg` | 2048×2048 | 原文件哈希一致；WebP解码像素一致 |
| `public/wenchuan/fanbudai1.jpeg` | 2048×2048 | 原文件哈希一致；WebP解码像素一致 |
| `public/wenchuan/guitai1.png` | 1472×1104 | 原文件哈希一致；WebP解码像素一致 |
| `public/wenchuan/shoujike1.jpeg` | 2304×1728 | 原文件哈希一致；WebP解码像素一致 |
| `public/wenchuan/wawa1.png` | 2304×1728 | 原文件哈希一致；WebP解码像素一致 |
| `public/wenchuan/wawa2.png` | 1472×1104 | 原文件哈希一致；WebP解码像素一致 |
| `public/wenchuan/wenchuang1.png` | 1472×1104 | 原文件哈希一致；WebP解码像素一致 |
| `public/wenchuan/yanzhao1.jpeg` | 2048×2048 | 原文件哈希一致；WebP解码像素一致 |
| `public/wenchuan/yusan1.jpeg` | 2048×2048 | 原文件哈希一致；WebP解码像素一致 |

`public/wenchuan/guitai` 只有1字节，是无效占位文件，不能解码为图片。除此之外11张图片均可读取。3个 `public/assets/textures/wenyang*-1.svg` 仍未提供，原有缺失提示和2D降级保持不变。

## 展示方式与修改文件

原始图片不重绘、不改色、不镜像。3D采用等比摄影切片：JSON明确取景区域，运行时仅遮掉与背景连通的中性棚拍底色，保留照片RGB；保留杯子白色部位。贴饰置于台面，袋子与抱枕在后，娃娃居中，保留12个陈列点位与全部原有文案/交互。照片不是完整三维扫描，无法提供未上传的真实侧面体积。

- `src/data/wenchuang.json`：素材路径、等比取景数据、正背视图和补充原图；文化文案及verified不变。
- `src/components/FirstPersonGallery/WenchuangAssets.tsx`：直接读取仓库素材、准备场景摄影纹理、保留本地合照导入功能。
- `src/components/FirstPersonGallery/photoCutout.ts`：背景透明遮罩与裁切，保留RGB。
- `src/components/FirstPersonGallery/PhotoArtifact.tsx`：替代几何示意造型的等比照片展品。
- `src/components/FirstPersonGallery/ProductTexture.ts`：摄影纹理与多视图、mipmap抗闪烁。
- `src/components/FirstPersonGallery/IslandCounter.tsx`：接入摄影展品和原图挂架装饰、调整灯光。
- `src/components/FirstPersonGallery/GalleryScene.tsx`：图片加载完成后更新台面接触阴影。
- `src/components/FirstPersonGallery/WenchuangPreview.tsx`、`src/styles/global.css`：原图切换按钮与样式。
- `scripts/audit.mjs`：允许新目录并检查场景图片实际存在。
- `tests/product-photos.spec.ts`：实图解码、保留区域RGB、全图录及补充原图加载检查；`tests/composite.spec.ts`、`tests/island.spec.ts`更新为仓库素材默认就绪状态。
- `ASSET_CHECKLIST.md`、`DEMO_GUIDE.md` 与本记录：同步实际素材状态和展示限制。
- 新增上述原文件及无损WebP副本；生成独立HTML预览，不生成ZIP。

## 最终验证

`npm run build`（内容检查、TypeScript、Vite与离线HTML）通过；10项图录/交互/素材检查通过。最后单独收紧雨伞棚拍灰底遮罩后，再次构建并通过3项相关复查：鼠标环绕及无Shader错误、离线展柜入口、所有图录和补充原图加载及遮罩RGB保留。实际截图已人工检查。未生成ZIP，预览HTML包含图片，可离线打开。
