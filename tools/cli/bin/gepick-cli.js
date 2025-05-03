import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import(path.resolve(__dirname, "./preload/register.js"))
  .then(() => {
    import(path.resolve(__dirname, "../dist"));
  });
