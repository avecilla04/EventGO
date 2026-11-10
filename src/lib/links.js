/** Devuelve la URL solo si es http(s); evita enlaces "javascript:" u otros esquemas. */
export const safeWebsite = (value) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
};

/** Añade https:// si el comerciante escribe "mibar.com". */
export const normalizeWebsite = (value) => {
  const v = (value || "").trim();
  if (!v) return "";
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
};

/** "@mibar", "mibar" o "https://instagram.com/mibar" -> { handle, url } */
export const instagramUrl = (value) => {
  const handle = String(value || "")
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/\/.*$/, "");
  if (!/^[A-Za-z0-9._]{1,30}$/.test(handle)) return null;
  return { handle, url: `https://instagram.com/${handle}` };
};
