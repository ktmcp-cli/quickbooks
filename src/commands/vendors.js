import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { requireAuth } from '../config.js';
import { query, getEntity } from '../api.js';
import { printTable, printKeyValue, formatCurrency, printJSON } from '../output.js';

export function makeVendorsCommand() {
  const vendors = new Command('vendors').description('Manage QuickBooks vendors');

  vendors
    .command('list')
    .description('List vendors')
    .option('-l, --limit <n>', 'Maximum number of results', '20')
    .option('-s, --search <name>', 'Search by vendor name')
    .option('--json', 'Output raw JSON')
    .action(async (options) => {
      requireAuth();
      const spinner = ora('Fetching vendors...').start();
      try {
        let sql;
        if (options.search) {
          sql = `SELECT * FROM Vendor WHERE DisplayName LIKE '%${options.search}%' ORDERBY DisplayName MAXRESULTS ${parseInt(options.limit)}`;
        } else {
          sql = `SELECT * FROM Vendor ORDERBY DisplayName MAXRESULTS ${parseInt(options.limit)}`;
        }

        const result = await query(sql);
        const items = result?.Vendor || [];
        spinner.stop();

        if (options.json) {
          printJSON(items);
          return;
        }

        printTable(items, [
          { key: 'Id', label: 'ID', maxWidth: 8 },
          { key: 'DisplayName', label: 'Name', maxWidth: 35 },
          { key: 'PrimaryEmailAddr.Address', label: 'Email', maxWidth: 30 },
          { key: 'PrimaryPhone.FreeFormNumber', label: 'Phone', maxWidth: 18 },
          { key: 'Balance', label: 'Balance', maxWidth: 12 },
          { key: 'Active', label: 'Active', maxWidth: 8 },
        ]);
      } catch (err) {
        spinner.fail('Failed to fetch vendors');
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });

  vendors
    .command('get <vendor-id>')
    .description('Get a specific vendor by ID')
    .option('--json', 'Output raw JSON')
    .action(async (vendorId, options) => {
      requireAuth();
      const spinner = ora(`Fetching vendor ${vendorId}...`).start();
      try {
        const vendor = await getEntity('Vendor', vendorId);
        spinner.stop();

        if (options.json) {
          printJSON(vendor);
          return;
        }

        console.log(chalk.bold(`\nVendor: ${vendor.DisplayName}`));
        console.log(chalk.dim('─'.repeat(50)));
        printKeyValue({
          'ID': vendor.Id,
          'Display Name': vendor.DisplayName,
          'Company': vendor.CompanyName,
          'Email': vendor.PrimaryEmailAddr?.Address,
          'Phone': vendor.PrimaryPhone?.FreeFormNumber,
          'Balance': formatCurrency(vendor.Balance),
          'Tax ID': vendor.TaxIdentifier || 'N/A',
          'Active': vendor.Active ? 'Yes' : 'No',
        });
      } catch (err) {
        spinner.fail('Failed to fetch vendor');
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });

  return vendors;
}
