import { getAuthHeaders } from './authApi.js';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options.headers,
    },
  });
  let data = {};
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const err = new Error(data.error || `请求失败 (${res.status})`);
    err.status = res.status;
    err.code = data.code;
    err.balanceCents = data.balanceCents;
    err.costCents = data.costCents;
    throw err;
  }
  return data;
}

export async function fetchWalletConfig() {
  return api('/api/wallet/config');
}

export async function fetchBalance() {
  return api('/api/wallet/balance');
}

export async function createRechargeOrder(packageId, payType = 'wxpay', transferRemark = '') {
  return api('/api/wallet/recharge/create', {
    method: 'POST',
    body: JSON.stringify({ packageId, payType, transferRemark }),
  });
}

export async function submitRechargePaid(orderId) {
  return api('/api/wallet/recharge/submit-paid', {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  });
}

export async function fetchRechargeStatus(orderId) {
  return api(`/api/wallet/recharge/status/${orderId}`);
}
