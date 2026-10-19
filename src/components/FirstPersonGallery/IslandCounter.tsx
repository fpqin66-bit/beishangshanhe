import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Html, Environment, Lightformer, ContactShadows } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { Mesh, Object3D, type Group } from "three";
import products from "../../data/wenchuang.json";
import { ISLAND, PRODUCT_LAYOUT } from "./islandLayout";
import { useProductTexture } from "./ProductTexture";
import PhotoArtifact, { photoDimensions } from "./PhotoArtifact";
import type { Selection } from "./ExhibitDialog";
const gold = { color: "#C6A36A", roughness: 0.38, metalness: 0.8 };
function CounterSpot({ x, z }: { x: number; z: number }) {
  const target = useMemo(() => new Object3D(), []);
  target.position.set(x * 0.4, 1.3, ISLAND.z + z * 0.2);
  return (
    <>
      <primitive object={target} />
      <spotLight
        position={[x, 3.6, ISLAND.z + z]}
        target={target}
        intensity={x < 0 ? 24 : 12}
        castShadow={x < 0}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.00015}
        shadow-normalBias={0.018}
        shadow-camera-near={0.1}
        shadow-camera-far={8}
        shadow-radius={3}
        angle={0.67}
        penumbra={0.65}
        distance={8}
        decay={2}
        color="#ffdfb2"
      />
    </>
  );
}
function Product({
  layout,
  onOpen,
  onResource,
}: {
  layout: (typeof PRODUCT_LAYOUT)[number];
  onOpen: (s: Selection) => void;
  onResource: (key: string, status: string) => void;
}) {
  const product = products[layout.product],
    texture = useProductTexture(product.id, onResource, layout.id === "doll-back" || layout.id === "sticker-right" || layout.id === "sticker-front" ? 1 : 0);
  const model = useRef<Group>(null);
  useLayoutEffect(() => {
    model.current?.traverse((node) => {
      if (node instanceof Mesh) { node.castShadow = true; node.receiveShadow = true; }
    });
  }, [texture]);
  const [hover, setHover] = useState(false);
  const [x, y, z] = layout.position;
  const [w, h, d] = layout.size;
  const photo = photoDimensions(layout.kind, layout.size, texture);
  const hitHeight = layout.kind === "badge" ? h : Math.max(h, photo.height);
  const click = (e?: ThreeEvent<MouseEvent>) => {
    e?.stopPropagation();
    const canvas = document.querySelector(
      ".first-person-gallery canvas",
    ) as HTMLCanvasElement | null;
    if (Number(canvas?.dataset.dragUntil ?? 0) > performance.now()) return;
    onOpen({ chapter: 4, product: layout.product });
  };
  return (
    <group
      position={[x, y, ISLAND.z + z]}
      userData={{ collider: "artifact", artifact: layout.id }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHover(false);
        document.body.style.cursor = "";
      }}
      onClick={click}
    >
      <group ref={model}><PhotoArtifact kind={layout.kind} size={layout.size} texture={texture} /></group>
      <mesh
        position={[0, hitHeight / 2, 0]}
        userData={{ collider: "artifact", artifact: layout.id }}
      >
        <boxGeometry args={[w + 0.04, hitHeight + 0.04, d + 0.04]} />
        <meshBasicMaterial
          transparent
          opacity={hover ? 0.16 : 0}
          color="#e6b869"
          depthWrite={false}
          colorWrite={hover}
        />
      </mesh>
      {hover && (
        <mesh position={[0, hitHeight / 2, 0]}>
          <boxGeometry args={[w + 0.06, hitHeight + 0.06, d + 0.06]} />
          <meshBasicMaterial
            color="#f2ce8b"
            wireframe
            transparent
            opacity={0.75}
          />
        </mesh>
      )}
      <Html
        zIndexRange={[5, 0]}
        transform
        position={[0, layout.kind === "doll" ? -0.07 : 0.005, d / 2 + 0.05]}
        rotation={[-Math.PI / 3, 0, 0]}
        distanceFactor={1.15}
      >
        <button
          className={"island-item-label " + (hover ? "is-hovered" : "")}
          onClick={() => click()}
          aria-label={
            "查看文创：" +
            product.name +
            (layout.id === "doll-back" ? "（第二件）" : "")
          }
        >
          <span>{String(layout.product + 1).padStart(2, "0")}</span>
          {product.name}
          {!texture && <small>图片加载中</small>}
        </button>
      </Html>
    </group>
  );
}
function Rack({ onResource }: { onResource: (key: string, status: string) => void }) {
  const pendant = useProductTexture("badge", onResource, 1);
  const rack = useRef<Group>(null);
  useLayoutEffect(() => {
    rack.current?.traverse((node) => {
      if (node instanceof Mesh) { node.castShadow = true; node.receiveShadow = true; }
    });
  }, []);
  return (
    <group ref={rack} position={[0, 0, ISLAND.z - 0.43]}>
      {[-0.62, 0.62].map((x) => (
        <mesh key={x} position={[x, 1.46, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 1.32, 8]} />
          <meshStandardMaterial {...gold} />
        </mesh>
      ))}
      <mesh position={[0, 2.08, 0]}>
        <torusGeometry args={[0.62, 0.014, 6, 28, Math.PI]} />
        <meshStandardMaterial {...gold} />
      </mesh>
      {[-0.46, -0.31, -0.155, 0, 0.155, 0.31, 0.46].map((x) => (
        <mesh key={x} position={[x, 1.46, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 1.32, 6]} />
          <meshStandardMaterial {...gold} />
        </mesh>
      ))}
      {[0.81, 1.03, 1.25, 1.47, 1.69, 1.91, 2.12].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.006, 0.006, 1.24, 6]} />
          <meshStandardMaterial {...gold} />
        </mesh>
      ))}
      {[2.43, 1.2].map(y => <group key={y} position={[0, y - .16, -.23]}>
        <PhotoArtifact kind="tag" size={[.32, .32, .03]} texture={pendant} />
        <mesh position={[0, -.09, 0]}><cylinderGeometry args={[.012, .042, .17, 8]} /><meshStandardMaterial color="#a9232b" roughness={1} /></mesh>
      </group>)}
    </group>
  );
}
export default function IslandCounter({
  active,
  shadowVersion,
  onOpen,
  onResource,
}: {
  active: boolean;
  shadowVersion: number;
  onOpen: (s: Selection) => void;
  onResource: (key: string, status: string) => void;
}) {
  const { width: w, depth: d, baseHeight: base, glassTop: top } = ISLAND;
  const glass = {
    color: "#e9e5dd",
    transparent: true,
    opacity: 0.035,
    roughness: 0.12,
    metalness: 0,
    clearcoat: 0.45,
    clearcoatRoughness: 0.1,
    envMapIntensity: 0.22,
    depthWrite: false,
  };
  return (
    <group name="standalone-artifact-counter">
      {active && (
        <>
          <CounterSpot x={-1.7} z={1.4} />
          <CounterSpot x={1.7} z={-0.9} />
          <Environment resolution={32} frames={1} environmentIntensity={0.3}>
            <Lightformer
              intensity={3}
              color="#ffe4c4"
              position={[0, 4, 2]}
              rotation={[Math.PI / 2, 0, 0]}
              scale={[5, 1, 1]}
            />
            <Lightformer
              intensity={1}
              color="#cc7766"
              position={[0, 2, -3]}
              scale={[5, 2, 1]}
            />
          </Environment>
          <pointLight position={[0, 0.12, ISLAND.z + d / 2]} intensity={1.4} distance={3.4} decay={2} color="#e4ad65" />
          <pointLight
            position={[0, top - 0.2, ISLAND.z - 0.6]}
            intensity={3.2}
            color="#ff6855"
            distance={3}
            decay={2}
          />
        </>
      )}
      {active && <pointLight position={[0, 2.4, -44.6]} intensity={10} color="#9d5143" distance={6} decay={2} />}
      <mesh position={[0, 2, -45.96]}>
        <boxGeometry args={[7.9, 4, 0.025]} />
        <meshStandardMaterial color="#4b2326" roughness={0.95} />
      </mesh>
      {[-38.4, -41, -43.6].map((z) => (
        <mesh key={z} position={[0, 3.94, z]}>
          <boxGeometry args={[5.8, 0.025, 0.045]} />
          <meshBasicMaterial color="#ddb67c" toneMapped={false} />
        </mesh>
      ))}
      <mesh castShadow receiveShadow position={[0, base / 2, ISLAND.z]}>
        <boxGeometry args={[w, base, d]} />
        <meshStandardMaterial color="#111113" roughness={0.98} />
      </mesh>
      <mesh position={[0, 0.045, ISLAND.z]}>
        <boxGeometry args={[w + 0.04, 0.025, d + 0.04]} />
        <meshBasicMaterial color="#e4ad65" toneMapped={false} />
      </mesh>
      <mesh position={[0, base + 0.015, ISLAND.z]}>
        <boxGeometry args={[w + 0.035, 0.03, d + 0.035]} />
        <meshStandardMaterial {...gold} />
      </mesh>
      <mesh receiveShadow position={[0, base + 0.035, ISLAND.z]}>
        <boxGeometry args={[w - 0.035, 0.025, d - 0.035]} />
        <meshStandardMaterial
          color="#c9bda6"
          roughness={0.88}
          metalness={0}
          envMapIntensity={0.18}
        />
      </mesh>
      {/* Raised fabric backboards stay behind the unchanged product positions. */}
      {[-1.3, 1.25].map((x) => (
        <mesh key={x} castShadow receiveShadow position={[x, 1.5, ISLAND.z - 0.72]}>
          <boxGeometry args={[1.09, 1.33, 0.035]} />
          <meshStandardMaterial color="#392a29" roughness={0.96} />
        </mesh>
      ))}
      {active && <ContactShadows key={shadowVersion}
        position={[0, base + 0.049, ISLAND.z]}
        scale={[w - 0.06, d - 0.06]} resolution={256}
        opacity={0.38} blur={2.2} far={2} frames={1} color="#34241b"
      />}
      <Rack onResource={onResource} />
      {PRODUCT_LAYOUT.map((layout) => (
        <Product
          key={layout.id}
          layout={layout}
          onOpen={onOpen}
          onResource={onResource}
        />
      ))}
      {[-w / 2, w / 2].flatMap((x) =>
        [-d / 2, d / 2].map((z) => (
          <mesh
            key={x + "," + z}
            position={[x, (base + top) / 2, ISLAND.z + z]}
          >
            <boxGeometry args={[0.018, top - base, 0.018]} />
            <meshStandardMaterial {...gold} />
          </mesh>
        )),
      )}
      {[base + 0.05, top].flatMap((y) => [
        ...[-d / 2, d / 2].map((z) => (
          <mesh key={y + "z" + z} position={[0, y, ISLAND.z + z]}>
            <boxGeometry args={[w, 0.018, 0.018]} />
            <meshStandardMaterial {...gold} />
          </mesh>
        )),
        ...[-w / 2, w / 2].map((x) => (
          <mesh key={y + "x" + x} position={[x, y, ISLAND.z]}>
            <boxGeometry args={[0.018, 0.018, d]} />
            <meshStandardMaterial {...gold} />
          </mesh>
        )),
      ])}
      {[-d / 2, d / 2].map((z) => (
        <mesh
          key={"glassz" + z}
          position={[0, (base + top) / 2, ISLAND.z + z]}
          raycast={() => null}
        >
          <boxGeometry args={[w, top - base, 0.018]} />
          <meshPhysicalMaterial {...glass} />
        </mesh>
      ))}
      {[-w / 2, w / 2].map((x) => (
        <mesh
          key={"glassx" + x}
          position={[x, (base + top) / 2, ISLAND.z]}
          raycast={() => null}
        >
          <boxGeometry args={[0.018, top - base, d]} />
          <meshPhysicalMaterial {...glass} />
        </mesh>
      ))}
      <mesh position={[0, top, ISLAND.z]} raycast={() => null}>
        <boxGeometry args={[w, 0.018, d]} />
        <meshPhysicalMaterial {...glass} opacity={0.025} />
      </mesh>
      <mesh position={[0, top - 0.11, ISLAND.z - d / 2 + 0.05]}>
        <boxGeometry args={[w - 0.12, 0.025, 0.04]} />
        <meshBasicMaterial color="#ff7965" toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.39, ISLAND.z + d / 2 + 0.022]}>
        <boxGeometry args={[2.65, 0.47, 0.025]} />
        <meshStandardMaterial color="#0c0c0e" roughness={0.7} />
      </mesh>
      <Html
        transform
        zIndexRange={[5, 0]}
        position={[0, 0.39, ISLAND.z + d / 2 + 0.04]}
        distanceFactor={2.65}
      >
        <button
          className="island-counter-title"
          onClick={() => onOpen({ chapter: 4, product: 0 })}
        >
          <span>CONTEMPORARY DESIGN / 独立文创展柜</span>
          <strong>续 · 把祝福带走</strong>
          <small>拖拽环绕 · 滚轮视野 · 点击展品查看</small>
        </button>
      </Html>
    </group>
  );
}
