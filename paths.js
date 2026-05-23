import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

let cachedServerDir = null;

function isServerlessRuntime() {
  return Boolean(
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.AWS_EXECUTION_ENV ||
    process.env.NETLIFY
  );
}

/**
 * 解析 server/ 目录（Netlify 打包后不用 import.meta.url，避免 502）
 */
export function getServerDir() {
  if (cachedServerDir) return cachedServerDir;

  if (!isServerlessRuntime()) {
    try {
      const metaUrl = import.meta?.url;
      if (metaUrl) {
        const fromMeta = path.dirname(fileURLToPath(metaUrl));
        if (fs.existsSync(path.join(fromMeta, 'data', 'knowledge-chunks.json'))) {
          cachedServerDir = fromMeta;
          return cachedServerDir;
        }
      }
    } catch {
      /* 本地 ESM 解析失败时走下方候选路径 */
    }
  }

  const candidates = [
    process.env.SERVER_ROOT,
    path.join(process.cwd(), 'server'),
    '/var/task/server',
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
