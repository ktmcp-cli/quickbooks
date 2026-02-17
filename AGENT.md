# QuickBooks CLI — AI Agent Usage Guide

This document describes how AI agents (Claude, GPT, etc.) can use `@ktmcp-cli/quickbooks` to interact with QuickBooks Online.

## Overview

The QuickBooks CLI provides structured, scriptable access to the QuickBooks Online API. Every command supports `--json` output for easy parsing by agents.

## Authentication Setup

Before using the CLI, configure credentials. As an agent, you should check if credentials are already set:

```bash
quickbooks auth status
```

If not configured, ask the user for their credentials and set them:

```bash
quickbooks config set \
  --client-id "$QB_CLIENT_ID" \
  --client-secret "$QB_CLIENT_SECRET" \
  --realm-id "$QB_REALM_ID" \
  --access-token "$QB_ACCESS_TOKEN" \
  --refresh-token "$QB_REFRESH_TOKEN"
```

## Common Agent Workflows

### 1. Retrieve and summarize recent invoices

```bash
# Get last 20 invoices as JSON
quickbooks invoices list --limit 20 --json

# Get open invoices only
quickbooks invoices list --status Open --limit 50 --json

# Parse total outstanding balance
quickbooks invoices list --status Open --limit 100 --json | \
  jq '[.[].Balance | tonumber] | add'
```

### 2. Customer lookup

```bash
# Search by name
quickbooks customers list --search "Acme" --json

# Get full customer record
quickbooks customers get 42 --json
```

### 3. Create an invoice programmatically

```bash
quickbooks invoices create \
  --customer-id 42 \
  --line-items '[{"Amount":1000,"Description":"Monthly retainer","DetailType":"SalesItemLineDetail","SalesItemLineDetail":{"ItemRef":{"value":"1"},"Qty":1,"UnitPrice":1000}}]' \
  --due-date 2024-03-01 \
  --json
```

### 4. Financial reporting

```bash
# Profit & Loss for Q1
quickbooks reports profit-loss \
  --start-date 2024-01-01 \
  --end-date 2024-03-31 \
  --json

# Balance sheet as of today
quickbooks reports balance-sheet --json

# Cash flow for the year
quickbooks reports cash-flow \
  --start-date 2024-01-01 \
  --end-date 2024-12-31 \
  --json
```

### 5. Accounts payable workflow

```bash
# List unpaid bills
quickbooks bills list --json | jq '[.[] | select(.Balance > 0)]'

# Get vendor details
quickbooks vendors list --json
quickbooks vendors get 15 --json
```

## JSON Output Schema

All `--json` responses follow the QuickBooks Online API response format. Key fields:

### Invoice

```json
{
  "Id": "123",
  "DocNumber": "1001",
  "CustomerRef": { "value": "42", "name": "Acme Corp" },
  "TxnDate": "2024-01-15",
  "DueDate": "2024-02-15",
  "TotalAmt": 1500.00,
  "Balance": 1500.00,
  "TxnStatus": "Open",
  "Line": [...]
}
```

### Customer

```json
{
  "Id": "42",
  "DisplayName": "Acme Corp",
  "CompanyName": "Acme Corporation",
  "PrimaryEmailAddr": { "Address": "billing@acme.com" },
  "Balance": 3500.00,
  "Active": true
}
```

### Report (Profit & Loss)

```json
{
  "Header": {
    "ReportName": "ProfitAndLoss",
    "StartPeriod": "2024-01-01",
    "EndPeriod": "2024-12-31",
    "ReportBasis": "Accrual"
  },
  "Rows": { "Row": [...] }
}
```

## Error Handling

The CLI exits with code 1 on errors. Check for error output on stderr:

```bash
result=$(quickbooks invoices get 999 --json 2>&1)
if [ $? -ne 0 ]; then
  echo "Error: $result"
fi
```

## Rate Limits

QuickBooks Online API has rate limits:
- 500 requests per minute per realm
- 10 concurrent requests per realm

The CLI does not implement automatic retrying. Agents should add delays between bulk operations.

## Token Management

Access tokens expire after 1 hour. Refresh tokens expire after 100 days.

```bash
# Check token status
quickbooks auth status

# Refresh token (requires refresh token to be configured)
quickbooks auth refresh
```

## Sandbox vs Production

Use sandbox for testing without affecting real data:

```bash
# Switch to sandbox
quickbooks config set --sandbox

# Switch to production
quickbooks config set --no-sandbox
```

Or use `QB_SANDBOX=true` environment variable.

## Environment Variables Reference

| Variable | Description |
|---|---|
| `QB_CLIENT_ID` | OAuth 2.0 Client ID |
| `QB_CLIENT_SECRET` | OAuth 2.0 Client Secret |
| `QB_REALM_ID` | QuickBooks Company (Realm) ID |
| `QB_ACCESS_TOKEN` | OAuth 2.0 Access Token |
| `QB_REFRESH_TOKEN` | OAuth 2.0 Refresh Token |
| `QB_SANDBOX` | Use sandbox environment (`true`/`false`) |

## Tips for Agents

1. Always use `--json` for parsing — human-readable output may change between versions
2. Use `jq` to filter and transform JSON output
3. Cache customer/vendor IDs when doing bulk operations
4. Check `quickbooks auth status` before starting a workflow
5. For large datasets, use `--limit` and implement pagination by filtering by date ranges
6. Reports return nested structures — use `--json` and navigate with `jq` path expressions
