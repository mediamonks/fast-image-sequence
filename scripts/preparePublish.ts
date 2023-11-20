import { join } from 'node:path';
import shell from 'shelljs';

/**
 * This script is run before publishing the package to npm.
 * It copies over the package.json and README.md files to the dist folder.
 * It also removes the 'dist/' from the 'exports' field in the package.json.
 *
 * This is needed because the remapping of paths in the 'exports' field
 * is not properly supported by editors like VSCode and WebStorm when
 * using auto-import or auto-complete.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention,no-underscore-dangle
import { fileURLToPath } from 'url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
const projectFolder = join(__dirname, '..');

// eslint-disable-next-line unicorn/prevent-abbreviations
const distFolder = join(projectFolder, 'dist');

// include all paths (files or folders) that should be copied over to the dist folder on publish
// this should likely be in sync with the 'files' field in the package.json
const filesToPublish = ['package.json', 'README.md', 'LICENSE'];

for (const file of filesToPublish) {
  shell.cp('-R', join(projectFolder, file), join(distFolder, file));
}

// remove the 'dist' folder from all fields in the package.json
// it might replace it in areas other than the 'exports' field, but that's fine since it only uses those fields
shell.sed('-i', 'dist/', '', join(distFolder, 'package.json'));
