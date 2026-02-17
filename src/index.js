import 'dotenv/config';
import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { makeConfigCommand } from './commands/config.js';
import { makeAuthCommand } from './commands/auth.js';
import { makeInvoicesCommand } from './commands/invoices.js';
import { makeCustomersCommand } from './commands/customers.js';
import { makeVendorsCommand } from './commands/vendors.js';
import { makeAccountsCommand } from './commands/accounts.js';
import { makeBillsCommand } from './commands/bills.js';
import { makePaymentsCommand } from './commands/payments.js';
import { makeReportsCommand } from './commands/reports.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let version = '1.0.0';
try {
  const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));
  version = pkg.version;
} catch {}

const program = new Command();

program
  .name('quickbooks')
  .description(
    chalk.bold('QuickBooks Online CLI') + '\n' +
    chalk.dim('Unofficial CLI for the QuickBooks Online API\n') +
    chalk.dim('Docs: https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/account')
  )
  .version(version)
  .addHelpText('after', `
${chalk.bold('Quick Start:')}
  ${chalk.cyan('quickbooks auth login')}              # Show OAuth setup instructions
  ${chalk.cyan('quickbooks config set \\')}
    ${chalk.cyan('--client-id YOUR_ID \\')}
    ${chalk.cyan('--client-secret YOUR_SECRET \\')}
    ${chalk.cyan('--realm-id YOUR_REALM_ID \\')}
    ${chalk.cyan('--access-token YOUR_TOKEN')}

${chalk.bold('Examples:')}
  ${chalk.cyan('quickbooks invoices list --limit 10')}
  ${chalk.cyan('quickbooks customers list --search "Acme"')}
  ${chalk.cyan('quickbooks reports profit-loss --start-date 2024-01-01 --end-date 2024-12-31')}
  ${chalk.cyan('quickbooks invoices get 123 --json | jq .TotalAmt')}

${chalk.bold('Environment Variables:')}
  ${chalk.yellow('QB_CLIENT_ID')}         OAuth 2.0 Client ID
  ${chalk.yellow('QB_CLIENT_SECRET')}     OAuth 2.0 Client Secret
  ${chalk.yellow('QB_REALM_ID')}          QuickBooks Company (Realm) ID
  ${chalk.yellow('QB_ACCESS_TOKEN')}      OAuth 2.0 Access Token
  ${chalk.yellow('QB_REFRESH_TOKEN')}     OAuth 2.0 Refresh Token
  ${chalk.yellow('QB_SANDBOX')}           Use sandbox environment (true/false)
`);

program.addCommand(makeConfigCommand());
program.addCommand(makeAuthCommand());
program.addCommand(makeInvoicesCommand());
program.addCommand(makeCustomersCommand());
program.addCommand(makeVendorsCommand());
program.addCommand(makeAccountsCommand());
program.addCommand(makeBillsCommand());
program.addCommand(makePaymentsCommand());
program.addCommand(makeReportsCommand());

program.parseAsync(process.argv).catch((err) => {
  console.error(chalk.red('Error:'), err.message);
  process.exit(1);
});
