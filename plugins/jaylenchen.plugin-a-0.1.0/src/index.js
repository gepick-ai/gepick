import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const gepick = require("@gepick/plugin-api");

export async function activate() {
  // eslint-disable-next-line no-console
  console.log("activate plugin a");
  gepick.commands.registerCommand({ id: "plugin-a" }, () => {
    // eslint-disable-next-line no-console
    console.log("感谢调用Plugin A🎉");
  });
}
