import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { requireAuth } from '../config.js';
import { query, getEntity } from '../api.js';
import { printTable, printKeyValue, formatCurrency, formatDate, printJSON } from '../output.js';

export function makePaymentsCommand() {
  const payments = new Command('payments').description('Manage QuickBooks payments');

  payments
    .command('list')
    .description('List customer payments')
    .option('-l, --limit <n>', 'Maximum number of results', '20')
    .option('--customer-id <id>', 'Filter by customer ID')
    .option('--json', 'Output raw JSON')
    .action(async (options) => {
      requireAuth();
      const spinner = ora('Fetching payments...').start();
      try {
        let sql;
        if (options.customerId) {
          sql = `SELECT * FROM Payment WHERE CustomerRef = '${options.customerId}' ORDERBY TxnDate DESC MAXRESULTS ${parseInt(options.limit)}`;
        } else {
          sql = `SELECT * FROM Payment ORDERBY TxnDate DESC MAXRESULTS ${parseInt(options.limit)}`;
        }

        const result = await query(sql);
        const items = result?.Payment || [];
        spinner.stop();

        if (options.json) {
          printJSON(items);
          return;
        }

        printTable(items, [
          { key: 'Id', label: 'ID', maxWidth: 8 },
          { key: 'CustomerRef.name', label: 'Customer', maxWidth: 30 },
          { key: 'TxnDate', label: 'Date', maxWidth: 12 },
          { key: 'TotalAmt', label: 'Amount', maxWidth: 12 },
          { key: 'UnappliedAmt', label: 'Unapplied', maxWidth: 12 },
          { key: 'PaymentMethodRef.name', label: 'Method', maxWidth: 15 },
        ]);
      } catch (err) {
        spinner.fail('Failed to fetch payments');
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });

  payments
    .command('get <payment-id>')
    .description('Get a specific payment by ID')
    .option('--json', 'Output raw JSON')
    .action(async (paymentId, options) => {
      requireAuth();
      const spinner = ora(`Fetching payment ${paymentId}...`).start();
      try {
        const payment = await getEntity('Payment', paymentId);
        spinner.stop();

        if (options.json) {
          printJSON(payment);
          return;
        }

        console.log(chalk.bold(`\nPayment ID: ${payment.Id}`));
        console.log(chalk.dim('─'.repeat(50)));
        printKeyValue({
          'ID': payment.Id,
          'Customer': payment.CustomerRef?.name,
          'Date': formatDate(payment.TxnDate),
          'Amount': formatCurrency(payment.TotalAmt),
          'Unapplied': formatCurrency(payment.UnappliedAmt),
          'Payment Method': payment.PaymentMethodRef?.name || 'N/A',
          'Reference #': payment.PaymentRefNum || 'N/A',
          'Memo': payment.PrivateNote || 'N/A',
        });
      } catch (err) {
        spinner.fail('Failed to fetch payment');
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });

  return payments;
}
