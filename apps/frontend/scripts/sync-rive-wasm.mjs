// Copie le runtime WASM de Rive depuis node_modules vers public/rive/.
// GameProgress.tsx auto-héberge ce wasm (RuntimeLoader.setWasmUrl) pour ne pas
// dépendre du CDN unpkg, bloqué sur les réseaux filtrés (écoles) ou par la CSP.
// Sans cette synchro, un upgrade de @rive-app/react-canvas laisse un wasm périmé
// en face du JS : le .riv échoue à l'import avec "Problem loading file; may be corrupt!".
import { createRequire } from "node:module";
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const src = join(dirname(require.resolve("@rive-app/canvas/package.json")), "rive.wasm");
const destDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "rive");
const dest = join(destDir, "rive.wasm");

const version = JSON.parse(readFileSync(require.resolve("@rive-app/canvas/package.json"), "utf8")).version;

mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
console.log(`[rive] wasm synchronisé (@rive-app/canvas@${version}) -> public/rive/rive.wasm`);
