/**
 * Update generated api md files with Jekyll macros and create index page
 */

import { updateApiDocs } from "../update-api-md-docs";

const silent = process.argv.includes('--silent');
const dryRun = process.argv.includes('--dry-run');

async function main() {
  await updateApiDocs({ silent, dryRun });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
