import { useState } from "react";
import { Html } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import { Modal, Photo } from "../UI";
import WenchuangPreview from "./WenchuangPreview";
import {useWenchuangAssets,WenchuangAssetsBridge} from "./WenchuangAssets";
import exhibits from "../../data/exhibits.json";
import patterns from "../../data/patterns.json";
import stories from "../../data/stories.json";
import sources from "../../data/sources.json";
export type Selection = { chapter: number; product?: number; pattern?: number };
export default function ExhibitDialog({
  selection,
  onClose,
}: {
  selection: Selection;
  onClose: () => void;
}) {
  const { camera } = useThree();
  const wenchuangAssets=useWenchuangAssets();
  const anchor = camera.position
    .clone()
    .add(camera.getWorldDirection(new Vector3()));
  const [p, setP] = useState(selection.pattern ?? 0),
    [answer, setAnswer] = useState(""),
    [frame, setFrame] = useState(0),
    [showSources, setShowSources] = useState(false);
  const story = stories.find((s) => s.publishable && s.frames.length)!;
  const pattern = patterns[p];
  const title = showSources
    ? "资料与核实状态"
    : selection.chapter === 4
      ? "续 · 把祝福带走"
      : selection.chapter === 2
        ? pattern.title
        : selection.chapter === 1
          ? exhibits.title
          : story.title;
  return (
    <Html
      fullscreen
      position={anchor}
      calculatePosition={(_, __, size) => [size.width / 2, size.height / 2]}
      zIndexRange={[1000, 1001]}
      style={{ pointerEvents: "none" }}
    >
      <WenchuangAssetsBridge value={wenchuangAssets}><div className="gallery-dialog-root" style={{ pointerEvents: "auto" }}>
        <Modal title={title} onClose={onClose}>
          <div className="gallery-dialog-content">
            {selection.chapter === 4 && (
              <div hidden={showSources}>
                <WenchuangPreview
                  initialProduct={selection.product}
                  onSources={() => setShowSources(true)}
                />
              </div>
            )}
            {showSources ? (
              <>
                <button
                  className="text-button"
                  onClick={() => setShowSources(false)}
                >
                  返回展品
                </button>
                {sources.map((s) => (
                  <article key={s.id}>
                    <h3>{s.title}</h3>
                    <p>{s.type}</p>
                    <p>{s.note}</p>
                    <p className="disclaimer">{s.status}</p>
                  </article>
                ))}
              </>
            ) : selection.chapter === 4 ? null : selection.chapter === 2 ? (
              <>
                <div className="gallery-pattern-tabs" aria-label="纹样选择">
                  {patterns.map((v, i) => (
                    <button
                      key={v.id}
                      className={p === i ? "active" : ""}
                      onClick={() => {
                        setP(i);
                        setAnswer("");
                      }}
                    >
                      {v.title}
                    </button>
                  ))}
                </div>
                <div className="pattern-detail">
                  <div>
                    <Photo name={pattern.image} alt={pattern.title} />
                  </div>
                  <div>
                    <span className="eyebrow">观察—猜测—揭示</span>
                    <h3>它更接近哪类视觉形态？</h3>
                    <div className="quiz">
                      {["花卉", "鸟兽", "几何构图"].map((a) => (
                        <button
                          key={a}
                          className={answer === a ? "active" : ""}
                          onClick={() => setAnswer(a)}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                    {answer && (
                      <div className="answer" role="status">
                        <strong>
                          {answer === pattern.kind
                            ? "观察得很仔细。"
                            : "换一个角度再看。"}{" "}
                          本图观察重点：{pattern.kind}。
                        </strong>
                        <p>{pattern.description}</p>
                      </div>
                    )}
                    <h4>工艺与形态</h4>
                    <p>{pattern.craft}</p>
                    <h4>来源与题注</h4>
                    <p>{pattern.attribution}</p>
                    <p className="disclaimer">
                      verified: {String(pattern.verified)} ·{" "}
                      {pattern.verified
                        ? "已核实"
                        : "待考证 · 仅作图像观察资料"}
                    </p>
                  </div>
                </div>
              </>
            ) : selection.chapter === 1 ? (
              <div className="pattern-detail">
                <div>
                  <Photo name={exhibits.image} alt={exhibits.title} />
                </div>
                <div>
                  {exhibits.hotspots.map((h) => (
                    <article key={h.label}>
                      <h3>{h.label}</h3>
                      <p>{h.text}</p>
                    </article>
                  ))}
                  <p className="disclaimer">
                    verified: {String(exhibits.verified)} · 待考证 ·
                    设计稿图像参考
                  </p>
                </div>
              </div>
            ) : (
              <>
                <p className="disclaimer">
                  {story.type} · 非历史记录 · verified: {String(story.verified)}
                </p>
                <Photo
                  name={story.frames[frame].image}
                  alt={story.frames[frame].title}
                  className="gallery-story-photo"
                />
                <h3>{story.frames[frame].title}</h3>
                <p aria-live="polite">{story.frames[frame].text}</p>
                <div className="gallery-story-buttons">
                  <button
                    onClick={() => setFrame(frame - 1)}
                    disabled={frame === 0}
                  >
                    上一幕
                  </button>
                  <span>
                    {frame + 1} / {story.frames.length}
                  </span>
                  <button
                    onClick={() => setFrame(frame + 1)}
                    disabled={frame === story.frames.length - 1}
                  >
                    下一幕
                  </button>
                </div>
              </>
            )}
            {!showSources && (
              <div className="gallery-source-note">
                <button
                  className="text-button"
                  onClick={() => setShowSources(true)}
                >
                  查看资料来源
                </button>
                <p className="disclaimer">
                  文化内容来自现有 JSON；未核实民俗故事不予展示。
                </p>
              </div>
            )}
          </div>
        </Modal>
      </div></WenchuangAssetsBridge>
    </Html>
  );
}
