/* eslint-disable no-console */
import { spawn } from "node:child_process";
import path from 'node:path';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import fsExtra from "fs-extra";
import { CommandModule } from 'yargs';
import copyfiles from 'copyfiles';
import chalk from 'chalk';

export default <CommandModule>{
  command: 'compile',
  describe: 'Compile Package',
  builder: {
    watch: {
      type: 'boolean',
      default: false,
      describe: 'Watch mode',
    },
  },
  handler: (argv) => {
    const require = createRequire(import.meta.url);
    const tscPath = path.resolve(require.resolve('typescript'), '../../bin/tsc');
    const args = ['-b'];
    if (argv.watch) {
      args.push('--watch');
    }

    const tsPath = path.resolve("tsconfig.json");

    if (isRootConfig(tsPath)) {
      return handleRootConfig(tsPath);
    }

    spawn(tscPath, args, { stdio: "inherit", shell: true });

    const srcStylePath = path.resolve(process.cwd(), 'src/browser/style');

    // 判断style目录是否存在
    if (fs.existsSync(srcStylePath)) {
      copyfiles([`src/browser/style/**/*`, `dist/browser`], { up: 2 }, (err) => {
        if (err) {
          console.warn(chalk.red(`✖ Error copying files: ${err.message}`));
        }
        else {
          console.log(chalk.green('✔ Style files copied successfully.'));
        }
      });
    }
  },
};

function isRootConfig(tsPath: string): boolean {
  const tsconfig = fsExtra.readJSONSync(tsPath) as { root?: boolean; references: { path: string }[] };

  return tsconfig.root ?? false;
}

function handleRootConfig(tsPath: string) {
  if (fsExtra.existsSync(tsPath)) {
    const tsconfig = fsExtra.readJSONSync(tsPath) as { root?: boolean; references: { path: string }[] };
    const refs = tsconfig.references;

    const packages = refs.map(({ path }) => {
      let pkgName = path.split('./packages/')[1];
      if (!pkgName) {
        pkgName = path.split('./tools/')[1];
      }

      return pkgName;
    }).filter(pkgName => !!pkgName);

    packages.forEach((pkgName) => {
      const pkg = `@gepick/${pkgName}`;

      spawn('yarn', ['workspace', pkg, 'build'], { stdio: "inherit", shell: true });
    });

    return;
  }

  throw new Error(`tsconfig ${tsPath} not found.`);
}
