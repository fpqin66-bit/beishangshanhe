import { useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import { LinearMipmapLinearFilter, SRGBColorSpace, Texture, TextureLoader } from "three";
import { useWenchuangAssets } from "./WenchuangAssets";
export function useProductTexture(
  id: string,
  onResource: (key: string, status: string) => void,
  view = 0,
) {
  const { sceneImages } = useWenchuangAssets();
  const source = sceneImages[id + ":" + view];
  const [texture, setTexture] = useState<Texture | null>(null);
  const { invalidate } = useThree();
  useEffect(() => {
    let alive = true;
    let loaded: Texture | undefined;
    const key = "product:" + id;
    if (!source) {
      setTexture(null);
      onResource(key, "missing");
      return;
    }
    onResource(key, "loading");
    new TextureLoader().load(
      source,
      (t) => {
        loaded = t;
        if (!alive) {
          t.dispose();
          return;
        }
        t.colorSpace = SRGBColorSpace;
        t.minFilter = LinearMipmapLinearFilter;
        t.generateMipmaps = true;
        t.anisotropy = 4;
        setTexture(t);
        onResource(key, "ready");
        invalidate();
      },
      undefined,
      () => {
        if (alive) {
          onResource(key, "missing");
          invalidate();
        }
      },
    );
    return () => {
      alive = false;
      loaded?.dispose();
    };
  }, [id, source, onResource, invalidate]);
  return texture;
}
