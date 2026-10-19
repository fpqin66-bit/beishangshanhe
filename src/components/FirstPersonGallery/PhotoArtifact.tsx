import { DoubleSide, type Texture } from 'three';

export function photoDimensions(kind: string, size: readonly number[], texture: Texture | null) {
  const image = texture?.image as HTMLImageElement | undefined;
  const aspect = image?.width && image?.height ? image.width / image.height : 1;
  const maxHeight = kind === 'bag' ? 1.62 : kind === 'doll' ? .88 : kind === 'mask' ? .55 : kind === 'umbrella' ? .4 : kind === 'badge' ? size[2] : size[1];
  const maxWidth = kind === 'doll' ? .57 : size[0];
  const width = Math.min(maxWidth, maxHeight * aspect), height = width / aspect;
  return { width, height };
}
/** A photograph cutout, not a speculative reconstruction of an undocumented 3D object. */
export default function PhotoArtifact({ kind, size, texture }: { kind: string; size: readonly number[]; texture: Texture | null }) {
  if (!texture) return null;
  const { width, height } = photoDimensions(kind, size, texture);
  const flat = kind === 'badge';
  const tilt = flat ? -Math.PI / 2 : kind === 'umbrella' ? -.85 : kind === 'mask' ? -.35 : 0;
  return <mesh castShadow receiveShadow
    name="original-product-photograph"
    userData={{ originalPhoto: true, aspectPreserved: true }}
    rotation={[tilt, 0, 0]}
    position={[0, flat ? .006 : height / 2 * Math.cos(tilt), 0]}>
    <planeGeometry args={[width, height]} />
    <meshBasicMaterial map={texture} transparent alphaTest={.45} side={DoubleSide} toneMapped={false} />
  </mesh>;
}
