import { spawn } from "node:child_process";
import path from "node:path";
import { createRequire } from "node:module";
import { CommandModule } from 'yargs';
import fsExtra from 'fs-extra';
import { createVitest } from 'vitest/node';

export default <CommandModule>{
  command: 'test',
  describe: 'test Package',
  builder: {
    dir: {
      type: 'string',
      default: "all",
      describe: 'dir to test',
      choices: ["common", "browser", "node", "all"],
    },
    watch: {
      type: 'boolean',
      default: true,
      describe: "watch test",
    },
  },

  handler: async (argv) => {
    const require = createRequire(import.meta.url);
    const vitestCli = path.resolve(require.resolve('vitest').split("index.cjs")[0], './vitest.mjs');
    const curPackage = process.cwd();

    const packageJson = fsExtra.readJSONSync(`${curPackage}/package.json`);

    if (packageJson.name === '@gepick/monorepo') {
      const vitest = await createVitest('test', {
        watch: Boolean(argv.watch) ?? true,
        passWithNoTests: true,
        globals: true,
        workspace: [
          "packages/*",
          {
            test: {
              dir: 'test/browser',
              environment: 'jsdom',
            },
          },
          {
            test: {
              dir: "test/common",
              environment: 'node',
            },
          },
          {
            test: {
              dir: "test/node",
              environment: 'node',
            },
          },
        ],
        coverage: {
          enabled: true,
          provider: 'istanbul',
          reporter: ['html', 'json', 'json-summary', 'text'],
        },
      });

      await vitest.start();
      if (!argv.watch) {
        await vitest.close();
      }
    }
    else {
      const args = ['--config', `${curPackage}/vitest.config.ts`];

      if (argv.dir && argv.dir !== 'all') {
        args.push('--project', argv.dir.toString());
      }

      if (fsExtra.existsSync(`${curPackage}/vitest.config.ts`)) {
        spawn(vitestCli, args, { stdio: 'inherit', shell: true });
      }
    }
  },
};

// function findMonorepoRoot() {
//   let root = finder().next().filename;

//   while (root && fsExtra.readJSONSync(root).name !== '@gepick/monorepo') {
//     root = finder(path.resolve(root, "../..")).next().filename;
//   }

//   return root;
// }
