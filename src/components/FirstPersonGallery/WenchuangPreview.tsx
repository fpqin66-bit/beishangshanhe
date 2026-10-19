import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, PenLine } from "lucide-react";
import products from "../../data/wenchuang.json";
import { useWenchuangAssets, CompositeImport } from "./WenchuangAssets";
import { assetUrl } from "./capability";
import Blessing from "../../sections/Blessing";
export default function WenchuangPreview({
  initialProduct = 0,
  onSources,
}: {
  initialProduct?: number;
  onSources: () => void;
}) {
  const [selected, setSelected] = useState(
      Math.max(0, Math.min(products.length - 1, initialProduct)),
    ),
    [editing, setEditing] = useState(false);
  const { images } = useWenchuangAssets();
  const view = useRef<HTMLDivElement>(null);
  const choose = (index: number) => {
    setSelected(index);
    setAlternate(null);
    view.current?.closest("dialog")?.scrollTo({ top: 0, behavior: "instant" });
  };
  const p = products[selected];
  const [alternate, setAlternate] = useState<string | null>(null);
  return (
    <div className="wenchuang-view" ref={view}>
      <div hidden={editing}>
        <div className="wenchuang-preview-grid">
          <div className="wenchuang-large-image" key={p.id}>
            {images[p.id] ? (
              <img src={alternate ?? images[p.id]} alt={p.name} />
            ) : (
              <div className="composite-empty">
                从这张合照中展示文创
                <CompositeImport />
              </div>
            )}
            <span>
              当代文创设计参考 · {String(selected + 1).padStart(2, "0")} /{" "}
              {products.length}
            </span>
          </div>
          <div className="wenchuang-copy">
            <span className="eyebrow">CONTEMPORARY DESIGN / 文创图录</span>
            <h3>{p.name}</h3>
            <h4>纹样来源</h4>
            <p>{p.source}</p>
            <h4>设计说明</h4>
            <p>{p.description}</p>
            <p className="disclaimer">
              verified: {String(p.verified)} ·{" "}
              {p.verified ? "已核实" : "来源与授权待核"}
            </p>
            <button
              className="primary wenchuang-create"
              onClick={() => setEditing(true)}
            >
              <PenLine size={16} />
              创作我的数字祝福卡
            </button>
            <small>选择底色和纹样，写下祝福，导出 1200 × 1600 PNG。</small>
          </div>
        </div>
        {p.photos.length > 1 && <div className="wenchuang-photo-views" aria-label="实物图片视角">
          {p.photos.map((image, i) => <button key={image} onClick={() => setAlternate(assetUrl(image))} aria-label={`查看原图${i + 1}`}><img src={assetUrl(image)} alt={`${p.name} · 原图${i + 1}`} /></button>)}
        </div>}
        <div className="wenchuang-switch">
          <button
            aria-label="上一件文创"
            onClick={() =>
              choose((selected + products.length - 1) % products.length)
            }
          >
            <ArrowLeft size={17} />
          </button>
          <span aria-live="polite">
            {selected + 1} / {products.length} · {p.name}
          </span>
          <button
            aria-label="下一件文创"
            onClick={() => choose((selected + 1) % products.length)}
          >
            <ArrowRight size={17} />
          </button>
        </div>
        <div className="wenchuang-categories" aria-label="文创种类">
          {products.map((item, i) => (
            <button
              key={item.id}
              onClick={() => choose(i)}
              aria-pressed={selected === i}
              className={selected === i ? "active" : ""}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>
      <div hidden={!editing}>
        <button className="text-button" onClick={() => setEditing(false)}>
          <ArrowLeft size={15} />
          返回文创图录
        </button>
        <div className="wenchuang-editor">
          <Blessing sources={onSources} />
        </div>
      </div>
    </div>
  );
}
