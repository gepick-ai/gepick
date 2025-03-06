/* eslint-disable no-console */
import path from "node:path"
import { CommandModule } from 'yargs';
import { rimraf } from 'rimraf';
import chalk from 'chalk';

export default <CommandModule>{
  command: 'clean',
  describe: 'Clean Package(s)',
  builder: {
    target: {
      type: 'string',
      describe: 'Target package to clean',
    },
  },
  handler: (argv) => {
    const target = argv.target as string;
    const pathsToDelete = [];

    if (['client', 'server'].includes(target)) {
      pathsToDelete.push(...[
        `apps/${target}/tsconfig.tsbuildinfo`,
        `apps/${target}/dist`,
        `apps/${target}/lib`,
      ])
    }

    if (['shared', 'auth', 'copilot', 'user'].includes(target)) {
      pathsToDelete.push(...[
        `packages/${target}/tsconfig.tsbuildinfo`,
        `packages/${target}/dist`,
        `packages/${target}/lib`,
      ])
    }

    if (pathsToDelete.length === 0) {
      pathsToDelete.push(...['apps/**/tsconfig.tsbuildinfo', 'apps/**/dist', 'apps/**/lib', 'packages/**/tsconfig.tsbuildinfo', 'packages/**/dist', 'packages/**/lib'])
    }

    cleanFiles(pathsToDelete);

    function cleanFiles(files: string[]) {
      files.forEach(async (pattern) => {
        pattern = path.join(process.cwd(), pattern);

        try {
          await rimraf(pattern, { glob: true });

          console.log(chalk.green(`✔ ${pattern} deleted successfully.`));
        }
        catch (err) {
          console.warn(chalk.red(`✖ Error clean files: ${(err as Error).message}`));
        }
      },
      );
    }
  },
}
