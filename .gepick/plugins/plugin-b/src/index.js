import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const gepick = require("@gepick/plugin-api");

export async function activate() {
  gepick.commands.registerCommand({ id: "plugin-b" }, () => {
    // eslint-disable-next-line no-console
    console.log("你好～成功调用Plugin B🏅");
  });
}
