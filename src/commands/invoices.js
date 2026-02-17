import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { requireAuth } from '../config.js';
import { query, getEntity, createEntity } from '../api.js';
import { printTable, printKeyValue, printSuccess, formatCurrency, formatDate, printJSON } from '../output.js';

export function makeInvoicesCommand() {
  const invoices = new Command('invoices').description('Manage QuickBooks invoices');

  invoices
    .command('list')
    .description('List invoices')
    .option('-l, --limit <n>', 'Maximum number of results', '20')
    .option('--status <status>', 'Filter by status (Open, Paid, Voided)')
    .option('--customer-id <id>', 'Filter by customer ID')
    .option('--json', 'Output raw JSON')
    .action(async (options) => {
      requireAuth();
      const spinner = ora('Fetching invoices...').start();
      try {
        let sql = `SELECT * FROM Invoice ORDERBY MetaData.LastUpdatedTime DESC MAXRESULTS ${parseInt(options.limit)}`;
        const conditions = [];
        if (options.status) conditions.push(`TxnStatus = '${options.status}'`);
        if (options.customerId) conditions.push(`CustomerRef = '${options.customerId}'`);
        if (conditions.length > 0) {
          sql = `SELECT * FROM Invoice WHERE ${conditions.join(' AND ')} ORDERBY MetaData.LastUpdatedTime DESC MAXRESULTS ${parseInt(options.limit)}`;
        }

        const result = await query(sql);
        const items = result?.Invoice || [];
        spinner.stop();

        if (options.json) {
          printJSON(items);
          return;
        }

        printTable(items, [
          { key: 'Id', label: 'ID', maxWidth: 8 },
          { key: 'DocNumber', label: 'Invoice #', maxWidth: 12 },
          { key: 'CustomerRef.name', label: 'Customer', maxWidth: 30 },
          { key: 'TxnDate', label: 'Date', maxWidth: 12 },
          { key: 'DueDate', label: 'Due Date', maxWidth: 12 },
          { key: 'TotalAmt', label: 'Total', maxWidth: 12 },
          { key: 'Balance', label: 'Balance', maxWidth: 12 },
        ]);
      } catch (err) {
        spinner.fail('Failed to fetch invoices');
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });

  invoices
    .command('get <invoice-id>')
    .description('Get a specific invoice by ID')
    .option('--json', 'Output raw JSON')
    .action(async (invoiceId, options) => {
      requireAuth();
      const spinner = ora(`Fetching invoice ${invoiceId}...`).start();
      try {
        const invoice = await getEntity('Invoice', invoiceId);
        spinner.stop();

        if (options.json) {
          printJSON(invoice);
          return;
        }

        console.log(chalk.bold(`\nInvoice #${invoice.DocNumber || invoice.Id}`));
        console.log(chalk.dim('─'.repeat(50)));
        printKeyValue({
          'ID': invoice.Id,
          'Invoice #': invoice.DocNumber,
          'Customer': invoice.CustomerRef?.name,
          'Date': formatDate(invoice.TxnDate),
          'Due Date': formatDate(invoice.DueDate),
          'Status': invoice.TxnStatus || (invoice.Balance === 0 ? 'Paid' : 'Open'),
          'Total': formatCurrency(invoice.TotalAmt),
          'Balance Due': formatCurrency(invoice.Balance),
          'Currency': invoice.CurrencyRef?.value || 'USD',
        });

        if (invoice.Line && invoice.Line.length > 0) {
          console.log(chalk.bold('\nLine Items:'));
          const lineItems = invoice.Line.filter(l => l.DetailType !== 'SubTotalLineDetail');
          printTable(lineItems, [
            { key: 'LineNum', label: '#', maxWidth: 4 },
            { key: 'Description', label: 'Description', maxWidth: 40 },
            { key: 'Amount', label: 'Amount', maxWidth: 12 },
          ]);
        }
      } catch (err) {
        spinner.fail('Failed to fetch invoice');
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });

  invoices
    .command('create')
    .description('Create a new invoice')
    .requiredOption('--customer-id <id>', 'Customer ID (CustomerRef)')
    .option('--line-items <json>', 'Line items as JSON array', '[]')
    .option('--due-date <date>', 'Due date (YYYY-MM-DD)')
    .option('--txn-date <date>', 'Transaction date (YYYY-MM-DD)')
    .option('--memo <memo>', 'Private memo / notes')
    .option('--customer-memo <memo>', 'Customer-facing memo')
    .option('--json', 'Output raw JSON')
    .action(async (options) => {
      requireAuth();
      const spinner = ora('Creating invoice...').start();
      try {
        let lineItems;
        try {
          lineItems = JSON.parse(options.lineItems);
        } catch {
          spinner.fail('Invalid JSON for --line-items');
          console.error(chalk.red('Provide line items as a valid JSON array.'));
          console.error(chalk.dim('Example: --line-items \'[{"Amount":100,"Description":"Service","DetailType":"SalesItemLineDetail","SalesItemLineDetail":{"ItemRef":{"value":"1"},"Qty":1,"UnitPrice":100}}]\''));
          process.exit(1);
        }

        const data = {
          CustomerRef: { value: options.customerId },
          Line: lineItems,
        };

        if (options.dueDate) data.DueDate = options.dueDate;
        if (options.txnDate) data.TxnDate = options.txnDate;
        if (options.memo) data.PrivateNote = options.memo;
        if (options.customerMemo) data.CustomerMemo = { value: options.customerMemo };

        const invoice = await createEntity('Invoice', data);
        spinner.stop();

        if (options.json) {
          printJSON(invoice);
          return;
        }

        printSuccess(`Invoice created successfully!`);
        printKeyValue({
          'ID': invoice.Id,
          'Invoice #': invoice.DocNumber,
          'Customer': invoice.CustomerRef?.name,
          'Total': formatCurrency(invoice.TotalAmt),
          'Due Date': formatDate(invoice.DueDate),
        });
      } catch (err) {
        spinner.fail('Failed to create invoice');
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });

  return invoices;
}
