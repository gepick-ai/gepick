/* eslint-disable no-console */
import { spawn } from "node:child_process"
import path from 'node:path';
import { createRequire } from 'node:module';
import fs from 'node:fs';
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

    spawn(tscPath, args, { stdio: "inherit", shell: true });

    const srcStylePath = path.resolve(process.cwd(), 'src/browser/style');

    // 判断style目录是否存在
    if (fs.existsSync(srcStylePath)) {
      copyfiles([`src/browser/style/**/*`, `lib/browser`], { up: 2 }, (err) => {
        if (err) {
          console.warn(chalk.red(`✖ Error copying files: ${err.message}`));
        }
        else {
          console.log(chalk.green('✔ Style files copied successfully.'));
        }
      });
    }
  },
}
