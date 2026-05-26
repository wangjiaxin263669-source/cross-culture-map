/** 金额单位：分（1 元 = 100 分） */

function centsFromEnv(name, fallback) {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : fallback;
}

export const WALLET_COSTS = {
  /** 跨文化研究专家 · DeepSeek 对话，默认 ¥0.02/次 */
  chat: centsFromEnv('WALLET_CHAT_COST_CENTS', 2),
  report: centsFromEnv('WALLET_REPORT_COST_CENTS', 10),
  /** 模拟调研 · 第2步 人设，默认 ¥0.10 */
  sim_personas: centsFromEnv('WALLET_SIM_PERSONAS_COST_CENTS', 10),
  /** 模拟调研 · 第3步 全部模拟访谈（一场 batch 只扣一次），默认 ¥0.25 */
  sim_interview: centsFromEnv('WALLET_SIM_INTERVIEW_COST_CENTS', 25),
  /** 模拟调研 · 第4步 调研报告，默认 ¥0.10 */
  sim_report: centsFromEnv('WALLET_SIM_REPORT_COST_CENTS', 10),
};

/** 新用户注册赠送，默认 0.5 元 */
export const NEW_USER_BONUS_CENTS = centsFromEnv('NEW_USER_BONUS_CENTS', 50);

/** 每日登录赠送，默认 0.06 元；未使用部分次日零点（上海时区）清零 */
export const DAILY_LOGIN_BONUS_CENTS = centsFromEnv('DAILY_LOGIN_BONUS_CENTS', 6);

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
    dailyLoginBonusYuan: formatYuan(DAILY_LOGIN_BONUS_CENTS),
    dailyLoginBonusExpiresAtMidnight: true,
    dailyLoginBonusNote: '每日登录赠送当日有效，次日零点（北京时间）未使用部分自动清零',
    simStepPricingYuan: {
      personas: formatYuan(WALLET_COSTS.sim_personas),
      interviews: formatYuan(WALLET_COSTS.sim_interview),
      report: formatYuan(WALLET_COSTS.sim_report),
      total: formatYuan(
        WALLET_COSTS.sim_personas + WALLET_COSTS.sim_interview + WALLET_COSTS.sim_report,
      ),
    },
  };
}
