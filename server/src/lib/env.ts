import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Loads `server/.env` relative to this module rather than the current working
 * directory. This keeps configuration working when the server is started from
 * the repository root (`node server/dist/index.js`) as well as from `server/`.
 *
 * Existing environment variables are not overridden by dotenv.
 */
const serverRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

config({ path: resolve(serverRoot, ".env") });
