import { createApp } from './app.js';
import { isConfigured } from './deepseek.js';
import { getKnowledgeMeta } from './knowledge.js';
import { getSkillMeta } from './loadSkill.js';
import { isDbWritable } from './db/store.js';
import { getPaymentPublicConfig } from './payment/index.js';

const PORT = Number(process.env.PORT || process.env.API_PORT || 3001);
const app = createApp({ serveStatic: true });

const server = app.listen(PORT, () => {
  const meta = getKnowledgeMeta();
  const skill = getSkillMeta();
  console.log(`\n🌐 CROSS-CULTURE 服务已启动: http://localhost:${PORT}`);
  console.log(`   知识库: ${meta.chunkCount} 块`);
  console.log(`   DeepSeek: ${isConfigured() ? '已配置 ✓' : '⚠ 未配置 DEEPSEEK_API_KEY'}`);
  console.log(`   智能体: ${skill.skill}（${skill.skillSource}）`);
  const pay = getPaymentPublicConfig();
  console.log(
    `   账号/历史/余额: ${isDbWritable() ? '持久化 ✓' : '⚠ 当前环境无持久化（请用 VPS/Docker）'}`,
  );
  console.log(`   支付: ${pay.provider}${pay.mockMode ? '（模拟）' : ''}\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ 端口 ${PORT} 已被占用。请运行: node scripts/kill-api-port.mjs\n`);
    process.exit(1);
  }
  console.error(err);
  process.exit(1);
});
