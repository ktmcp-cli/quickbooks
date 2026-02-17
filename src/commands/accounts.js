import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { requireAuth } from '../config.js';
import { query, getEntity } from '../api.js';
import { printTable, printKeyValue, formatCurrency, printJSON } from '../output.js';

export function makeAccountsCommand() {
  const accounts = new Command('accounts').description('Manage QuickBooks chart of accounts');

  accounts
    .command('list')
    .description('List accounts')
    .option('-l, --limit <n>', 'Maximum number of results', '50')
    .option('--type <type>', 'Filter by account type (Bank, Accounts Receivable, etc.)')
    .option('--json', 'Output raw JSON')
    .action(async (options) => {
      requireAuth();
      const spinner = ora('Fetching accounts...').start();
      try {
        let sql;
        if (options.type) {
          sql = `SELECT * FROM Account WHERE AccountType = '${options.type}' ORDERBY Name MAXRESULTS ${parseInt(options.limit)}`;
        } else {
          sql = `SELECT * FROM Account ORDERBY Name MAXRESULTS ${parseInt(options.limit)}`;
        }

        const result = await query(sql);
        const items = result?.Account || [];
        spinner.stop();

        if (options.json) {
          printJSON(items);
          return;
        }

        printTable(items, [
          { key: 'Id', label: 'ID', maxWidth: 8 },
          { key: 'Name', label: 'Name', maxWidth: 35 },
          { key: 'AccountType', label: 'Type', maxWidth: 25 },
          { key: 'AccountSubType', label: 'Sub-Type', maxWidth: 25 },
          { key: 'CurrentBalance', label: 'Balance', maxWidth: 14 },
          { key: 'Active', label: 'Active', maxWidth: 8 },
        ]);
      } catch (err) {
        spinner.fail('Failed to fetch accounts');
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });

  accounts
    .command('get <account-id>')
    .description('Get a specific account by ID')
    .option('--json', 'Output raw JSON')
    .action(async (accountId, options) => {
      requireAuth();
      const spinner = ora(`Fetching account ${accountId}...`).start();
      try {
        const account = await getEntity('Account', accountId);
        spinner.stop();

        if (options.json) {
          printJSON(account);
          return;
        }

        console.log(chalk.bold(`\nAccount: ${account.Name}`));
        console.log(chalk.dim('─'.repeat(50)));
        printKeyValue({
          'ID': account.Id,
          'Name': account.Name,
          'Type': account.AccountType,
          'Sub-Type': account.AccountSubType,
          'Balance': formatCurrency(account.CurrentBalance),
          'Currency': account.CurrencyRef?.value || 'USD',
          'Account Number': account.AcctNum || 'N/A',
          'Description': account.Description || 'N/A',
          'Active': account.Active ? 'Yes' : 'No',
        });
      } catch (err) {
        spinner.fail('Failed to fetch account');
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });

  return accounts;
}
