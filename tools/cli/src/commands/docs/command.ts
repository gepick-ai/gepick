import path from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createRequire } from 'module';
import { fileURLToPath } from "node:url";
import { CommandModule } from "yargs";
import { API_DOCUMENTER_ENTRY, runExtractorForMonorepo } from "@gepick/ts-docs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const MONOREPO_ROOT = path.dirname(require.resolve("@gepick/monorepo/package.json"));
// const APIDOCS_ROOT = path.join(MONOREPO_ROOT, 'docs/\');
// const SITE_APIDOCS_ROOT = path.join(MONOREPO_ROOT, 'docs/site/apidocs');

export default <CommandModule>{
  command: 'docs',
  describe: "generate api docs",
  handler: async () => {
    // #region monorepo api extractor
    await runExtractorForMonorepo({
      rootDir: MONOREPO_ROOT,
      silent: true,
      apiDocsGenerationPath: 'docs/apidocs',
      apiReportEnabled: true,
    });
    // #endregion

    // #region monorepo api documenter
    // const args = [
    //   'markdown',
    //   '-i',
    //   path.join(APIDOCS_ROOT, 'models'),
    //   '-o',
    //   SITE_APIDOCS_ROOT,
    // ];
    // process.chdir(path.join(__dirname, '../../..'));
    // const childProcess = spawn(API_DOCUMENTER_ENTRY, args, { stdio: "inherit", shell: true });
    // await once(childProcess, 'close');
    // #enregion
  },
};
