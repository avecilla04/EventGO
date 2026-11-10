import { supabase, COVERS_BUCKET } from "@/lib/supabase";

const MAX_SIDE = 1600;
const QUALITY = 0.82;

/**
 * Reduce la imagen a un máximo de 1600 px y la convierte a WebP en el navegador.
 * Una foto de móvil de 4 MB queda en unos 200-300 KB: carga mucho más rápido.
 * Los GIF se suben tal cual para no perder la animación.
 */
export async function compressImage(file) {
  if (file.type === "image/gif") return file;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", QUALITY));
  // Si el navegador no sabe generar WebP o el resultado es mayor, nos quedamos con el original.
  if (!blob || blob.type !== "image/webp" || blob.size >= file.size) return file;
  return new File([blob], "cover.webp", { type: "image/webp" });
}

/** Sube la portada a la carpeta del usuario y devuelve su ruta en el almacenamiento. */
export async function uploadCover(userId, file) {
  const image = await compressImage(file);
  const ext = image.type === "image/webp" ? "webp" : (image.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(COVERS_BUCKET)
    .upload(path, image, { contentType: image.type, cacheControl: "31536000", upsert: false });
  if (error) throw error;
  return path;
}

/** Borra portadas que ya no se usan (no falla si no existen). */
export async function removeCovers(paths) {
  const list = paths.filter(Boolean);
  if (list.length) await supabase.storage.from(COVERS_BUCKET).remove(list);
}
