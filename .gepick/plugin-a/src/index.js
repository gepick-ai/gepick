import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const gepick = require("@gepick/plugin-api");

export async function activate() {
  gepick.commands.registerCommand({ id: "hello-plugin-a" }, () => {
    // eslint-disable-next-line no-console
    console.log("成功执行plugin a的hello-plugin-a命令");
  });
}
