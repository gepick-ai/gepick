import { IApplication, IPreferencesManager } from "@gepick/core/browser";
import { moduleLoadReady } from "./app";

async function main() {
  try {
    moduleLoadReady
      .then((container) => {
        container.get<IApplication>(IApplication).start();
        return container;
      }).then(async (container) => {
        await container.get<IPreferencesManager>(IPreferencesManager).ready;
      });
  }
  catch (err) {
    console.error((err as Error).stack);
  }
}

main();
