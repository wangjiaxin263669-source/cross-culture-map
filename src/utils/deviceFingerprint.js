const FP_CACHE_KEY = 'cc_device_fp_v1';
const LOCAL_ID_KEY = 'cc_device_local_id';

/** 无 Web Crypto 时的稳定回退（仍输出 64 位十六进制） */
function sha256HexFallback(text) {
  let h1 = 0x811c9dc5;
  let h2 = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    const c = text.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= c ^ (i % 255);
    h2 = Math.imul(h2, 0x01000193);
  }
  const part = (n) => (n >>> 0).toString(16).padStart(8, '0');
  return (part(h1) + part(h2) + part(h1 ^ h2) + part(~h1)).padEnd(64, '0').slice(0, 64);
}

async function sha256Hex(text) {
  if (typeof crypto !== 'undefined' && crypto.subtle?.digest) {
    const data = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return sha256HexFallback(text);
}

function getOrCreateLocalId() {
  try {
    let id = localStorage.getItem(LOCAL_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(LOCAL_ID_KEY, id);
    }
    return id;
  } catch {
    return 'no-storage';
  }
}

function canvasFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.textBaseline = 'top';
    ctx.font = '16px "Noto Sans SC", Arial';
    ctx.fillStyle = '#0cf';
    ctx.fillRect(0, 0, 120, 30);
    ctx.fillStyle = '#111';
    ctx.fillText('CROSS-CULTURE', 8, 8);
    return canvas.toDataURL();
  } catch {
    return '';
  }
}

/** 收集设备特征并生成稳定哈希（用于一设备一账号） */
async function collectDeviceSignals() {
  const parts = [
    getOrCreateLocalId(),
    navigator.userAgent || '',
    navigator.language || '',
    navigator.platform || '',
    String(navigator.hardwareConcurrency || ''),
    String(screen.width || 0),
    String(screen.height || 0),
    String(screen.colorDepth || 0),
    String(window.devicePixelRatio || 1),
    Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    canvasFingerprint(),
  ];
  return parts.join('\n');
}

/**
 * 返回 64 位十六进制设备指纹，供注册时提交服务端。
 * 同一浏览器/设备配置下应保持稳定；清除站点数据会变化（属预期限制）。
 */
export async function getDeviceFingerprint() {
  if (typeof window === 'undefined') {
    throw new Error('当前环境无法生成设备标识');
  }

  try {
    const cached = localStorage.getItem(FP_CACHE_KEY);
    if (cached && /^[a-f0-9]{64}$/i.test(cached)) {
      return cached.toLowerCase();
    }
  } catch {
    /* ignore */
  }

  const hash = await sha256Hex(await collectDeviceSignals());

  try {
    localStorage.setItem(FP_CACHE_KEY, hash);
  } catch {
    /* 无痕模式等仍可注册，仅无法缓存 */
  }

  return hash;
}
