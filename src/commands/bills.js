import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { requireAuth } from '../config.js';
import { query, getEntity, createEntity } from '../api.js';
import { printTable, printKeyValue, printSuccess, formatCurrency, formatDate, printJSON } from '../output.js';

export function makeBillsCommand() {
  const bills = new Command('bills').description('Manage QuickBooks bills');

  bills
    .command('list')
    .description('List bills')
    .option('-l, --limit <n>', 'Maximum number of results', '20')
    .option('--vendor-id <id>', 'Filter by vendor ID')
    .option('--json', 'Output raw JSON')
    .action(async (options) => {
      requireAuth();
      const spinner = ora('Fetching bills...').start();
      try {
        let sql;
        if (options.vendorId) {
          sql = `SELECT * FROM Bill WHERE VendorRef = '${options.vendorId}' ORDERBY MetaData.LastUpdatedTime DESC MAXRESULTS ${parseInt(options.limit)}`;
        } else {
          sql = `SELECT * FROM Bill ORDERBY MetaData.LastUpdatedTime DESC MAXRESULTS ${parseInt(options.limit)}`;
        }

        const result = await query(sql);
        const items = result?.Bill || [];
        spinner.stop();

        if (options.json) {
          printJSON(items);
          return;
        }

        printTable(items, [
          { key: 'Id', label: 'ID', maxWidth: 8 },
          { key: 'DocNumber', label: 'Bill #', maxWidth: 14 },
          { key: 'VendorRef.name', label: 'Vendor', maxWidth: 30 },
          { key: 'TxnDate', label: 'Date', maxWidth: 12 },
          { key: 'DueDate', label: 'Due Date', maxWidth: 12 },
          { key: 'TotalAmt', label: 'Total', maxWidth: 12 },
          { key: 'Balance', label: 'Balance', maxWidth: 12 },
        ]);
      } catch (err) {
        spinner.fail('Failed to fetch bills');
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });

  bills
    .command('get <bill-id>')
    .description('Get a specific bill by ID')
    .option('--json', 'Output raw JSON')
    .action(async (billId, options) => {
      requireAuth();
      const spinner = ora(`Fetching bill ${billId}...`).start();
      try {
        const bill = await getEntity('Bill', billId);
        spinner.stop();

        if (options.json) {
          printJSON(bill);
          return;
        }

        console.log(chalk.bold(`\nBill #${bill.DocNumber || bill.Id}`));
        console.log(chalk.dim('─'.repeat(50)));
        printKeyValue({
          'ID': bill.Id,
          'Bill #': bill.DocNumber,
          'Vendor': bill.VendorRef?.name,
          'Date': formatDate(bill.TxnDate),
          'Due Date': formatDate(bill.DueDate),
          'Total': formatCurrency(bill.TotalAmt),
          'Balance Due': formatCurrency(bill.Balance),
          'Currency': bill.CurrencyRef?.value || 'USD',
        });

        if (bill.Line && bill.Line.length > 0) {
          console.log(chalk.bold('\nLine Items:'));
          printTable(bill.Line, [
            { key: 'LineNum', label: '#', maxWidth: 4 },
            { key: 'Description', label: 'Description', maxWidth: 40 },
            { key: 'Amount', label: 'Amount', maxWidth: 12 },
          ]);
        }
      } catch (err) {
        spinner.fail('Failed to fetch bill');
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });

  return bills;
}
