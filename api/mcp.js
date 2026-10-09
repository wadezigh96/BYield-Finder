const SERVER = { name: "bnb-yield-finder", version: "1.0.0" };

async function getPools() {
  const response = await fetch("https://yields.llama.fi/pools", {
    headers: { accept: "application/json" }
  });
  if (!response.ok) throw new Error("Yield data provider returned HTTP " + response.status);
  const payload = await response.json();
  const rows = Array.isArray(payload.data) ? payload.data : [];
  return rows
    .filter((p) => String(p.chain || "").toLowerCase() === "bsc")
    .filter((p) => Number.isFinite(Number(p.apy)) && Number(p.apy) >= 0)
    .filter((p) => Number(p.tvlUsd) >= 100000)
    .sort((a, b) => Number(b.apy) - Number(a.apy))
    .slice(0, 10)
    .map((p) => ({
      protocol: p.project || "Unknown",
      pool: p.symbol || "Unknown",
      apyPercent: Math.round(Number(p.apy) * 100) / 100,
      tvlUsd: Math.round(Number(p.tvlUsd)),
      poolId: p.pool || null,
      stablecoin: Boolean(p.stablecoin),
      exposure: p.exposure || null,
      source: "DeFiLlama",
      note: "APY is variable and may include incentives; verify pool, contract, liquidity and risks independently."
    }));
}

function jsonRpc(id, result) {
  return { jsonrpc: "2.0", id: id === undefined ? null : id, result };
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, Mcp-Session-Id, Last-Event-ID");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method === "GET") {
    return res.status(200).json({
      name: SERVER.name,
      version: SERVER.version,
      protocol: "MCP Streamable HTTP",
      tools: ["find_bsc_yields"],
      readOnly: true,
      payment: "No payment or fund movement is performed by this endpoint."
    });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const body = req.body || {};
  const { id, method, params } = body;
  try {
    if (method === "initialize") {
      return res.status(200).json(jsonRpc(id, {
        protocolVersion: "2025-03-26",
        capabilities: { tools: {} },
        serverInfo: SERVER
      }));
    }
    if (method === "notifications/initialized" || method === "notifications/cancelled") {
      return res.status(202).end();
    }
    if (method === "ping") return res.status(200).json(jsonRpc(id, {}));
    if (method === "tools/list") {
      return res.status(200).json(jsonRpc(id, {
        tools: [{
          name: "find_bsc_yields",
          description: "Finds up to 10 BNB Smart Chain lending and yield pools from public DeFiLlama data. Read-only; does not connect wallets or move funds.",
          inputSchema: {
            type: "object",
            properties: {},
            additionalProperties: false
          }
        }]
      }));
    }
    if (method === "tools/call") {
      if (!params || params.name !== "find_bsc_yields") {
        return res.status(200).json(jsonRpc(id, {
          content: [{ type: "text", text: "Unknown tool. Available tool: find_bsc_yields." }],
          isError: true
        }));
      }
      const pools = await getPools();
      const text = JSON.stringify({
        chain: "BNB Smart Chain",
        count: pools.length,
        pools,
        disclaimer: "Read-only market information, not financial advice. APYs change. High APY can indicate high risk. Verify protocol audits, token exposure, withdrawal conditions and smart-contract risk. No transactions are executed."
      }, null, 2);
      return res.status(200).json(jsonRpc(id, {
        content: [{ type: "text", text }],
        structuredContent: { chain: "BNB Smart Chain", count: pools.length, pools }
      }));
    }
    return res.status(200).json({
      jsonrpc: "2.0",
      id: id === undefined ? null : id,
      error: { code: -32601, message: "Method not found" }
    });
  } catch (error) {
    return res.status(200).json({
      jsonrpc: "2.0",
      id: id === undefined ? null : id,
      error: { code: -32000, message: "Yield data unavailable. Please retry later." }
    });
  }
};