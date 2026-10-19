import { Suspense, useEffect, useMemo, useState } from "react";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import {
  LinearFilter,
  SRGBColorSpace,
  TextureLoader,
  Texture,
  Object3D,
} from "three";
import points from "../../data/gallery-points.json";
import exhibits from "../../data/exhibits.json";
import patterns from "../../data/patterns.json";
import stories from "../../data/stories.json";
import { assetUrl } from "./capability";
import Relief from "./Relief";
import IslandCounter from "./IslandCounter";
import type { Selection } from "./ExhibitDialog";
type Props = {
  resources: Record<string, string>;
  active: number;
  onOpen: (s: Selection) => void;
  onResource: (key: string, status: string) => void;
};
function Painting({
  name,
  onStatus,
}: {
  name: string;
  onStatus: (key: string, status: string) => void;
}) {
  const [texture, setTexture] = useState<Texture | null>(null);
  const [failed, setFailed] = useState(false);
  const { invalidate } = useThree();
  useEffect(() => {
    let alive = true;
    let loaded: Texture | undefined;
    onStatus(name, "loading");
    new TextureLoader().load(
      assetUrl(name),
      (t) => {
        loaded = t;
        if (!alive) {
          t.dispose();
          return;
        }
        t.colorSpace = SRGBColorSpace;
        t.minFilter = LinearFilter;
        t.generateMipmaps = false;
        t.anisotropy = 2;
        setTexture(t);
        onStatus(name, "ready");
        invalidate();
      },
      undefined,
      () => {
        if (alive) {
          setFailed(true);
          onStatus(name, "missing");
          invalidate();
        }
      },
    );
    return () => {
      alive = false;
      loaded?.dispose();
    };
  }, [name, onStatus, invalidate]);
  const ratio = texture
    ? (texture.image as HTMLImageElement).width /
      (texture.image as HTMLImageElement).height
    : 1.5;
  const width = Math.min(2.8, 2.1 * ratio),
    height = width / ratio;
  return texture ? (
    <mesh position={[0, 0, 0.065]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  ) : failed ? (
    <Html zIndexRange={[5, 0]} center>
      <span className="gallery-resource-label">图片暂不可用</span>
    </Html>
  ) : null;
}
function Frame({
  position,
  rotation = 0,
  children,
  onClick,
}: {
  position: [number, number, number];
  rotation?: number;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <group
      position={position}
      rotation={[0, rotation, 0]}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <mesh>
        <boxGeometry args={[3.1, 2.4, 0.09]} />
        <meshStandardMaterial
          color="#C6A36A"
          metalness={0.55}
          roughness={0.5}
        />
      </mesh>
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[3.02, 2.32, 0.02]} />
        <meshStandardMaterial color="#171719" roughness={0.9} />
      </mesh>
      {children}
    </group>
  );
}
function Spot({
  position,
  target,
}: {
  position: [number, number, number];
  target: [number, number, number];
}) {
  const aim = useMemo(() => new Object3D(), []);
  aim.position.set(...target);
  return (
    <>
      <primitive object={aim} />
      <spotLight
        position={position}
        target={aim}
        intensity={38}
        angle={0.7}
        penumbra={0.75}
        distance={15}
        decay={2}
        color="#ffe2b5"
      />
    </>
  );
}
export default function GalleryScene({
  active,
  onOpen,
  onResource,
  resources,
}: Props) {
  const story = stories.find((s) => s.publishable && s.frames.length)!;
  const images = [
    story.frames[0].image,
    exhibits.image,
    patterns[0].image,
    story.frames[1].image,
    patterns[2].image,
  ];
  const status = useMemo(
    () => (i: number, s: string) => onResource("svg" + i, s),
    [onResource],
  );
  return (
    <>
      <color attach="background" args={["#171719"]} />
      <fog attach="fog" args={["#171719", 13, 39]} />
      <ambientLight intensity={active === 4 ? 0.35 : 0.85} color="#b7a49b" />
      <hemisphereLight args={["#e7d8c0", "#26212a", active === 4 ? 0.32 : 0.6]} />
      <Spot
        position={active === 4 ? [-1, 3.7, -40] : [-0.7, 3.7, -active * 10]}
        target={active === 4 ? [0, 1.2, -41.8] : [-3.7, 1.6, -active * 10 - 2]}
      />
      <Spot
        position={active === 4 ? [1, 3.7, -43] : [0.7, 3.7, -active * 10 - 2]}
        target={active === 4 ? [0, 1.2, -41.8] : [3.7, 1.6, -active * 10 - 2]}
      />
      <mesh receiveShadow position={[0, -0.1, -20]}>
        <boxGeometry args={[8.2, 0.2, 52]} />
        <meshStandardMaterial color="#171719" roughness={0.82} />
      </mesh>
      <mesh position={[0, 4.1, -20]}>
        <boxGeometry args={[8.2, 0.2, 52]} />
        <meshStandardMaterial color="#171719" />
      </mesh>
      {[-4.1, 4.1].map((x) => (
        <mesh key={x} position={[x, 2, -20]}>
          <boxGeometry args={[0.2, 4, 52]} />
          <meshStandardMaterial
            color={x < 0 ? "#38252a" : "#232126"}
            roughness={0.93}
          />
        </mesh>
      ))}
      {[6.1, -46.1].map((z) => (
        <mesh key={z} position={[0, 2, z]}>
          <boxGeometry args={[8.2, 4, 0.2]} />
          <meshStandardMaterial color="#783B42" roughness={0.9} />
        </mesh>
      ))}
      {[-3.7, 3.7].map((x) => (
        <mesh key={x} position={[x, 0.005, -20]}>
          <boxGeometry args={[0.025, 0.01, 51]} />
          <meshBasicMaterial color="#C6A36A" />
        </mesh>
      ))}
      {points.map((p, i) => (
        <group key={p.id}>
          {i !== 4 && (
            <Frame
              position={p.exhibitPosition as [number, number, number]}
              rotation={Math.PI / 2}
              onClick={() => onOpen({ chapter: i })}
            >
              <Painting name={images[i]} onStatus={onResource} />
              <Html
                zIndexRange={[5, 0]}
                transform
                position={[0, -1.6, 0.1]}
                distanceFactor={4}
                style={{ pointerEvents: "auto" }}
              >
                <button
                  className="gallery-plaque"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpen({ chapter: i });
                  }}
                >
                  <span>0{i} / THE MOUNTAINS WE CARRY</span>
                  <strong>{p.title}</strong>
                  <small>
                    {i === 4 ? "创作数字祝福卡 ↗" : "查看展品与资料 ↗"}
                  </small>
                </button>
              </Html>
            </Frame>
          )}
          <group position={[0, 0, 3 - i * 10]}>
            <mesh position={[0, 3.9, 0]}>
              <boxGeometry args={[8, 0.12, 0.2]} />
              <meshStandardMaterial color="#783B42" />
            </mesh>
            {[-3.96, 3.96].map((x) => (
              <mesh key={x} position={[x, 2, 0]}>
                <boxGeometry args={[0.08, 4, 0.2]} />
                <meshStandardMaterial color="#783B42" />
              </mesh>
            ))}
            <Html
              zIndexRange={[5, 0]}
              transform
              position={[0, 3.3, -0.1]}
              distanceFactor={5}
            >
              <div className="gallery-zone-label">
                0{i} · {p.title}
              </div>
            </Html>
          </group>
          {i !== 2 && i !== 4 && (
            <Frame
              position={[3.72, 1.7, -2 - i * 10]}
              rotation={-Math.PI / 2}
              onClick={() => onOpen({ chapter: i })}
            >
              <Painting
                name={
                  i === 0
                    ? story.frames[1].image
                    : i === 1
                      ? exhibits.scenes[1].image
                      : i === 3
                        ? story.frames[3].image
                        : patterns[1].image
                }
                onStatus={onResource}
              />
            </Frame>
          )}
        </group>
      ))}
      <IslandCounter
        shadowVersion={Object.entries(resources).filter(([key, status]) => key.startsWith("product:") && status === "ready").length}
        active={active === 4}
        onOpen={onOpen}
        onResource={onResource}
      />
      {patterns.map((p, i) => (
        <Frame
          key={p.id}
          position={[3.72, 1.8, -19 + i * -3]}
          rotation={-Math.PI / 2}
          onClick={() => onOpen({ chapter: 2, pattern: i })}
        >
          {["missing", "invalid"].includes(resources["svg" + i]) && (
            <Html
              zIndexRange={[5, 0]}
              transform
              position={[0, 0, 0.11]}
              distanceFactor={4}
            >
              <div className="gallery-missing-relief">
                <span>SVG 素材待提供</span>
                <small>wenyang{i + 1}-1.svg</small>
                <p>可点击查看原图与题注</p>
              </div>
            </Html>
          )}
          <group position={[0, 0, 0.1]}>
            <Suspense fallback={null}>
              <Relief
                index={i}
                onStatus={status}
                onClick={() => onOpen({ chapter: 2, pattern: i })}
              />
            </Suspense>
          </group>
          <Html
            zIndexRange={[5, 0]}
            transform
            position={[0, -1.65, 0.1]}
            distanceFactor={4}
          >
            <button
              className="gallery-plaque"
              onClick={() => onOpen({ chapter: 2, pattern: i })}
            >
              <strong>{p.title}</strong>
              <small>SVG金属浮雕 · 查看图像与题注 ↗</small>
            </button>
          </Html>
        </Frame>
      ))}
    </>
  );
}
