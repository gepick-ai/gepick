import { spawn } from "node:child_process";
import path from "node:path";
import { createRequire } from "node:module";
import { CommandModule } from 'yargs';
import fsExtra from 'fs-extra';
import { Vitest, startVitest } from 'vitest/node';
import { glob } from 'glob';

export type TestEnv = 'browser' | 'common' | 'node' | 'all';

export default <CommandModule>{
  command: 'test',
  describe: 'test Package',
  builder: {
    env: {
      type: 'string',
      default: "all",
      describe: 'env to test',
      choices: ["common", "browser", "node", "all"],
      alias: 'e',
    },
    watch: {
      type: 'boolean',
      default: true,
      describe: "watch test",
      alias: 'w',
    },
  },

  handler: async (argv) => {
    const require = createRequire(import.meta.url);
    const vitestCli = path.resolve(require.resolve('vitest').split("index.cjs")[0], './vitest.mjs');
    const curPackage = process.cwd();

    const packageJson = fsExtra.readJSONSync(`${curPackage}/package.json`);
    let vitest: Vitest;

    if (packageJson.name === '@gepick/monorepo') {
      const watch = argv.watch as boolean;
      const env = argv.env as TestEnv;
      if (env !== 'all') {
        const envs = {
          browser: 'jsdom',
          common: 'node',
          node: 'node',
        };

        const testDirs = glob.sync(`packages/*/src/${env}`, { cwd: curPackage });
        const testConfigs = testDirs.map((dir: string) => ({
          test: {
            name: `${dir.slice(0, dir.indexOf(`/src/${env}`)).replace('packages', '@gepick')}`,
            dir,
            environment: envs[env],
          },
        }));
        vitest = await startVitest('test', [], {
          watch,
          passWithNoTests: true,
          globals: true,
          workspace: [
            ...testConfigs,
          ],
        });
      }
      else {
        vitest = await startVitest('test', [], {
          workspace: [
            "packages/*",
            {
              test: {
                dir: 'src/browser',
                environment: 'jsdom',
              },
            },
            {
              test: {
                dir: "src/common",
                environment: 'node',
              },
            },
            {
              test: {
                dir: "src/node",
                environment: 'node',
              },
            },
          ],
        });
      }

      if (vitest && !argv.watch) {
        await vitest.close();
      }
    }
    else {
      const args = ['--config', `${curPackage}/vitest.config.ts`];
      const env = argv.env as TestEnv;

      if (argv.env && argv.env !== 'all') {
        args.push('--project', env);
      }

      if (fsExtra.existsSync(`${curPackage}/vitest.config.ts`)) {
        spawn(vitestCli, args, { stdio: 'inherit', shell: true });
      }
    }
  },
};

// function findPackageRoot(packageName: string) {
//   const curCwd = process.cwd();

//   if (packageName !== '@gepick/monorepo') {
//     const require = createRequire(import.meta.url);
//     let moduleRootPath = require.resolve(packageName);
//     if (!fsExtra.statSync(moduleRootPath).isDirectory()) {
//       moduleRootPath = path.dirname(moduleRootPath);
//     }
//     process.chdir(moduleRootPath);
//   }

//   let root = finder().next().filename;

//   while (root && fsExtra.readJSONSync(root).name !== packageName) {
//     root = finder(path.resolve(root, "../..")).next().filename;
//   }

//   // 我们在查找完成后要将process cwd还原
//   process.chdir(curCwd);
//   return root ? path.dirname(root) : root;
// }
