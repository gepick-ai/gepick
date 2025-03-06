import { spawn } from "node:child_process"
import { CommandModule } from 'yargs';

export default <CommandModule>{
  command: 'dev',
  describe: 'dev Package',
  builder: {
    target: {
      type: 'string',
      demandOption: true,
      describe: 'Target package to compile',
    },
  },
  handler: async (argv) => {
    const target = argv.target as string;

    const args = ['run', 'dev', '--scope', `@gepick/${target}`];
    spawn('lerna', args, { stdio: 'inherit', shell: true });
  },
}
