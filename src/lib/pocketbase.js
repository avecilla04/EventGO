import PocketBase from "pocketbase";

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || "http://127.0.0.1:8090");

// Cada pantalla controla sus propias peticiones; la autocancelación del SDK
// solo producía errores falsos ("The request was autocancelled").
pb.autoCancellation(false);

export default pb;
