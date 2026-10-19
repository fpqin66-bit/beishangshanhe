/** Photography only: crop empty margins, mask the connected neutral studio background.
 * RGB pixels are never repainted, recoloured, mirrored or stretched. Originals remain in the catalogue.
 */
export function photoCanvas(image: HTMLImageElement, crop: readonly number[], rotate = 0, mask = true, seeds: readonly number[][] = [], preserve: readonly number[][] = [], backgroundThreshold = 195) {
  const [x, y, w, h] = crop;
  const factor = Math.min(1, 1024 / Math.max(image.naturalWidth * w, image.naturalHeight * h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * w * factor));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * h * factor));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw Error('无法读取文创图片');
  ctx.drawImage(image, x * image.naturalWidth, y * image.naturalHeight, w * image.naturalWidth, h * image.naturalHeight, 0, 0, canvas.width, canvas.height);
  if (!mask) return canvas;
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height), data = pixels.data;
  const count = canvas.width * canvas.height, visited = new Uint8Array(count), queue = new Uint32Array(count);
  let head = 0, tail = 0;
  const visit = (i: number) => {
    if (visited[i]) return;
    const px = (i % canvas.width) / canvas.width, py = Math.floor(i / canvas.width) / canvas.height;
    if (preserve.some(([x, y, w, h]) => px >= x && px <= x + w && py >= y && py <= y + h)) return;
    visited[i] = 1;
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    if (Math.min(r, g, b) > backgroundThreshold && Math.max(r, g, b) - Math.min(r, g, b) < 38) queue[tail++] = i;
  };
  for (let x = 0; x < canvas.width; x++) { visit(x); visit((canvas.height - 1) * canvas.width + x); }
  for (let y = 0; y < canvas.height; y++) { visit(y * canvas.width); visit((y + 1) * canvas.width - 1); }
  for (const [x, y] of seeds) visit(Math.floor(y * canvas.height) * canvas.width + Math.floor(x * canvas.width));
  while (head < tail) {
    const i = queue[head++]; data[i * 4 + 3] = 0;
    if (i % canvas.width > 0) visit(i - 1);
    if (i % canvas.width < canvas.width - 1) visit(i + 1);
    if (i >= canvas.width) visit(i - canvas.width);
    if (i < count - canvas.width) visit(i + canvas.width);
  }
  ctx.putImageData(pixels, 0, 0);
  const output = document.createElement('canvas');
  output.width = rotate === 90 ? canvas.height : canvas.width;
  output.height = rotate === 90 ? canvas.width : canvas.height;
  const dest = output.getContext('2d')!;
  if (rotate === 90) { dest.translate(output.width, 0); dest.rotate(Math.PI / 2); }
  dest.drawImage(canvas, 0, 0);
  return output;
}
