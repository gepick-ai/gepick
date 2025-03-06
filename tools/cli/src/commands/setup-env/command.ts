import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CommandModule } from 'yargs';
import { findUpSync } from 'find-up';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default <CommandModule>{
  command: 'setup-env',
  describe: 'Setup Application Environment',
  handler: () => {
    const composeFile = findUpSync('docker-compose.yml', { cwd: __dirname });

    if (!composeFile) {
      throw new Error('Could not find docker-compose.yml');
    }

    spawn('docker-compose', ['-f', composeFile, 'up', '-d'], {
      stdio: 'inherit',
      shell: true,
    });
  },
}
