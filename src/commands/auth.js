import { Command } from 'commander';
import chalk from 'chalk';
import { getConfig, setConfig, showConfig } from '../config.js';
import { refreshAccessToken } from '../api.js';
import ora from 'ora';

export function makeAuthCommand() {
  const auth = new Command('auth').description('Manage QuickBooks OAuth authentication');

  auth
    .command('status')
    .description('Show authentication status')
    .action(() => {
      const cfg = showConfig();
      const config = getConfig();

      console.log(chalk.bold('\nAuthentication Status\n'));

      const hasCredentials = !!(config.clientId && config.clientSecret && config.realmId);
      const hasToken = !!config.accessToken;
      const tokenExpired = config.tokenExpiry && Date.now() > config.tokenExpiry;

      console.log(`  Credentials: ${hasCredentials ? chalk.green('✓ configured') : chalk.red('✗ missing')}`);
      console.log(`  Access Token: ${hasToken ? (tokenExpired ? chalk.yellow('⚠ expired') : chalk.green('✓ present')) : chalk.red('✗ missing')}`);
      console.log(`  Refresh Token: ${config.refreshToken ? chalk.green('✓ present') : chalk.yellow('✗ missing')}`);
      console.log(`  Environment: ${config.sandbox ? chalk.yellow('Sandbox') : chalk.green('Production')}`);

      if (config.tokenExpiry) {
        const expiry = new Date(config.tokenExpiry);
        console.log(`  Token Expiry: ${expiry.toLocaleString()}`);
      }

      console.log();
      if (!hasCredentials) {
        console.log(chalk.yellow('Run: quickbooks config set --client-id <id> --client-secret <secret> --realm-id <id>'));
      }
      if (!hasToken) {
        console.log(chalk.yellow('Set QB_ACCESS_TOKEN environment variable or configure OAuth tokens.'));
      }
    });

  auth
    .command('refresh')
    .description('Refresh the access token using the refresh token')
    .action(async () => {
      const config = getConfig();

      if (!config.refreshToken) {
        console.error(chalk.red('No refresh token configured.'));
        console.error(chalk.dim('Set QB_REFRESH_TOKEN or run: quickbooks config set --refresh-token <token>'));
        process.exit(1);
      }

      const spinner = ora('Refreshing access token...').start();
      try {
        await refreshAccessToken();
        spinner.succeed('Access token refreshed successfully!');
      } catch (err) {
        spinner.fail('Failed to refresh token');
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });

  auth
    .command('login')
    .description('Display OAuth 2.0 setup instructions')
    .action(() => {
      console.log(chalk.bold('\nQuickBooks OAuth 2.0 Setup\n'));
      console.log('To authenticate with QuickBooks Online:\n');
      console.log(chalk.bold('1. Create an Intuit Developer App:'));
      console.log('   https://developer.intuit.com/app/developer/myapps\n');
      console.log(chalk.bold('2. Get your credentials:'));
      console.log('   • Client ID and Client Secret from your app settings');
      console.log('   • Realm ID (Company ID) from QuickBooks Online\n');
      console.log(chalk.bold('3. Complete the OAuth flow to get tokens:'));
      console.log('   • Authorization URL: https://appcenter.intuit.com/connect/oauth2');
      console.log('   • Required scopes: com.intuit.quickbooks.accounting\n');
      console.log(chalk.bold('4. Configure the CLI:'));
      console.log(chalk.cyan('   quickbooks config set \\'));
      console.log(chalk.cyan('     --client-id YOUR_CLIENT_ID \\'));
      console.log(chalk.cyan('     --client-secret YOUR_CLIENT_SECRET \\'));
      console.log(chalk.cyan('     --realm-id YOUR_REALM_ID \\'));
      console.log(chalk.cyan('     --access-token YOUR_ACCESS_TOKEN \\'));
      console.log(chalk.cyan('     --refresh-token YOUR_REFRESH_TOKEN\n'));
      console.log(chalk.bold('5. Or use environment variables:'));
      console.log('   QB_CLIENT_ID, QB_CLIENT_SECRET, QB_REALM_ID');
      console.log('   QB_ACCESS_TOKEN, QB_REFRESH_TOKEN\n');
      console.log(chalk.dim('Note: Access tokens expire after 1 hour. Use `quickbooks auth refresh` to renew.'));
      console.log(chalk.dim('Refresh tokens expire after 100 days.'));
    });

  return auth;
}
