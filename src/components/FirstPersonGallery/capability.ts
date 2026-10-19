export function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2", {
      failIfMajorPerformanceCaveat: false,
    });
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}
export function isMobileGallery() {
  return (
    matchMedia("(pointer: coarse)").matches ||
    matchMedia("(max-width: 760px)").matches
  );
}
export function assetUrl(name: string) {
  return (
    (window as Window & { __EXHIBITION_ASSETS__?: Record<string, string> })
      .__EXHIBITION_ASSETS__?.[name] ||
    new URL("./assets/" + name, document.baseURI).href
  );
}
