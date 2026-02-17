import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { requireAuth } from '../config.js';
import { getReport } from '../api.js';
import { printJSON } from '../output.js';

function printReportRow(row, depth = 0) {
  const indent = '  '.repeat(depth);
  if (!row || !row.ColData) return;

  const cols = row.ColData;
  const label = cols[0]?.value || '';
  const value = cols[1]?.value || '';

  if (!label && !value) return;

  if (label) {
    const paddedLabel = indent + label;
    const paddedValue = value ? chalk.cyan(value.padStart(20 - depth * 2)) : '';
    console.log(`${paddedLabel.padEnd(45)} ${paddedValue}`);
  }
}

function renderSection(section, depth = 0) {
  if (!section) return;

  const indent = '  '.repeat(depth);

  if (section.Header?.ColData) {
    const headerText = section.Header.ColData[0]?.value || '';
    if (headerText) {
      console.log(chalk.bold(`\n${indent}${headerText}`));
      console.log(chalk.dim(indent + '─'.repeat(Math.max(40 - depth * 2, 10))));
    }
  }

  if (section.Rows?.Row) {
    const rows = Array.isArray(section.Rows.Row) ? section.Rows.Row : [section.Rows.Row];
    for (const row of rows) {
      if (row.Rows || row.Summary) {
        renderSection(row, depth + 1);
      } else {
        printReportRow(row, depth);
      }
    }
  }

  if (section.Summary?.ColData) {
    const summaryLabel = section.Summary.ColData[0]?.value || '';
    const summaryValue = section.Summary.ColData[1]?.value || '';
    if (summaryLabel || summaryValue) {
      console.log(chalk.bold(`${indent}${summaryLabel.padEnd(45 - depth * 2)} ${chalk.green(summaryValue.padStart(20 - depth * 2))}`));
    }
  }
}

export function makeReportsCommand() {
  const reports = new Command('reports').description('QuickBooks financial reports');

  reports
    .command('profit-loss')
    .description('Profit & Loss report')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--accounting-method <method>', 'Cash or Accrual', 'Accrual')
    .option('--json', 'Output raw JSON')
    .action(async (options) => {
      requireAuth();
      const spinner = ora('Fetching Profit & Loss report...').start();
      try {
        const params = {
          accounting_method: options.accountingMethod,
        };
        if (options.startDate) params.start_date = options.startDate;
        if (options.endDate) params.end_date = options.endDate;

        const report = await getReport('ProfitAndLoss', params);
        spinner.stop();

        if (options.json) {
          printJSON(report);
          return;
        }

        console.log(chalk.bold.green(`\n${report.Header?.ReportName || 'Profit & Loss'}`));
        console.log(chalk.dim(`Period: ${report.Header?.StartPeriod || 'N/A'} to ${report.Header?.EndPeriod || 'N/A'}`));
        console.log(chalk.dim(`Basis: ${report.Header?.ReportBasis || options.accountingMethod}`));

        if (report.Rows?.Row) {
          const rows = Array.isArray(report.Rows.Row) ? report.Rows.Row : [report.Rows.Row];
          for (const row of rows) {
            renderSection(row, 0);
          }
        }
      } catch (err) {
        spinner.fail('Failed to fetch report');
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });

  reports
    .command('balance-sheet')
    .description('Balance Sheet report')
    .option('--as-of <date>', 'As of date (YYYY-MM-DD)')
    .option('--accounting-method <method>', 'Cash or Accrual', 'Accrual')
    .option('--json', 'Output raw JSON')
    .action(async (options) => {
      requireAuth();
      const spinner = ora('Fetching Balance Sheet report...').start();
      try {
        const params = {
          accounting_method: options.accountingMethod,
        };
        if (options.asOf) params.as_of = options.asOf;

        const report = await getReport('BalanceSheet', params);
        spinner.stop();

        if (options.json) {
          printJSON(report);
          return;
        }

        console.log(chalk.bold.green(`\n${report.Header?.ReportName || 'Balance Sheet'}`));
        console.log(chalk.dim(`As of: ${report.Header?.EndPeriod || 'N/A'}`));

        if (report.Rows?.Row) {
          const rows = Array.isArray(report.Rows.Row) ? report.Rows.Row : [report.Rows.Row];
          for (const row of rows) {
            renderSection(row, 0);
          }
        }
      } catch (err) {
        spinner.fail('Failed to fetch report');
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });

  reports
    .command('cash-flow')
    .description('Cash Flow statement')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--json', 'Output raw JSON')
    .action(async (options) => {
      requireAuth();
      const spinner = ora('Fetching Cash Flow report...').start();
      try {
        const params = {};
        if (options.startDate) params.start_date = options.startDate;
        if (options.endDate) params.end_date = options.endDate;

        const report = await getReport('CashFlow', params);
        spinner.stop();

        if (options.json) {
          printJSON(report);
          return;
        }

        console.log(chalk.bold.green(`\n${report.Header?.ReportName || 'Cash Flow'}`));
        console.log(chalk.dim(`Period: ${report.Header?.StartPeriod || 'N/A'} to ${report.Header?.EndPeriod || 'N/A'}`));

        if (report.Rows?.Row) {
          const rows = Array.isArray(report.Rows.Row) ? report.Rows.Row : [report.Rows.Row];
          for (const row of rows) {
            renderSection(row, 0);
          }
        }
      } catch (err) {
        spinner.fail('Failed to fetch report');
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });

  reports
    .command('ar-aging')
    .description('Accounts Receivable Aging report')
    .option('--as-of <date>', 'As of date (YYYY-MM-DD)')
    .option('--json', 'Output raw JSON')
    .action(async (options) => {
      requireAuth();
      const spinner = ora('Fetching A/R Aging report...').start();
      try {
        const params = {};
        if (options.asOf) params.as_of = options.asOf;

        const report = await getReport('AgedReceivables', params);
        spinner.stop();

        if (options.json) {
          printJSON(report);
          return;
        }

        console.log(chalk.bold.green(`\n${report.Header?.ReportName || 'A/R Aging'}`));
        if (report.Rows?.Row) {
          const rows = Array.isArray(report.Rows.Row) ? report.Rows.Row : [report.Rows.Row];
          for (const row of rows) {
            renderSection(row, 0);
          }
        }
      } catch (err) {
        spinner.fail('Failed to fetch report');
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });

  return reports;
}
