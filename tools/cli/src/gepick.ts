import fs from "node:fs";
import path from "node:path"
import { fileURLToPath } from 'node:url';
import yargs, { Argv } from 'yargs';
import { findUp } from 'find-up';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function setupCommands(cli: Argv): Promise<void> {
  const cmds = await Promise.all([
    import("@gepick/cli/commands/clean/command"),
    import("@gepick/cli/commands/setup-env/command"),
    import("@gepick/cli/commands/compile/command"),
    import("@gepick/cli/commands/build/command"),
    import("@gepick/cli/commands/dev/command"),
  ])

  cmds.forEach(cmd => cli.command(cmd.default));
}

export async function gepickCli(): Promise<void> {
  const pkgJsonPath = await findUp('package.json', { cwd: __dirname });
  if (!pkgJsonPath) {
    throw new Error('Could not find package.json');
  }
  const { version } = await fs.promises.readFile(pkgJsonPath, 'utf8').then(JSON.parse);

  const cli = yargs(process.argv.slice(2)).scriptName('gepick').version(version);

  await setupCommands(cli);

  cli
    .parserConfiguration({
      'unknown-options-as-args': true,
    })
    .strictCommands()
    .demandCommand(1, 'Please run a command')
    .fail((msg, err, cli) => {
      process.exitCode = 1;
      if (err) {
        // One of the handlers threw an error:
        console.error(err);
      }
      else {
        // Yargs detected a problem with commands and/or arguments while parsing:
        cli.showHelp();
        console.error(msg);
      }
    })
    .parse();
}

process.on('unhandledRejection', (reason) => {
  throw reason;
});

process.on('uncaughtException', (error) => {
  if (error) {
    console.error('Uncaught Exception: ', error.toString());
    if (error.stack) {
      console.error(error.stack);
    }
  }
  process.exit(1);
});

gepickCli()
