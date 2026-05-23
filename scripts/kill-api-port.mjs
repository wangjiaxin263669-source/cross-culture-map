/** 启动前释放 3001 端口，避免旧后端（未加载 .env）一直占用 */
import { execSync } from 'child_process';

const PORT = process.env.PORT || process.env.API_PORT || 3001;

try {
  const out = execSync(`netstat -ano | findstr ":${PORT}.*LISTENING"`, { encoding: 'utf8' });
  const lines = out.trim().split('\n');
  const pids = new Set();
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && /^\d+$/.test(pid)) pids.add(pid);
  }
  for (const pid of pids) {
    try {
      execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
      console.log(`已结束占用 ${PORT} 端口的旧进程 (PID ${pid})`);
    } catch {
      /* 进程可能已退出 */
    }
  }
} catch {
  /* 端口未被占用 */
}
