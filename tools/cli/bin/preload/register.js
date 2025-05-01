import { register } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
register(path.resolve(__dirname, './loader.js'), pathToFileURL('./'));
