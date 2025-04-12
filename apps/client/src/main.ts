import { IApplication } from "@gepick/core/browser";
import { moduleLoadReady } from "./app";

async function main() {
  try {
    moduleLoadReady
      .then((container) => {
        container.get<IApplication>(IApplication).start();
      });
  }
  catch (err) {
    console.error((err as Error).stack);
  }
}

main();
