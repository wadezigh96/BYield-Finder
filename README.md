# BNB Yield Finder

A read-only MCP endpoint that returns a ranked snapshot of BNB Smart Chain yield pools from DeFiLlama's public API.

## Endpoint

After deploying to Vercel:

- `GET /api/mcp` — health/info response
- `POST /api/mcp` — MCP Streamable HTTP JSON-RPC endpoint

Tool: `find_bsc_yields`

## What it does

- Filters public pool data to BNB Smart Chain (BSC).
- Requires reported TVL of at least USD 100,000.
- Returns up to 10 pools sorted by reported APY.
- Includes protocol, pool symbol, APY, TVL and source information.

## Important limitations

- Read-only: it never connects a wallet, signs transactions, or moves funds.
- APY and TVL are provider-reported and can change; this is not financial advice.
- This initial version does **not** implement x402 payment handling, ERC-8183 escrow, or paid-job settlement. Do not claim paid hiring is enabled until that flow is implemented and tested.
- Do not treat high APY as low risk. Verify protocol contracts, audits, token exposure and withdrawal conditions.

## Deploy

Import this public repository into Vercel with the default Node.js runtime. No secrets or environment variables are required for the read-only endpoint.
