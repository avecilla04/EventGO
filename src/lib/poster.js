import QRCode from "qrcode";

/** Enlace que lleva el QR: abre el local y lo sigue (ver VenueDetailPage). */
export const followUrl = (venueId) => `${window.location.origin}/local/${venueId}?seguir=1`;

const W = 1240;
const H = 1754; // proporción A4 / A5
const INK = "#15131D";
const ACCENT = "#FF5A3C";

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Escribe texto centrado, partiendo en varias líneas si no cabe. Devuelve la y final. */
function centeredText(ctx, text, y, maxWidth, lineHeight, maxLines = 2) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  const shown = lines.slice(0, maxLines);
  if (lines.length > maxLines) shown[maxLines - 1] = `${shown[maxLines - 1].replace(/\s+\S*$/, "")}…`;
  shown.forEach((l, i) => ctx.fillText(l, W / 2, y + i * lineHeight));
  return y + (shown.length - 1) * lineHeight;
}

// Trazos del icono "ticket" de lucide-react (viewBox 24x24).
const TICKET_PATHS = [
  "M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z",
  "M13 5v2",
  "M13 17v2",
  "M13 11v2",
];

/** Cuadrado tinta con el ticket coral girado, como el logo de la app. */
function drawLogoMark(ctx, x, y, size) {
  roundRect(ctx, x, y, size, size, size * 0.26);
  ctx.fillStyle = INK;
  ctx.fill();
  const icon = size * 0.55;
  ctx.save();
  ctx.translate(x + size / 2, y + size / 2);
  ctx.rotate((-12 * Math.PI) / 180);
  ctx.scale(icon / 24, icon / 24);
  ctx.translate(-12, -12);
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  TICKET_PATHS.forEach((d) => ctx.stroke(new Path2D(d)));
  ctx.restore();
}

async function loadImage(src) {
  const img = new Image();
  img.src = src;
  await img.decode();
  return img;
}

/** Dibuja el cartel del local y devuelve el canvas. */
export async function drawPoster(venue) {
  const url = followUrl(venue.id);
  await Promise.all([
    document.fonts.load('800 100px "Bricolage Grotesque Variable"'),
    document.fonts.load('600 40px "Inter Variable"'),
  ]).catch(() => {});

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Fondo tinta con resplandores
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);
  const glow = (x, y, r, color) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(21,19,29,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  };
  glow(W * 0.9, 0, 900, "rgba(255,90,60,0.45)");
  glow(0, H, 900, "rgba(124,92,255,0.30)");

  // Logo (marca + nombre, centrados como bloque)
  ctx.font = '800 56px "Bricolage Grotesque Variable", "Inter Variable", sans-serif';
  const logoText = ctx.measureText("EventGo").width;
  const markSize = 76;
  const logoX = (W - (markSize + 22 + logoText)) / 2;
  roundRect(ctx, logoX - 4, 116, markSize + 8, markSize + 8, 24);
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fill();
  drawLogoMark(ctx, logoX, 120, markSize);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.fillText("EventGo", logoX + markSize + 22, 178);
  ctx.textAlign = "center";

  // Titular
  ctx.font = '800 108px "Bricolage Grotesque Variable", "Inter Variable", sans-serif';
  ctx.fillStyle = "#ffffff";
  ctx.fillText("¿Te gusta", W / 2, 360);
  ctx.fillStyle = ACCENT;
  ctx.fillText("este sitio?", W / 2, 470);

  ctx.font = '500 40px "Inter Variable", sans-serif';
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.fillText("Síguelo en EventGo y no te pierdas", W / 2, 560);
  ctx.fillText("sus próximos planes.", W / 2, 612);

  // Tarjeta blanca con el QR
  const card = 700;
  const cx = (W - card) / 2;
  const cy = 680;
  const qrSize = card - 120;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 20;
  roundRect(ctx, cx, cy, card, card, 56);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();

  const qrData = await QRCode.toDataURL(url, {
    errorCorrectionLevel: "H",
    margin: 0,
    width: qrSize,
    color: { dark: INK, light: "#ffffff" },
  });
  const qr = await loadImage(qrData);
  ctx.drawImage(qr, cx + 60, cy + 60, qrSize, qrSize);

  // Marca en el centro del QR (la corrección de errores "H" lo permite)
  const badge = 124;
  roundRect(ctx, W / 2 - badge / 2, cy + card / 2 - badge / 2, badge, badge, 30);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  drawLogoMark(ctx, W / 2 - 48, cy + card / 2 - 48, 96);

  // Nombre del local: reduce la letra si no cabe en una línea (hasta 2 líneas)
  let size = 76;
  const maxW = W - 200;
  ctx.font = `800 ${size}px "Bricolage Grotesque Variable", "Inter Variable", sans-serif`;
  while (size > 52 && ctx.measureText(venue.name).width > maxW) {
    size -= 4;
    ctx.font = `800 ${size}px "Bricolage Grotesque Variable", "Inter Variable", sans-serif`;
  }
  ctx.fillStyle = "#ffffff";
  const nameY = cy + card + 40 + size;
  const endY = centeredText(ctx, venue.name, nameY, maxW, size * 1.08, 2);
  if (venue.address) {
    ctx.font = '500 32px "Inter Variable", sans-serif';
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    centeredText(ctx, venue.address, endY + 58, W - 240, 40, 1);
  }

  // Pasos
  ctx.font = '600 32px "Inter Variable", sans-serif';
  ctx.fillStyle = ACCENT;
  ctx.fillText("Apunta con la cámara del móvil  ·  Gratis", W / 2, H - 64);

  return canvas;
}

export function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}
