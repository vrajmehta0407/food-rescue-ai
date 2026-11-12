/**
 * Strip EXIF metadata (including GPS location tags) from an uploaded image file
 * by decoding and re-encoding via an offscreen HTMLCanvasElement.
 */
export async function stripExifAndResize(
  file: File,
  maxWidth = 1024,
  quality = 0.85
): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = objectUrl;
    });

    const scale = Math.min(1, maxWidth / Math.max(1, img.width));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas context unavailable");
    }
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL("image/webp", quality);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

