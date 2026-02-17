![Banner](https://raw.githubusercontent.com/ktmcp-cli/quickbooks/main/banner.svg)

> "Six months ago, everyone was talking about MCPs. And I was like, screw MCPs. Every MCP would be better as a CLI."
>
> — [Peter Steinberger](https://twitter.com/steipete), Founder of OpenClaw
> [Watch on YouTube (~2:39:00)](https://www.youtube.com/@lexfridman) | [Lex Fridman Podcast #491](https://lexfridman.com/peter-steinberger/)

# QuickBooks CLI

A production-ready, unofficial command-line interface for the **QuickBooks Online API**. Manage invoices, customers, vendors, accounts, bills, payments, and run financial reports — all from your terminal.

> **Disclaimer**: This is an unofficial, community-built CLI tool. It is not affiliated with, endorsed by, or supported by Intuit Inc. or QuickBooks. QuickBooks is a registered trademark of Intuit Inc.

## Features

- **Invoices** — list, get, create invoices with line items
- **Customers** — list, search, get, and create customer records
- **Vendors** — list and inspect vendor details
- **Accounts** — browse the chart of accounts
- **Bills** — list and view bills from vendors
- **Payments** — list and inspect customer payments
- **Reports** — Profit & Loss, Balance Sheet, Cash Flow, A/R Aging
- **OAuth 2.0** — secure auth with auto token refresh
- **JSON output** — `--json` flag on every command for scripting
- **Sandbox support** — use Intuit's sandbox environment for testing

## Why CLI > MCP

| | CLI | MCP |
|---|---|---|
| Works in any terminal | Yes | Requires MCP client |
| Scriptable / pipeable | Yes | Limited |
| No runtime dependencies | Yes | Requires MCP server running |
| Human-readable output | Yes | JSON blobs |
| Works offline | Partially | Requires server |
| Standard Unix tools | Yes (`jq`, `grep`, `awk`) | No |
| CI/CD friendly | Yes | No |

## Installation

```bash
npm install -g @ktmcp-cli/quickbooks
```

Or with npx (no install):

```bash
npx @ktmcp-cli/quickbooks --help
```

## Commands

```
quickbooks config set       Set credentials and configuration
quickbooks config get       Show current configuration
quickbooks config path      Show config file location
quickbooks config clear     Clear all configuration

quickbooks auth login       Show OAuth 2.0 setup instructions
quickbooks auth status      Check authentication status
quickbooks auth refresh     Refresh access token using refresh token

quickbooks invoices list    List invoices (--limit, --status, --customer-id)
quickbooks invoices get     Get a specific invoice by ID
quickbooks invoices create  Create a new invoice

quickbooks customers list   List customers (--limit, --search)
quickbooks customers get    Get a specific customer by ID
quickbooks customers create Create a new customer

quickbooks vendors list     List vendors (--limit, --search)
quickbooks vendors get      Get a specific vendor by ID

quickbooks accounts list    List chart of accounts (--type)
quickbooks accounts get     Get a specific account by ID

quickbooks bills list       List bills (--limit, --vendor-id)
quickbooks bills get        Get a specific bill by ID

quickbooks payments list    List payments (--limit, --customer-id)
quickbooks payments get     Get a specific payment by ID

quickbooks reports profit-loss    Profit & Loss report
quickbooks reports balance-sheet  Balance Sheet report
quickbooks reports cash-flow      Cash Flow statement
quickbooks reports ar-aging       A/R Aging report
```

## Auth

QuickBooks Online uses **OAuth 2.0**. You need:
- **Client ID** and **Client Secret** from your [Intuit Developer App](https://developer.intuit.com/app/developer/myapps)
- **Realm ID** (Company ID) — visible in QuickBooks Online URL
- **Access Token** and **Refresh Token** from completing the OAuth flow

### Step-by-step setup

```bash
# 1. Set credentials
quickbooks config set \
  --client-id YOUR_CLIENT_ID \
  --client-secret YOUR_CLIENT_SECRET \
  --realm-id YOUR_REALM_ID \
  --access-token YOUR_ACCESS_TOKEN \
  --refresh-token YOUR_REFRESH_TOKEN

# 2. (Optional) Use sandbox
quickbooks config set --sandbox

# 3. Check status
quickbooks auth status
```

### Environment Variables

Instead of storing config, use environment variables:

```bash
export QB_CLIENT_ID=your_client_id
export QB_CLIENT_SECRET=your_client_secret
export QB_REALM_ID=your_realm_id
export QB_ACCESS_TOKEN=your_access_token
export QB_REFRESH_TOKEN=your_refresh_token
export QB_SANDBOX=false   # set to true for sandbox
```

Or use a `.env` file in your working directory.

## Examples

### List recent invoices

```bash
quickbooks invoices list --limit 10
```

### Find unpaid invoices for a customer

```bash
quickbooks invoices list --status Open --customer-id 42
```

### Create an invoice

```bash
quickbooks invoices create \
  --customer-id 42 \
  --line-items '[{
    "Amount": 500,
    "Description": "Consulting Services",
    "DetailType": "SalesItemLineDetail",
    "SalesItemLineDetail": {
      "ItemRef": {"value": "1"},
      "Qty": 5,
      "UnitPrice": 100
    }
  }]' \
  --due-date 2024-03-01
```

### Search for a customer

```bash
quickbooks customers list --search "Acme Corp"
```

### Get financial report

```bash
quickbooks reports profit-loss \
  --start-date 2024-01-01 \
  --end-date 2024-12-31
```

### Pipe to jq for scripting

```bash
# Get total amount for all open invoices
quickbooks invoices list --status Open --limit 100 --json \
  | jq '[.[].TotalAmt] | add'

# Extract customer names
quickbooks customers list --json | jq '.[].DisplayName'

# Get specific field from a report
quickbooks reports profit-loss --json | jq '.Header'
```

### Use in scripts

```bash
#!/bin/bash
# Export all customers to CSV
quickbooks customers list --limit 500 --json | \
  jq -r '.[] | [.Id, .DisplayName, .PrimaryEmailAddr.Address, .Balance] | @csv'
```

## Contributing

Issues and PRs welcome at [github.com/ktmcp-cli/quickbooks](https://github.com/ktmcp-cli/quickbooks).

## License

MIT — see [LICENSE](LICENSE)

---

Part of the [KTMCP](https://killthemcp.com) project — CLIs as better alternatives to MCPs.
