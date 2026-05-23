/**
 * 上线前自检：node scripts/predeploy.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
let failed = false;

function ok(msg) {
  console.log(`  ✓ ${msg}`);
}
function fail(msg) {
  console.error(`  ✗ ${msg}`);
  failed = true;
}

console.log('\n=== CROSS-CULTURE 上线前检查 ===\n');

const envPath = path.join(root, '.env');
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf-8');
  if (/DEEPSEEK_API_KEY=\s*sk-/.test(env) || /DEEPSEEK_API_KEY=.{10,}/.test(env)) {
    ok('DEEPSEEK_API_KEY 已配置');
  } else {
    fail('DEEPSEEK_API_KEY 为空，请填写 .env');
  }
} else {
  fail('缺少 .env（可复制 .env.example）');
}

const distIndex = path.join(root, 'dist', 'index.html');
if (fs.existsSync(distIndex)) {
  ok('前端构建产物 dist/ 存在');
} else {
  fail('请先执行 npm run build');
}

const knowledge = path.join(root, 'server', 'data', 'knowledge-chunks.json');
if (fs.existsSync(knowledge)) {
  const kb = JSON.parse(fs.readFileSync(knowledge, 'utf-8'));
  ok(`知识库 ${kb.chunkCount ?? kb.chunks?.length ?? 0} 块`);
} else {
  fail('缺少知识库，请执行 npm run build:knowledge');
}

const skillBundled = path.join(root, 'server', 'prompts', 'cross-cultural-research-SKILL.md');
if (fs.existsSync(skillBundled)) {
  ok('SKILL 智能体提示词已内置');
} else {
  fail('缺少 server/prompts/cross-cultural-research-SKILL.md');
}

console.log(failed ? '\n❌ 请修复上述问题后再上线\n' : '\n✅ 可以部署。生产启动: npm run start:prod\n');

process.exit(failed ? 1 : 0);
