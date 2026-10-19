import { useEffect, useState } from "react";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import {
  Color,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Shape,
  Vector2,
  Vector3,
} from "three";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import { assetUrl } from "./capability";
const isWhite = (color: Color) =>
  color.r > 0.93 && color.g > 0.93 && color.b > 0.93;
export function createRelief(svg: string) {
  if (svg.length > 2_000_000) throw Error("SVG过大，请提供精简路径。");
  const data = new SVGLoader().parse(svg);
  if (data.paths.length > 2000) throw Error("SVG路径过多，请提供精简版本。");
  const shapes: Shape[] = [];
  let pointCount = 0;
  for (const path of data.paths) {
    const style = path.userData?.style as
      Record<string, string | number> | undefined;
    if (
      style?.visibility === "hidden" ||
      style?.display === "none" ||
      Number(style?.opacity ?? 1) === 0
    )
      continue;
    // White filled shapes (usually the artboard) never become physical exhibits.
    const filled =
      style?.fill !== "none" && Number(style?.fillOpacity ?? 1) > 0;
    if (filled && isWhite(path.color)) continue;
    if (filled) shapes.push(...SVGLoader.createShapes(path));
    else if (
      style?.stroke &&
      style.stroke !== "none" &&
      Number(style.strokeOpacity ?? 1) > 0 &&
      !isWhite(new Color(String(style.stroke)))
    ) {
      // Convert stroke-only SVGs to closed outlines before extrusion; no replacement artwork is produced.
      const strokeStyle = SVGLoader.getStrokeStyle(
        Number(style.strokeWidth ?? 1),
        String(style.stroke),
        String(style.strokeLineJoin ?? "miter"),
        String(style.strokeLineCap ?? "butt"),
        Number(style.strokeMiterLimit ?? 4),
      );
      for (const sub of path.subPaths) {
        const points = sub.getPoints(3);
        pointCount += points.length;
        if (pointCount > 20000) throw Error("SVG轮廓过于复杂。");
        const stroke = SVGLoader.pointsToStroke(points, strokeStyle, 4);
        if (!stroke) continue;
        const vertices = stroke.getAttribute("position");
        for (let i = 0; i < vertices.count; i += 3) {
          const a = new Vector2(vertices.getX(i), vertices.getY(i));
          const b = new Vector2(vertices.getX(i + 1), vertices.getY(i + 1));
          const c = new Vector2(vertices.getX(i + 2), vertices.getY(i + 2));
          if (
            Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) >
            1e-8
          )
            shapes.push(new Shape([a, b, c]));
        }
        stroke.dispose();
      }
    }
  }
  if (!shapes.length) throw Error("SVG中没有可挤出的非白色轮廓。");
  if (
    shapes.length > 10000 ||
    shapes.reduce(
      (n, s) =>
        n + s.curves.length + s.holes.reduce((m, h) => m + h.curves.length, 0),
      0,
    ) > 30000
  )
    throw Error("SVG轮廓过于复杂。");
  const geometry = new ExtrudeGeometry(shapes, {
    depth: 2,
    bevelEnabled: false,
    curveSegments: 3,
    steps: 1,
  });
  if (geometry.getAttribute("position").count > 180000) {
    geometry.dispose();
    throw Error("SVG超过180000顶点预算。");
  }
  geometry.scale(1, -1, 1);
  geometry.computeBoundingBox();
  const size = geometry.boundingBox!.getSize(new Vector3());
  if (!Number.isFinite(size.x) || Math.max(size.x, size.y) <= 0) {
    geometry.dispose();
    throw Error("SVG轮廓尺寸无效。");
  }
  geometry.center();
  const factor = 1.45 / Math.max(size.x, size.y);
  geometry.scale(factor, factor, 0.035 / size.z);
  const material = new MeshStandardMaterial({
    color: "#C6A36A",
    metalness: 0.75,
    roughness: 0.38,
  });
  const group = new Group();
  group.add(new Mesh(geometry, material));
  return group;
}
export function disposeRelief(group: Group) {
  const materials = new Set<MeshStandardMaterial>();
  group.traverse((o) => {
    if (o instanceof Mesh) {
      o.geometry.dispose();
      materials.add(o.material as MeshStandardMaterial);
    }
  });
  materials.forEach((m) => m.dispose());
}
export default function Relief({
  index,
  onStatus,
  onClick,
}: {
  index: number;
  onStatus: (i: number, status: string) => void;
  onClick: () => void;
}) {
  const [object, setObject] = useState<Group | null>(null);
  const { invalidate } = useThree();
  useEffect(() => {
    const controller = new AbortController();
    let group: Group | null = null;
    onStatus(index, "loading");
    const filename = "textures/wenyang" + (index + 1) + "-1.svg";
    const embedded = (
      window as Window & { __EXHIBITION_ASSETS__?: Record<string, string> }
    ).__EXHIBITION_ASSETS__;
    if (embedded && !embedded[filename]) {
      onStatus(index, "missing");
      return () => controller.abort();
    }
    fetch(assetUrl(filename), { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw Error("素材缺失");
        const s = await r.text();
        if (!s.includes("<svg")) throw Error("素材缺失");
        return s;
      })
      .then((svg) => {
        if (controller.signal.aborted) return;
        group = createRelief(svg);
        setObject(group);
        onStatus(index, "ready");
        invalidate();
      })
      .catch((e) => {
        if (!controller.signal.aborted) {
          onStatus(index, e.message === "素材缺失" ? "missing" : "invalid");
          invalidate();
        }
      });
    return () => {
      controller.abort();
      if (group) disposeRelief(group);
    };
  }, [index, onStatus, invalidate]);
  return object ? (
    <primitive
      object={object}
      dispose={null}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onClick();
      }}
    />
  ) : null;
}
