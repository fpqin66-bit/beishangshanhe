import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import products from "../../data/wenchuang.json";
import { photoCanvas } from "./photoCutout";
import { assetUrl } from "./capability";
type ImageMap = Record<string, string>;
type AssetState = {
  images: ImageMap;
  sceneImages: ImageMap;
  loading: boolean;
  error: string;
  importPhoto: (file: File) => Promise<void>;
};
const Context = createContext<AssetState>({
  images: {},
  sceneImages: {},
  loading: false,
  error: "",
  importPhoto: async () => {},
});
type RuntimeWindow = Window & {
  __WENCHUANG_CROPS__?: ImageMap;
  __EXHIBITION_ASSETS__?: ImageMap;
};
export function cropComposite(image: HTMLImageElement) {
  const result: ImageMap = {};
  for (const product of products) {
    const [x, y, w, h] = product.crop;
    const canvas = document.createElement("canvas");
    const width = Math.max(1, Math.round(image.naturalWidth * w)),
      height = Math.max(1, Math.round(image.naturalHeight * h));
    const scale = Math.min(1, 900 / Math.max(width, height));
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw Error("浏览器无法裁切图片");
    context.drawImage(
      image,
      image.naturalWidth * x,
      image.naturalHeight * y,
      width,
      height,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    result[product.id] = canvas.toDataURL("image/webp", 0.9);
  }
  return result;
}
export function WenchuangAssetsProvider({ children }: { children: ReactNode }) {
  const [images, setImages] = useState<ImageMap>(
      () => (window as RuntimeWindow).__WENCHUANG_CROPS__ ?? {},
    ),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const [sceneImages, setSceneImages] = useState<ImageMap>({});
  const version = useRef(0);
  const decode = (url: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () =>
        reject(Error("无法读取图片，请选择完整的PNG、JPG或WebP合照。"));
      im.src = url;
    });
  const apply = (im: HTMLImageElement) => {
    if (Math.abs(im.naturalWidth / im.naturalHeight - 4 / 3) > 0.15)
      throw Error("请选择当前展示的完整4:3合照，避免裁切位置错位。");
    const result = cropComposite(im);
    (window as RuntimeWindow).__WENCHUANG_CROPS__ = result;
    setImages(result);
    setSceneImages(Object.fromEntries(products.flatMap(p => p.sceneViews.map((_, i) => [p.id + ":" + i, result[p.id]]))));
    setError("");
  };
  useEffect(() => {
    let alive = true;
    const generation = version.current;
    const cache = new Map<string, Promise<HTMLImageElement>>();
    const load = (name: string) => {
      if (!cache.has(name)) cache.set(name, decode(assetUrl(name)));
      return cache.get(name)!;
    };
    const failures: string[] = [];
    const run = async () => {
      const detail: ImageMap = {}, scene: ImageMap = {};
      await Promise.all(products.map(async p => {
        try {
          const im = await load(p.image);
          detail[p.id] = p.detailCrop ? photoCanvas(im, p.detailCrop, 0, false).toDataURL('image/webp', 1) : assetUrl(p.image);
          await Promise.all(p.sceneViews.map(async (v, i) => {
            const image = await load(v.image);
            scene[p.id + ':' + i] = photoCanvas(image, v.crop, v.rotate, true, v.backgroundSeeds, v.preserveWhite, v.backgroundThreshold).toDataURL('image/png');
          }));
        } catch { failures.push(p.image); }
      }));
      if (!alive || generation !== version.current) return;
      const imported = (window as RuntimeWindow).__WENCHUANG_CROPS__;
      setImages(imported ?? detail);
      setSceneImages(imported ? Object.fromEntries(products.flatMap(p => p.sceneViews.map((_, i) => [p.id + ':' + i, imported[p.id]]))) : scene);
      if (failures.length) setError('素材读取失败：' + [...new Set(failures)].join('、'));
    };
    void run();
    return () => { alive = false; };
  }, []);
  const importPhoto = async (file: File) => {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("请选择PNG、JPG或WebP图片。");
      return;
    }
    version.current++;
    setLoading(true);
    setError("");
    const url = URL.createObjectURL(file);
    try {
      apply(await decode(url));
    } catch (e) {
      setError(e instanceof Error ? e.message : "图片导入失败。");
    } finally {
      URL.revokeObjectURL(url);
      setLoading(false);
    }
  };
  return (
    <Context.Provider value={{ images, sceneImages, loading, error, importPhoto }}>
      {children}
    </Context.Provider>
  );
}
export const useWenchuangAssets = () => useContext(Context);
export function CompositeImport() {
  const { images, loading, error, importPhoto } = useWenchuangAssets();
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="composite-import">
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        aria-label="选择文创合照"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void importPhoto(file);
          e.target.value = "";
        }}
        style={{ display: "none" }}
      />
      <button onClick={() => input.current?.click()} disabled={loading}>
        {loading
          ? "正在裁切合照…"
          : Object.keys(images).length
            ? "更换文创合照"
            : "导入这张文创合照"}
      </button>
      <small role="status">
        {error ||
          (Object.keys(images).length
            ? "仓库实物图片已就绪 · 支持导入合照替换"
            : "选择完整合照后，自动呈现9类文创。")}
      </small>
    </div>
  );
}

export function WenchuangAssetsBridge({value,children}:{value:AssetState;children:ReactNode}){return <Context.Provider value={value}>{children}</Context.Provider>;}
