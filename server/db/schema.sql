-- Netlify DB / Neon 一键启用后执行（或首次启动自动创建）
CREATE TABLE IF NOT EXISTS platform_kv (
  id INTEGER PRIMARY KEY DEFAULT 1,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO platform_kv (id, data)
VALUES (1, '{"users":[],"chatSessions":[],"reports":[],"rechargeOrders":[],"walletTransactions":[]}'::jsonb)
ON CONFLICT (id) DO NOTHING;
