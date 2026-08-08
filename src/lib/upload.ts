import { nanoid } from "nanoid";
import type { EntityImage } from "./types";

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_EDGE = 1600;

/**
 * Reads an image file into a data URL, downscaling anything oversized first.
 * Local storage is small and a 12MP phone photo would blow the whole project
 * budget on one reference picture.
 */
export async function readImageFile(file: File): Promise<EntityImage | null> {
  if (!file.type.startsWith("image/")) return null;
  if (file.size > MAX_BYTES) return null;

  const raw = await new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(file);
  });

  // SVGs are already small and lose fidelity through a canvas; pass them through.
  if (file.type === "image/svg+xml") {
    return { id: nanoid(8), src: raw, name: file.name };
  }

  try {
    const src = await downscale(raw);
    return { id: nanoid(8), src, name: file.name };
  } catch {
    return { id: nanoid(8), src: raw, name: file.name };
  }
}

function downscale(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
      if (scale === 1) return resolve(dataUrl);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("no 2d context"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.86));
    };
    img.onerror = () => reject(new Error("decode failed"));
    img.src = dataUrl;
  });
}
