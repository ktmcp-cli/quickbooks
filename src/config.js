import Conf from 'conf';
import chalk from 'chalk';

const conf = new Conf({
  projectName: 'quickbooks-cli',
  schema: {
    clientId: { type: 'string' },
    clientSecret: { type: 'string' },
    realmId: { type: 'string' },
    accessToken: { type: 'string' },
    refreshToken: { type: 'string' },
    tokenExpiry: { type: 'number' },
    sandbox: { type: 'boolean', default: false },
  },
});

export function getConfig() {
  return {
    clientId: process.env.QB_CLIENT_ID || conf.get('clientId'),
    clientSecret: process.env.QB_CLIENT_SECRET || conf.get('clientSecret'),
    realmId: process.env.QB_REALM_ID || conf.get('realmId'),
    accessToken: process.env.QB_ACCESS_TOKEN || conf.get('accessToken'),
    refreshToken: process.env.QB_REFRESH_TOKEN || conf.get('refreshToken'),
    tokenExpiry: conf.get('tokenExpiry'),
    sandbox: process.env.QB_SANDBOX === 'true' || conf.get('sandbox') || false,
  };
}

export function setConfig(values) {
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null) {
      conf.set(key, value);
    }
  }
}

export function requireAuth() {
  const config = getConfig();
  const missing = [];

  if (!config.clientId) missing.push('clientId (--client-id or QB_CLIENT_ID)');
  if (!config.clientSecret) missing.push('clientSecret (--client-secret or QB_CLIENT_SECRET)');
  if (!config.realmId) missing.push('realmId (--realm-id or QB_REALM_ID)');

  if (missing.length > 0) {
    console.error(chalk.red('Missing required configuration:'));
    missing.forEach(m => console.error(chalk.yellow(`  • ${m}`)));
    console.error(chalk.dim('\nRun: quickbooks config set --client-id <id> --client-secret <secret> --realm-id <id>'));
    console.error(chalk.dim('Or set environment variables: QB_CLIENT_ID, QB_CLIENT_SECRET, QB_REALM_ID, QB_ACCESS_TOKEN'));
    process.exit(1);
  }

  if (!config.accessToken) {
    console.error(chalk.red('No access token found.'));
    console.error(chalk.dim('Set QB_ACCESS_TOKEN environment variable or run the OAuth flow.'));
    console.error(chalk.dim('Run: quickbooks auth login'));
    process.exit(1);
  }

  return config;
}

export function showConfig() {
  const config = getConfig();
  return {
    clientId: config.clientId ? config.clientId.slice(0, 8) + '...' : '(not set)',
    clientSecret: config.clientSecret ? '***' : '(not set)',
    realmId: config.realmId || '(not set)',
    accessToken: config.accessToken ? config.accessToken.slice(0, 16) + '...' : '(not set)',
    refreshToken: config.refreshToken ? config.refreshToken.slice(0, 16) + '...' : '(not set)',
    sandbox: config.sandbox,
  };
}

export { conf };
