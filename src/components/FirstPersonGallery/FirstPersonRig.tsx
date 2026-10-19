import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { FirstPersonControls } from "three/examples/jsm/controls/FirstPersonControls.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  Euler,
  MathUtils,
  PerspectiveCamera,
  Quaternion,
  Vector3,
} from "three";
import points from "../../data/gallery-points.json";
import { ISLAND } from "./islandLayout";
import { constrainPosition, galleryRoute, nearestChapter } from "./navigation";
type Props = {
  destination: number;
  area: number;
  travelToken: number;
  walking: boolean;
  mobile: boolean;
  blocked: boolean;
  onArrive: () => void;
  onChapter: (n: number) => void;
};
const keys = [
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "ArrowUp",
  "ArrowLeft",
  "ArrowDown",
  "ArrowRight",
];
export default function FirstPersonRig({
  destination,
  area,
  travelToken,
  walking,
  mobile,
  blocked,
  onArrive,
  onChapter,
}: Props) {
  const { camera, gl, invalidate } = useThree();
  const controls = useRef<FirstPersonControls | null>(null),
    orbit = useRef<OrbitControls | null>(null),
    pressed = useRef(new Set<string>()),
    latest = useRef({ walking, blocked });
  latest.current = { walking, blocked };
  const previous = useRef(new Vector3()),
    lastChapter = useRef(-1);
  const travel = useRef<{
    from: Vector3;
    to: Vector3;
    rotation: Quaternion;
    start: Quaternion;
    elapsed: number;
    route: Vector3[];
    leg: number;
  } | null>(null);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (
        latest.current.walking &&
        !latest.current.blocked &&
        keys.includes(e.code)
      )
        pressed.current.add(e.code);
    };
    const up = (e: KeyboardEvent) => pressed.current.delete(e.code);
    const clear = () => pressed.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    };
  }, []);
  useEffect(() => {
    const p = points[destination],
      to = new Vector3(...(p.position as [number, number, number]));
    const clone = camera.clone();
    clone.position.copy(to);
    clone.lookAt(new Vector3(...(p.target as [number, number, number])));
    const route = galleryRoute(camera.position, to);
    travel.current = {
      from: camera.position.clone(),
      to: route[0],
      rotation: clone.quaternion.clone(),
      start: camera.quaternion.clone(),
      elapsed: 0,
      route,
      leg: 0,
    };
    if (camera instanceof PerspectiveCamera) {
      camera.fov = destination === 4 ? 76 : 65;
      camera.updateProjectionMatrix();
    }
    invalidate();
  }, [destination, travelToken, camera, invalidate]);
  useEffect(() => {
    if (!walking || mobile || blocked) return;
    constrainPosition(camera.position);
    const ctl = new FirstPersonControls(camera, document.createElement("div"));
    ctl.movementSpeed = 2.5;
    ctl.dampingFactor = 1;
    ctl.lookSpeed = 0;
    ctl.autoForward = false;
    ctl.heightSpeed = false;
    controls.current = ctl;
    for (const code of pressed.current)
      window.dispatchEvent(new KeyboardEvent("keydown", { code }));
    const guard = (e: KeyboardEvent) => {
      if (["Space", "KeyR", "KeyF"].includes(e.code)) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
      if (keys.includes(e.code)) {
        if (
          e.target instanceof HTMLElement &&
          e.target.closest("input,textarea,select,[contenteditable=true]")
        ) {
          e.stopImmediatePropagation();
          return;
        }
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", guard, true);
    invalidate();
    return () => {
      window.removeEventListener("keydown", guard, true);
      ctl.dispose();
      controls.current = null;
      pressed.current.clear();
    };
  }, [walking, mobile, blocked, camera, invalidate]);
  useEffect(() => {
    if (mobile || blocked || walking || area !== 4) return;
    const ctl = new OrbitControls(camera, gl.domElement);
    ctl.target.set(0, 1.05, ISLAND.z);
    ctl.enablePan = false;
    ctl.minDistance = 3.4;
    ctl.maxDistance = 4;
    ctl.enableZoom = false;
    ctl.enableDamping = false;
    ctl.rotateSpeed = 0.55;
    ctl.minPolarAngle = 0.7;
    ctl.maxPolarAngle = 1.5;
    ctl.enabled = !travel.current;
    orbit.current = ctl;
    const change = () => {
      if (travel.current) return;
      constrainPosition(camera.position, undefined, false);
      camera.lookAt(ctl.target);
      invalidate();
    };
    ctl.addEventListener("change", change);
    if (!travel.current) {
      ctl.update();
      invalidate();
    }
    return () => {
      ctl.removeEventListener("change", change);
      ctl.dispose();
      orbit.current = null;
    };
  }, [area, walking, mobile, blocked, camera, gl, invalidate]);
  useEffect(() => {
    const canvas = gl.domElement;
    let drag: { x: number; y: number; lastX: number; lastY: number } | null =
      null;
    const rotate = (dx: number, dy: number) => {
      const angles = new Euler().setFromQuaternion(camera.quaternion, "YXZ");
      angles.y -= dx * 0.003;
      angles.x = MathUtils.clamp(angles.x - dy * 0.003, -1.15, 1.15);
      camera.quaternion.setFromEuler(angles);
      controls.current?.lookAt(
        camera.position
          .clone()
          .add(new Vector3(0, 0, -1).applyQuaternion(camera.quaternion)),
      );
      invalidate();
    };
    const down = (e: PointerEvent) => {
      if (
        mobile ||
        blocked ||
        travel.current ||
        e.button !== 0 ||
        document.pointerLockElement
      )
        return;
      drag = { x: e.clientX, y: e.clientY, lastX: e.clientX, lastY: e.clientY };
    };
    const move = (e: PointerEvent) => {
      if (blocked || mobile || travel.current) return;
      if (document.pointerLockElement === canvas) {
        rotate(e.movementX, e.movementY);
        return;
      }
      if (!drag) return;
      const dx = e.clientX - drag.lastX,
        dy = e.clientY - drag.lastY;
      drag.lastX = e.clientX;
      drag.lastY = e.clientY;
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 4)
        canvas.dataset.dragUntil = String(performance.now() + 350);
      if (!orbit.current) rotate(dx, dy);
    };
    const up = () => {
      drag = null;
    };
    const wheel = (e: WheelEvent) => {
      if (blocked || travel.current || !(camera instanceof PerspectiveCamera))
        return;
      e.preventDefault();
      camera.fov = MathUtils.clamp(camera.fov + e.deltaY * 0.035, 28, 85);
      camera.updateProjectionMatrix();
      invalidate();
    };
    const suppress = (e: MouseEvent) => {
      if (Number(canvas.dataset.dragUntil ?? 0) > performance.now()) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };
    canvas.addEventListener("pointerdown", down);
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
    window.addEventListener("blur", up);
    canvas.addEventListener("wheel", wheel, { passive: false });
    canvas.addEventListener("click", suppress, true);
    return () => {
      canvas.removeEventListener("pointerdown", down);
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      window.removeEventListener("blur", up);
      canvas.removeEventListener("wheel", wheel);
      canvas.removeEventListener("click", suppress, true);
    };
  }, [camera, gl, mobile, blocked, invalidate]);
  useFrame((_, dt) => {
    const t = travel.current;
    if (t) {
      t.elapsed += Math.min(dt, 0.05);
      const duration = matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0.01
        : 1.3;
      const p = Math.min(t.elapsed / duration, 1),
        ease = p * p * (3 - 2 * p);
      camera.position.lerpVectors(t.from, t.to, ease);
      camera.quaternion.slerpQuaternions(t.start, t.rotation, ease);
      constrainPosition(camera.position, undefined, destination !== 4);
      if (p === 1) {
        if (t.leg < t.route.length - 1) {
          t.leg++;
          t.from.copy(camera.position);
          t.to = t.route[t.leg];
          t.start.copy(camera.quaternion);
          t.elapsed = 0;
        } else {
          travel.current = null;
          if (orbit.current) {
            orbit.current.target.set(0, 1.05, ISLAND.z);
            orbit.current.enabled = true;
            orbit.current.update();
          }
          onArrive();
        }
      }
      invalidate();
    } else if (controls.current) {
      previous.current.copy(camera.position);
      controls.current.update(Math.min(dt, 0.05));
      constrainPosition(camera.position, previous.current);
      invalidate();
    }
    if (orbit.current) orbit.current.enabled = !travel.current && !blocked;
    const n = nearestChapter(camera.position.z);
    if (n !== lastChapter.current) {
      lastChapter.current = n;
      onChapter(n);
    }
    gl.domElement.dataset.view = camera.quaternion
      .toArray()
      .map((v) => v.toFixed(4))
      .join(",");
    gl.domElement.dataset.position = camera.position
      .toArray()
      .map((v) => v.toFixed(3))
      .join(",");
    gl.domElement.dataset.fov =
      camera instanceof PerspectiveCamera ? camera.fov.toFixed(2) : "";
  });
  return null;
}
