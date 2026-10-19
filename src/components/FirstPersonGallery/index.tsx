import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Canvas, useThree } from "@react-three/fiber";
import {
  ArrowLeft,
  ArrowRight,
  MousePointer2,
  Move,
  BookOpen,
  X,
} from "lucide-react";
import points from "../../data/gallery-points.json";
import products from "../../data/wenchuang.json";
import { PRODUCT_LAYOUT } from "./islandLayout";
import exhibits from "../../data/exhibits.json";
import patterns from "../../data/patterns.json";
import stories from "../../data/stories.json";
import { isMobileGallery } from "./capability";
import FirstPersonRig from "./FirstPersonRig";
import GalleryScene from "./GalleryScene";
import ExhibitDialog, { type Selection } from "./ExhibitDialog";
import "./gallery.css";
import { WenchuangAssetsProvider, CompositeImport } from "./WenchuangAssets";
class SceneBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
function ContextWatch({ onUnavailable }: { onUnavailable: () => void }) {
  const { gl } = useThree();
  useEffect(() => {
    const lost = (e: Event) => {
      e.preventDefault();
      onUnavailable();
    };
    gl.domElement.addEventListener("webglcontextlost", lost);
    return () => gl.domElement.removeEventListener("webglcontextlost", lost);
  }, [gl, onUnavailable]);
  return null;
}
export default function FirstPersonGallery({
  onExit,
  onUnavailable,
}: {
  onExit: () => void;
  onUnavailable: () => void;
}) {
  const requested = Number(
    (window as Window & { __GALLERY_PREVIEW_ZONE__?: number })
      .__GALLERY_PREVIEW_ZONE__ ??
      new URLSearchParams(location.search).get("zone") ??
      0,
  );
  const initialZone =
    Number.isInteger(requested) && requested >= 0 && requested < points.length
      ? requested
      : 0;
  const [active, setActive] = useState(initialZone),
    [destination, setDestination] = useState(initialZone),
    [travelToken, setTravelToken] = useState(0),
    [traveling, setTraveling] = useState(true),
    [walking, setWalking] = useState(false),
    [locked, setLocked] = useState(false),
    [mobile, setMobile] = useState(isMobileGallery),
    [selection, setSelection] = useState<Selection | null>(null),
    [resources, setResources] = useState<Record<string, string>>({}),
    [help, setHelp] = useState(initialZone !== 4),
    [notice, setNotice] = useState("");
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const onResource = useCallback(
    (key: string, status: string) =>
      setResources((r) => (r[key] === status ? r : { ...r, [key]: status })),
    [],
  );
  const onArrive = useCallback(() => setTraveling(false), []);
  const stop = useCallback(() => {
    if (document.pointerLockElement) document.exitPointerLock();
    setWalking(false);
  }, []);
  const open = useCallback(
    (s: Selection) => {
      restoreFocus.current = document.activeElement as HTMLElement;
      stop();
      setSelection(s);
      setHelp(false);
    },
    [stop],
  );
  useEffect(() => {
    const resize = () => {
      setMobile(isMobileGallery());
      stop();
    };
    const lock = () => {
      const value = document.pointerLockElement === canvas.current;
      setLocked(value);
      if (!value) setWalking(false);
    };
    const blur = () => stop();
    window.addEventListener("resize", resize);
    document.addEventListener("pointerlockchange", lock);
    window.addEventListener("blur", blur);
    const visibility = () => {
      if (document.hidden) stop();
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("pointerlockchange", lock);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", visibility);
      stop();
    };
  }, [stop]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        stop();
        setSelection(null);
      }
      if (
        e.code === "KeyE" &&
        !selection &&
        !(e.target instanceof HTMLElement && e.target.closest("input,textarea"))
      ) {
        open({ chapter: active });
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [active, open, selection, stop]);
  const travel = (i: number) => {
    stop();
    setSelection(null);
    setDestination(i);
    setTravelToken((v) => v + 1);
    setTraveling(true);
    setHelp(false);
  };
  const start = async () => {
    if (mobile || traveling || selection) return;
    try {
      await canvas.current?.requestPointerLock();
      if (document.pointerLockElement === canvas.current) {
        setWalking(true);
        setNotice("");
        setHelp(false);
      } else {
        setWalking(true);
        setHelp(false);
        setNotice("鼠标锁定不可用，已启用WASD＋按住拖拽视角。");
      }
    } catch {
      setWalking(true);
      setHelp(false);
      setNotice("鼠标锁定不可用，已启用WASD＋按住拖拽视角。");
    }
  };
  const complete = Object.values(resources).filter(
    (v) => v !== "loading",
  ).length;
  const story = stories.find((s) => s.publishable && s.frames.length)!;
  const total =
    new Set([
      story.frames[0].image,
      story.frames[1].image,
      story.frames[3].image,
      exhibits.image,
      exhibits.scenes[1].image,
      patterns[0].image,
    ]).size +
    new Set(PRODUCT_LAYOUT.map((p) => p.product)).size +
    patterns.length;
  const loaded = complete >= total;
  const failed = Object.entries(resources).filter(([, v]) =>
    ["missing", "invalid"].includes(v),
  );
  return (
    <WenchuangAssetsProvider>
      <div
        className="first-person-gallery"
        role="region"
        aria-label="第一人称3D展厅"
      >
        <div className="gallery-toolbar">
          <button
            onClick={() => {
              stop();
              onExit();
            }}
          >
            <ArrowLeft size={16} />
            返回叙事网页
          </button>
          <div>
            <strong>背上的山河</strong>
            <small>FIRST PERSON GALLERY / 第一人称展厅</small>
          </div>
          <button
            onClick={() => {
              stop();
              setHelp(!help);
            }}
            aria-label="操作说明"
            aria-expanded={help}
          >
            <BookOpen size={16} />
            <span>操作说明</span>
          </button>
        </div>
        <SceneBoundary onError={onUnavailable}>
          <Canvas
            shadows="soft"
            style={{ zIndex: 0 }}
            camera={{ position: [0, 1.6, 3], fov: 65, near: 0.08, far: 65 }}
            dpr={mobile ? 1 : [1, 1.5]}
            frameloop="demand"
            gl={{
              antialias: false,
              alpha: false,
              powerPreference: "low-power",
            }}
            onCreated={({ gl }) => {
              canvas.current = gl.domElement;
              gl.domElement.setAttribute("aria-label", "3D展馆画面");
              gl.domElement.tabIndex = 0;
            }}
            fallback={
              <div className="gallery-fallback">
                <p>WebGL不可用，请返回2D叙事。</p>
                <button onClick={onUnavailable}>返回2D</button>
              </div>
            }
          >
            <Suspense fallback={null}>
              <ContextWatch onUnavailable={onUnavailable} />
              <GalleryScene
                resources={resources}
                active={active}
                onOpen={open}
                onResource={onResource}
              />
              <FirstPersonRig
                area={active}
                destination={destination}
                travelToken={travelToken}
                walking={walking}
                mobile={mobile}
                blocked={!!selection}
                onArrive={onArrive}
                onChapter={setActive}
              />
              {selection && (
                <ExhibitDialog
                  key={
                    selection.chapter +
                    "-" +
                    selection.pattern +
                    "-" +
                    selection.product
                  }
                  selection={selection}
                  onClose={() => {
                    setSelection(null);
                    setTimeout(() => restoreFocus.current?.focus(), 0);
                  }}
                />
              )}
            </Suspense>
          </Canvas>
        </SceneBoundary>
        {!loaded && (
          <div className="gallery-loading" role="status">
            <strong>正在布置展厅</strong>
            <span>{Math.round((complete / total) * 100)}%</span>
            <progress value={complete} max={total} />
            <small>载入本地图片与SVG，缺失素材不会阻塞参观</small>
          </div>
        )}
        {locked && (
          <div className="gallery-crosshair" aria-hidden="true">
            +
          </div>
        )}
        <div className="gallery-current">
          <span>0{active} / 04</span>
          <h2>{points[active].title}</h2>
          <p>
            {mobile
              ? "移动端 · 点位参观"
              : locked
                ? "WASD 行走 · 鼠标环视 · E 查看 · Esc 解锁"
                : "拖拽观察 · 滚轮调整视野 · 点击展品查看资料"}
          </p>
        </div>
        {help && (
          <aside className="gallery-help">
            <button
              aria-label="关闭操作说明"
              className="gallery-help-close"
              onClick={() => setHelp(false)}
            >
              <X size={16} />
            </button>
            <span className="eyebrow">YOUR JOURNEY / 参观方式</span>
            <h3>沿着金线，走进山河。</h3>
            <p>
              {mobile
                ? "触摸底部五个章节按钮，平滑抵达各展区。移动端不启用键盘行走。"
                : "拖拽即可旋转视角，尾厅支持围绕独立展柜观察，滚轮调整视野。点击“开始WASD漫游”后用WASD或方向键行走；指针锁定受限时仍可拖拽。按E查看、Esc暂停。"}
            </p>
            <p>
              点击画框或“查看本区展品”阅读资料。纹样区可完成观察问答，尾厅可创作并保存祝福卡。
            </p>
            <small>
              人眼高度1.6米 · 无跳跃 · 走廊边界碰撞 · 未核实文化资料保留标记
            </small>
          </aside>
        )}
        {failed.length > 0 && (
          <details className="gallery-resource-warning">
            <summary>{failed.length} 项素材未就绪 · 参观可继续</summary>
            {failed.map(([key, status]) => (
              <p key={key}>
                {key.startsWith("svg")
                  ? "public/assets/textures/wenyang" +
                    (Number(key.slice(3)) + 1) +
                    "-1.svg"
                  : key}{" "}
                —{" "}
                {status === "invalid"
                  ? "文件不适合挤出或过于复杂"
                  : "未提供或加载失败"}
              </p>
            ))}
            <p>不生成替代素材。原图及资料仍可从展品面板查看。</p>
          </details>
        )}
        {notice && walking && (
          <p className="gallery-notice" role="status">
            {notice}
          </p>
        )}
        {active === 4 && <CompositeImport />}
        <div className="gallery-actions">
          {!mobile && (
            <button
              onClick={walking ? stop : start}
              disabled={traveling || !!selection}
            >
              {locked ? <MousePointer2 size={16} /> : <Move size={16} />}{" "}
              {walking
                ? locked
                  ? "解锁鼠标"
                  : "停止WASD漫游"
                : traveling
                  ? "正在前往展区…"
                  : "开始WASD漫游"}
            </button>
          )}
          <button onClick={() => open({ chapter: active })}>
            <BookOpen size={16} />
            {active === 4 ? "浏览岛台文创" : "查看本区展品"}
            <ArrowRight size={16} />
          </button>
        </div>
        <nav className="gallery-point-nav" aria-label="3D展区跳转">
          {points.map((p, i) => (
            <button
              key={p.id}
              aria-label={"前往" + p.title}
              onClick={() => travel(i)}
              className={active === i ? "active" : ""}
              aria-current={active === i ? "step" : undefined}
            >
              <span>0{i}</span>
              {p.title}
            </button>
          ))}
        </nav>
        <div className="gallery-privacy">
          {walking ? "漫游中" : "点位参观"} · 2D叙事随时可返回
        </div>
      </div>
    </WenchuangAssetsProvider>
  );
}
