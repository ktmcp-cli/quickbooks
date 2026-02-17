import chalk from 'chalk';

export function printTable(data, columns) {
  if (!data || data.length === 0) {
    console.log(chalk.yellow('No results found.'));
    return;
  }

  // Calculate column widths
  const widths = {};
  for (const col of columns) {
    widths[col.key] = col.label.length;
    for (const row of data) {
      const val = String(getNestedValue(row, col.key) ?? '');
      widths[col.key] = Math.max(widths[col.key], val.length);
    }
    widths[col.key] = Math.min(widths[col.key], col.maxWidth || 40);
  }

  // Header
  const header = columns.map(col => col.label.padEnd(widths[col.key])).join('  ');
  const separator = columns.map(col => '-'.repeat(widths[col.key])).join('  ');
  console.log(chalk.bold.cyan(header));
  console.log(chalk.dim(separator));

  // Rows
  for (const row of data) {
    const line = columns.map(col => {
      const val = String(getNestedValue(row, col.key) ?? '');
      const truncated = val.length > (col.maxWidth || 40) ? val.slice(0, (col.maxWidth || 37) - 3) + '...' : val;
      return truncated.padEnd(widths[col.key]);
    }).join('  ');
    console.log(line);
  }

  console.log(chalk.dim(`\n${data.length} result${data.length !== 1 ? 's' : ''}`));
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((curr, key) => curr?.[key], obj);
}

export function printJSON(data) {
  console.log(JSON.stringify(data, null, 2));
}

export function printSuccess(message) {
  console.log(chalk.green('✓') + ' ' + message);
}

export function printError(message) {
  console.error(chalk.red('✗') + ' ' + message);
}

export function printInfo(message) {
  console.log(chalk.blue('ℹ') + ' ' + message);
}

export function printKeyValue(data, indent = 0) {
  const prefix = ' '.repeat(indent);
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'object' && !Array.isArray(value)) {
      console.log(chalk.dim(prefix + key + ':'));
      printKeyValue(value, indent + 2);
    } else if (Array.isArray(value)) {
      console.log(chalk.dim(prefix + key + ':') + chalk.yellow(` [${value.length} items]`));
    } else {
      console.log(chalk.dim(prefix + key + ':') + ' ' + chalk.white(String(value)));
    }
  }
}

export function formatCurrency(amount, currencyCode = 'USD') {
  if (amount === undefined || amount === null) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
}

export function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return dateStr;
}
