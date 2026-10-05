#!/usr/bin/env node
import { Command, Option } from 'commander';
import { init, cliVersion } from './commands/init';
import { CancelledError, CliError } from './shared/errors';
import { InitOptions } from './shared/types';

const program = new Command().name('kritzel').description('Install Kritzel into an existing application.').version(cliVersion());
program.command('init')
  .description('Install framework-specific editor or engine dependencies; optionally generate a TypeScript canvas.')
  .addOption(new Option('--framework <framework>').choices(['angular', 'react', 'vue']))
  .addOption(new Option('--component <component>').choices(['editor', 'engine']))
  .addOption(new Option('--package-manager <manager>').choices(['npm', 'pnpm', 'yarn']))
  .option('--cwd <directory>', 'Application or workspace discovery directory', process.cwd())
  .option('--generate-component', 'Generate a new TypeScript canvas component')
  .option('--output <directory>', 'Component directory relative to the application')
  .option('--kritzel-version <version>', 'Exact stable Kritzel release (default: CLI version)')
  .option('--yes', 'Accept unambiguous defaults without confirmation; never overwrite files')
  .action(async (options: InitOptions) => { await init(options); });

program.parseAsync().catch((error: unknown) => {
  if (error instanceof CancelledError) { console.error(error.message); process.exitCode = 130; }
  else if (error instanceof CliError) { console.error(`Kritzel: ${error.message}`); process.exitCode = 1; }
  else { console.error('Unexpected Kritzel CLI failure:', error); process.exitCode = 1; }
});
