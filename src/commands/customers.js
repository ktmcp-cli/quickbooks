import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { requireAuth } from '../config.js';
import { query, getEntity, createEntity } from '../api.js';
import { printTable, printKeyValue, printSuccess, formatCurrency, printJSON } from '../output.js';

export function makeCustomersCommand() {
  const customers = new Command('customers').description('Manage QuickBooks customers');

  customers
    .command('list')
    .description('List customers')
    .option('-l, --limit <n>', 'Maximum number of results', '20')
    .option('-s, --search <name>', 'Search by customer name')
    .option('--active-only', 'Show only active customers')
    .option('--json', 'Output raw JSON')
    .action(async (options) => {
      requireAuth();
      const spinner = ora('Fetching customers...').start();
      try {
        let sql;
        const conditions = [];

        if (options.search) {
          conditions.push(`DisplayName LIKE '%${options.search}%'`);
        }
        if (options.activeOnly) {
          conditions.push(`Active = true`);
        }

        if (conditions.length > 0) {
          sql = `SELECT * FROM Customer WHERE ${conditions.join(' AND ')} ORDERBY DisplayName MAXRESULTS ${parseInt(options.limit)}`;
        } else {
          sql = `SELECT * FROM Customer ORDERBY DisplayName MAXRESULTS ${parseInt(options.limit)}`;
        }

        const result = await query(sql);
        const items = result?.Customer || [];
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
        spinner.fail('Failed to fetch customers');
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });

  customers
    .command('get <customer-id>')
    .description('Get a specific customer by ID')
    .option('--json', 'Output raw JSON')
    .action(async (customerId, options) => {
      requireAuth();
      const spinner = ora(`Fetching customer ${customerId}...`).start();
      try {
        const customer = await getEntity('Customer', customerId);
        spinner.stop();

        if (options.json) {
          printJSON(customer);
          return;
        }

        console.log(chalk.bold(`\nCustomer: ${customer.DisplayName}`));
        console.log(chalk.dim('─'.repeat(50)));
        printKeyValue({
          'ID': customer.Id,
          'Display Name': customer.DisplayName,
          'Company': customer.CompanyName,
          'Email': customer.PrimaryEmailAddr?.Address,
          'Phone': customer.PrimaryPhone?.FreeFormNumber,
          'Mobile': customer.Mobile?.FreeFormNumber,
          'Balance': formatCurrency(customer.Balance),
          'Active': customer.Active ? 'Yes' : 'No',
        });

        if (customer.BillAddr) {
          console.log(chalk.bold('\nBilling Address:'));
          printKeyValue({
            'Line 1': customer.BillAddr.Line1,
            'City': customer.BillAddr.City,
            'State': customer.BillAddr.CountrySubDivisionCode,
            'Postal Code': customer.BillAddr.PostalCode,
            'Country': customer.BillAddr.Country,
          });
        }
      } catch (err) {
        spinner.fail('Failed to fetch customer');
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });

  customers
    .command('create')
    .description('Create a new customer')
    .requiredOption('--name <name>', 'Customer display name')
    .option('--email <email>', 'Primary email address')
    .option('--phone <phone>', 'Primary phone number')
    .option('--company <company>', 'Company name')
    .option('--given-name <name>', 'First name')
    .option('--family-name <name>', 'Last name')
    .option('--json', 'Output raw JSON')
    .action(async (options) => {
      requireAuth();
      const spinner = ora('Creating customer...').start();
      try {
        const data = {
          DisplayName: options.name,
        };

        if (options.email) data.PrimaryEmailAddr = { Address: options.email };
        if (options.phone) data.PrimaryPhone = { FreeFormNumber: options.phone };
        if (options.company) data.CompanyName = options.company;
        if (options.givenName) data.GivenName = options.givenName;
        if (options.familyName) data.FamilyName = options.familyName;

        const customer = await createEntity('Customer', data);
        spinner.stop();

        if (options.json) {
          printJSON(customer);
          return;
        }

        printSuccess(`Customer created successfully!`);
        printKeyValue({
          'ID': customer.Id,
          'Name': customer.DisplayName,
          'Email': customer.PrimaryEmailAddr?.Address || 'N/A',
        });
      } catch (err) {
        spinner.fail('Failed to create customer');
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });

  return customers;
}
