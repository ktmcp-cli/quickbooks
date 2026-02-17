import { Command } from 'commander';
import chalk from 'chalk';
import { getConfig, setConfig, showConfig } from '../config.js';

export function makeConfigCommand() {
  const config = new Command('config').description('Manage QuickBooks CLI configuration');

  config
    .command('set')
    .description('Set configuration values')
    .option('--client-id <id>', 'OAuth 2.0 Client ID')
    .option('--client-secret <secret>', 'OAuth 2.0 Client Secret')
    .option('--realm-id <id>', 'QuickBooks Company ID (realm ID)')
    .option('--access-token <token>', 'OAuth 2.0 Access Token')
    .option('--refresh-token <token>', 'OAuth 2.0 Refresh Token')
    .option('--sandbox', 'Use sandbox environment')
    .option('--no-sandbox', 'Use production environment')
    .action((options) => {
      const updates = {};
      if (options.clientId) updates.clientId = options.clientId;
      if (options.clientSecret) updates.clientSecret = options.clientSecret;
      if (options.realmId) updates.realmId = options.realmId;
      if (options.accessToken) updates.accessToken = options.accessToken;
      if (options.refreshToken) updates.refreshToken = options.refreshToken;
      if (options.sandbox !== undefined) updates.sandbox = options.sandbox;

      if (Object.keys(updates).length === 0) {
        console.error(chalk.yellow('No values provided. Use --client-id, --client-secret, --realm-id, etc.'));
        process.exit(1);
      }

      setConfig(updates);
      console.log(chalk.green('✓') + ' Configuration saved.');

      if (updates.clientId) console.log(chalk.dim(`  clientId: ${updates.clientId.slice(0, 8)}...`));
      if (updates.clientSecret) console.log(chalk.dim('  clientSecret: ***'));
      if (updates.realmId) console.log(chalk.dim(`  realmId: ${updates.realmId}`));
      if (updates.accessToken) console.log(chalk.dim('  accessToken: set'));
      if (updates.refreshToken) console.log(chalk.dim('  refreshToken: set'));
      if (updates.sandbox !== undefined) console.log(chalk.dim(`  sandbox: ${updates.sandbox}`));
    });

  config
    .command('get')
    .description('Show current configuration')
    .action(() => {
      const cfg = showConfig();
      console.log(chalk.bold('QuickBooks CLI Configuration:\n'));
      for (const [key, value] of Object.entries(cfg)) {
        console.log(`  ${chalk.cyan(key.padEnd(14))} ${value}`);
      }
      console.log();
      console.log(chalk.dim('Config file location: use `quickbooks config path` to see'));
    });

  config
    .command('path')
    .description('Show configuration file path')
    .action(async () => {
      const { conf } = await import('../config.js');
      console.log(conf.path);
    });

  config
    .command('clear')
    .description('Clear all stored configuration')
    .action(async () => {
      const { conf } = await import('../config.js');
      conf.clear();
      console.log(chalk.green('✓') + ' Configuration cleared.');
    });

  return config;
}
