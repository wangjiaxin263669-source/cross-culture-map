import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateChatReply } from '../server/deepseek.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const reply = await generateChatReply({
  message: '日本20-35岁电商UI建议，简短回答',
  history: [{ role: 'ai', text: '您好！我是助手。' }],
  country: {
    title: '日本',
    label: 'Japan',
    overview: '高不确定性规避',
    density: 95,
    radarData: [{ name: '权力距离', score: 54 }],
  },
});

console.log('SUCCESS\n', reply.slice(0, 300));
