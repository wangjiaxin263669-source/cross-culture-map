/** 金额单位：分（1 元 = 100 分） */

function centsFromEnv(name, fallback) {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : fallback;
}

export const WALLET_COSTS = {
  chat: centsFromEnv('WALLET_CHAT_COST_CENTS', 10),
  report: centsFromEnv('WALLET_REPORT_COST_CENTS', 10),
  sim_personas: centsFromEnv('WALLET_SIM_PERSONAS_COST_CENTS', 10),
  sim_interview: centsFromEnv('WALLET_SIM_INTERVIEW_COST_CENTS', 10),
  sim_report: centsFromEnv('WALLET_SIM_REPORT_COST_CENTS', 10),
};

export const NEW_USER_BONUS_CENTS = centsFromEnv('NEW_USER_BONUS_CENTS', 50);

/** 充值档位（元 → 分） */
export const RECHARGE_PACKAGES = [
  { id: 'p10', label: '10 元', amountCents: 1000, bonusCents: 0 },
  { id: 'p30', label: '30 元', amountCents: 3000, bonusCents: 0 },
  { id: 'p50', label: '50 元', amountCents: 5000, bonusCents: 200 },
  { id: 'p100', label: '100 元', amountCents: 10000, bonusCents: 500 },
];

export function formatYuan(cents) {
  return (cents / 100).toFixed(2);
}

export function getCostLabel(type) {
  const c = WALLET_COSTS[type];
  return c != null ? `¥${formatYuan(c)}/次` : '';
}

export function getWalletPublicConfig() {
  return {
    costs: WALLET_COSTS,
    costsYuan: Object.fromEntries(
      Object.entries(WALLET_COSTS).map(([k, v]) => [k, formatYuan(v)]),
    ),
    packages: RECHARGE_PACKAGES.map((p) => ({
      ...p,
      totalCents: p.amountCents + p.bonusCents,
      amountYuan: formatYuan(p.amountCents),
      totalYuan: formatYuan(p.amountCents + p.bonusCents),
    })),
    newUserBonusYuan: formatYuan(NEW_USER_BONUS_CENTS),
  };
}
