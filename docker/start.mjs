// Lanceur du conteneur : rend le volume de données accessible à l'utilisateur
// non-root (uid 1001), abandonne les droits root, puis démarre le serveur Next.js.
import { chownSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";

const UID = 1001;
const GID = 1001;
const dataDir = process.env.DATA_DIR || "/app/data";

function chownRecursive(dir) {
  chownSync(dir, UID, GID);
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) chownRecursive(p);
    else chownSync(p, UID, GID);
  }
}

mkdirSync(dataDir, { recursive: true });
if (process.getuid?.() === 0) {
  chownRecursive(dataDir);
  process.setgid(GID);
  process.setuid(UID);
}

await import("/app/server.js");
