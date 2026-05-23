import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

let cachedServerDir = null;

/**
 * 解析 server/ 目录（兼容 Netlify Functions 打包后 import.meta.url 失效）
 */
export function getServerDir() {
  if (cachedServerDir) return cachedServerDir;

  const metaUrl = typeof import.meta !== 'undefined' ? import.meta.url : undefined;
  if (metaUrl) {
    try {
      const fromMeta = path.dirname(fileURLToPath(metaUrl));
      if (fs.existsSync(path.join(fromMeta, 'data', 'knowledge-chunks.json'))) {
        cachedServerDir = fromMeta;
        return cachedServerDir;
      }
    } catch {
      /* 打包后 fileURLToPath 可能失败 */
    }
  }

  const candidates = [
    process.env.SERVER_ROOT,
    path.join(process.cwd(), 'server'),
    path.join('/var/task', 'server'),
    path.join(process.env.LAMBDA_TASK_ROOT || '', 'server'),
  ].filter(Boolean);

  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'data', 'knowledge-chunks.json'))) {
      cachedServerDir = dir;
      return cachedServerDir;
    }
  }

  cachedServerDir = path.join(process.cwd(), 'server');
  return cachedServerDir;
}
