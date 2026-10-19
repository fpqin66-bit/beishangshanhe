import { DoubleSide, Shape, Vector2, type Texture } from "three";
import { useMemo } from "react";
import { Html, RoundedBox } from "@react-three/drei";
const weave = (shader: { vertexShader: string; fragmentShader: string }) => {
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", "#include <common>\nvarying vec3 vCloth;")
    .replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\nvCloth=position;",
    );
  shader.fragmentShader = shader.fragmentShader
    .replace("#include <common>", "#include <common>\nvarying vec3 vCloth;")
    .replace(
      "#include <color_fragment>",
      "#include <color_fragment>\nfloat threadX=sin(vCloth.x*420.); float threadY=sin(vCloth.y*420.); float threadFade=1.-smoothstep(.3,1.2,max(fwidth(vCloth.x*420.),fwidth(vCloth.y*420.))); float weave=1.-.12*threadFade*(.5+.5*threadX*threadY); diffuseColor.rgb*=weave;",
    )
    .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
      float fiberFade=1.-smoothstep(.3,1.2,max(fwidth(vCloth.x*420.),fwidth(vCloth.y*420.)));
      normal=normalize(normal+vec3(sin(vCloth.x*420.),sin(vCloth.y*420.),0.)*.075*fiberFade);
    `);
};
const plush = { onBeforeCompile: weave, sheen: 1, sheenRoughness: 0.9, sheenColor: "#ad8875" };
const cloth = {
  onBeforeCompile: weave,
  color: "#231f23",
  roughness: 0.97,
  sheen: 0.6,
  sheenColor: "#8a7062",
  sheenRoughness: 0.85,
};
const gold = { color: "#C6A36A", roughness: 0.55, metalness: 0.65 };
export function FloralPendant({ y }: { y: number }) {
  return (
    <group position={[0, y, -0.23]}>
      <mesh rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.28, 0.28, 0.035]} />
        <meshStandardMaterial color="#783B42" roughness={0.9} />
      </mesh>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <mesh
          key={i}
          position={[
            Math.cos((i * Math.PI) / 4) * 0.08,
            Math.sin((i * Math.PI) / 4) * 0.08,
            0.028,
          ]}
          scale={[0.037, 0.065, 0.018]}
          rotation={[0, 0, (i * Math.PI) / 4]}
        >
          <sphereGeometry args={[1, 8, 6]} />
          <meshStandardMaterial color="#bd7957" roughness={0.85} />
        </mesh>
      ))}
      <mesh position={[0, 0, 0.045]}>
        <sphereGeometry args={[0.042, 10, 8]} />
        <meshStandardMaterial {...gold} />
      </mesh>
      <mesh position={[0, -0.24, 0]}>
        <cylinderGeometry args={[0.016, 0.055, 0.19, 10]} />
        <meshStandardMaterial color="#a9232b" roughness={1} />
      </mesh>
      {[-0.03, -0.015, 0, 0.015, 0.03].map((x) => (
        <mesh key={x} position={[x, -0.27, 0.015]}>
          <boxGeometry args={[0.003, 0.14, 0.004]} />
          <meshStandardMaterial color="#c7423a" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}
function Doll() {
  return (
    <group>
      <mesh position={[0, 0.43, 0]} scale={[1, 1, 0.8]}>
        <sphereGeometry args={[0.13, 16, 12]} />
        <meshPhysicalMaterial {...plush} color="#e5b48d" roughness={0.96} sheen={1} />
      </mesh>
      <mesh position={[0, 0.465, -0.025]} scale={[1.08, 0.78, 0.85]}>
        <sphereGeometry
          args={[0.135, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.75]}
        />
        <meshPhysicalMaterial {...plush} color="#382219" roughness={1} sheen={1} />
      </mesh>
      {[-1, 1].map((v) => (
        <group key={v}>
          <mesh position={[v * 0.145, 0.4, -0.02]} scale={[0.6, 1, 0.6]}>
            <sphereGeometry args={[0.09, 12, 8]} />
            <meshPhysicalMaterial {...plush} color="#392319" roughness={1} sheen={1} />
          </mesh>
          <mesh position={[v * 0.16, 0.25, 0.01]} rotation={[0, 0, v * 0.6]}>
            <capsuleGeometry args={[0.035, 0.12, 3, 8]} />
            <meshPhysicalMaterial {...plush} color="#e2b08b" roughness={1} sheen={1} />
          </mesh>
          <mesh position={[v * 0.05, 0.05, 0.015]}>
            <sphereGeometry args={[0.04, 10, 8]} />
            <meshPhysicalMaterial color="#e3b08e" roughness={1} />
          </mesh>
          <mesh position={[v * 0.043, 0.435, 0.102]}>
            <sphereGeometry args={[0.019, 10, 8]} />
            <meshStandardMaterial color="#211716" />
          </mesh>
          <mesh position={[v * 0.038, 0.44, 0.119]}>
            <sphereGeometry args={[0.005, 6, 4]} />
            <meshBasicMaterial color="#fff0da" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.19, 0]}>
        <cylinderGeometry args={[0.075, 0.14, 0.28, 14]} />
        <meshPhysicalMaterial {...plush} color="#a72b32" roughness={0.96} sheen={1} />
      </mesh>
      <mesh position={[0, 0.27, 0.085]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.1, 0.1, 0.035]} />
        <meshPhysicalMaterial {...plush} color="#c04842" roughness={1} sheen={1} />
      </mesh>
      <mesh position={[0, 0.625, 0]}>
        <torusGeometry args={[0.045, 0.008, 6, 12]} />
        <meshStandardMaterial {...gold} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={i}
          position={[0, 0.68 + i * 0.035, 0]}
          rotation={[0, ((i % 2) * Math.PI) / 2, 0]}
        >
          <torusGeometry args={[0.018, 0.004, 5, 10]} />
          <meshStandardMaterial {...gold} />
        </mesh>
      ))}
    </group>
  );
}
// Contemporary geometric appliqué, never labelled as a historical pattern reconstruction.
function Applique({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  const shapes = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => {
        const points = Array.from({ length: 17 }, (_, j) => {
          const a = (j / 16) * Math.PI * 2,
            angle = (i * Math.PI) / 4,
            x = Math.cos(a) * 0.09,
            y = 0.2 + Math.sin(a) * 0.2;
          return new Vector2(
            x * Math.cos(angle) - y * Math.sin(angle),
            x * Math.sin(angle) + y * Math.cos(angle),
          );
        });
        return new Shape(points);
      }),
    [],
  );
  return (
    <group position={position} scale={scale}>
      <mesh scale={[1.12, 1.12, 1]}>
        <extrudeGeometry
          args={[
            shapes,
            { depth: 0.008, bevelEnabled: false, curveSegments: 3 },
          ]}
        />
        <meshPhysicalMaterial color="#ac8e5d" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, 0.01]}>
        <extrudeGeometry
          args={[
            shapes,
            { depth: 0.008, bevelEnabled: false, curveSegments: 3 },
          ]}
        />
        <meshPhysicalMaterial onBeforeCompile={weave} color="#9a3b37" roughness={0.97} sheen={0.8} />
      </mesh>
      <mesh position={[0, 0, 0.025]} scale={[1, 1, 0.25]}>
        <sphereGeometry args={[0.095, 12, 8]} />
        <meshPhysicalMaterial color="#c47c58" roughness={0.97} />
      </mesh>
    </group>
  );
}
export default function ArtifactModel({
  kind,
  size,
  texture,
}: {
  kind: string;
  size: readonly number[];
  texture: Texture | null;
}) {
  const [w, h, d] = size;
  return (
    <group>
      {!texture && kind === "bag" && (
        <>
          <Applique position={[0, h * 0.52, d / 2 + 0.008]} scale={0.75} />
          <Html
            transform
            zIndexRange={[4, 0]}
            position={[0, 0.14, d / 2 + 0.03]}
            distanceFactor={1.05}
            style={{ pointerEvents: "none" }}
          >
            <span
              style={{ fontSize: 16, color: "#e9e0ce", whiteSpace: "nowrap" }}
            >
              beishang-shanhe
            </span>
          </Html>
        </>
      )}
      {!texture && kind === "cushion" && (
        <>
          <Applique position={[0, h * 0.52, d / 2 + 0.01]} scale={0.8} />
          <Applique position={[-0.29, h * 0.75, 0.13]} scale={0.3} />
          <Applique position={[0.29, h * 0.25, 0.13]} scale={0.3} />
        </>
      )}
      {!texture && kind === "cup" && (
        <Applique position={[0, h * 0.48, w * 0.49]} scale={0.3} />
      )}
      {!texture && kind === "phone" && (
        <Applique position={[0, h * 0.44, d / 2 + 0.01]} scale={0.25} />
      )}
      {!texture &&
        kind === "mask" &&
        [-1, 1].map((v) => (
          <Applique
            key={v}
            position={[v * 0.2, h * 0.5, d + 0.01]}
            scale={0.27}
          />
        ))}
      {!texture && kind === "badge" && (
        <group position={[0, 0.018, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <Applique position={[0, 0, 0]} scale={w} />
        </group>
      )}
      {kind === "doll" ? (
        <Doll />
      ) : kind === "cup" ? (
        <group>
          <mesh position={[0, h / 2, 0]}>
            <cylinderGeometry args={[w * 0.48, w * 0.37, h, 18]} />
            <meshPhysicalMaterial {...cloth} />
          </mesh>
          <mesh position={[0, h + 0.015, 0]}>
            <cylinderGeometry args={[w * 0.53, w * 0.53, 0.04, 18]} />
            <meshStandardMaterial color="#22252a" roughness={0.65} />
          </mesh>
        </group>
      ) : kind === "cushion" ? (
        <RoundedBox
          args={[w, h, d]}
          radius={0.095}
          smoothness={2}
          position={[0, h / 2, 0]}
        >
          <meshPhysicalMaterial {...cloth} sheen={1} />
        </RoundedBox>
      ) : kind === "umbrella" ? (
        <group>
          <mesh position={[0, h / 2, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[h * 0.46, h * 0.46, w, 16]} />
            <meshPhysicalMaterial
              color="#1d2029"
              roughness={0.88}
              sheen={0.5}
            />
          </mesh>
          <mesh position={[-w * 0.2, h / 2, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[h * 0.48, h * 0.48, 0.25, 16]} />
            <meshPhysicalMaterial color="#783B42" roughness={0.9} />
          </mesh>
        </group>
      ) : kind === "badge" ? (
        <mesh
          position={[0, 0.015, 0]}
          rotation={[-Math.PI / 2, 0, Math.PI / 4]}
        >
          <circleGeometry args={[w * 0.5, 8]} />
          <meshStandardMaterial
            color="#ad5d4c"
            roughness={0.8}
            side={DoubleSide}
          />
        </mesh>
      ) : kind === "mask" ? (
        <group>
          {[-1, 1].map((v) => (
            <mesh
              key={v}
              position={[v * w * 0.21, h / 2, 0]}
              scale={[w * 0.3, h * 0.55, d]}
            >
              <sphereGeometry args={[1, 16, 10]} />
              <meshPhysicalMaterial {...cloth} sheen={0.9} />
            </mesh>
          ))}
        </group>
      ) : (
        <mesh position={[0, h / 2, 0]}>
          <boxGeometry args={[w, h, d]} />
          <meshPhysicalMaterial
            {...cloth}
            roughness={kind === "bag" ? 1 : 0.6}
            sheen={kind === "bag" ? 1 : 0.1}
          />
        </mesh>
      )}
      {kind === "bag" &&
        [-0.065, 0.065].map((z) => (
          <mesh key={z} position={[0, h + 0.22, z]} scale={[1, 1.4, 1]}>
            <torusGeometry args={[w * 0.26, 0.021, 6, 20, Math.PI]} />
            <meshPhysicalMaterial {...cloth} />
          </mesh>
        ))}
      {kind === "phone" &&
        [-0.07, 0.025].flatMap((x) =>
          [0.08, 0.17].map((y) => (
            <mesh
              key={x + "," + y}
              position={[x, h - y, d / 2 + 0.006]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[0.035, 0.035, 0.012, 10]} />
              <meshStandardMaterial
                color="#141518"
                metalness={0.6}
                roughness={0.4}
              />
            </mesh>
          )),
        )}
      {texture && (
        <mesh
          position={[
            0,
            kind === "badge" ? 0.02 : h / 2,
            kind === "cup" ? w * 0.49 : d / 2 + 0.006,
          ]}
          rotation={kind === "badge" ? [-Math.PI / 2, 0, 0] : [0, 0, 0]}
        >
          <planeGeometry
            args={[w * 0.95, kind === "badge" ? size[2] : h * 0.95]}
          />
          <meshStandardMaterial map={texture} side={DoubleSide} roughness={0.92} metalness={0} />
        </mesh>
      )}
    </group>
  );
}
