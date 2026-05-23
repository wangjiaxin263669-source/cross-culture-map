import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import { generateChatReply, generateLocalizationReport, getModelName, isConfigured } from './deepseek.js';
import { getKnowledgeMeta } from './knowledge.js';
import { getSkillMeta } from './loadSkill.js';
import { getServerDir } from './paths.js';

const serverDir = getServerDir();
dotenv.config({ path: path.join(serverDir, '..', '.env') });

/**
 * @param {{ serveStatic?: boolean }} options
 * Netlify 仅跑 API；本地/VPS 可托管 dist 静态资源
 */
export function createApp(options = {}) {
  const { serveStatic = true } = options;
  const app = express();
  const isProd = process.env.NODE_ENV === 'production';
  const distPath = path.join(serverDir, '..', 'dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));
  const isServerless = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
  const shouldServeWeb = serveStatic && !isServerless && (isProd || hasDist);

  if (isProd) {
    app.set('trust proxy', 1);
  }

  app.use(cors());
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      aiConfigured: isConfigured(),
      geminiConfigured: isConfigured(),
      provider: 'deepseek',
      agent: getSkillMeta(),
      knowledge: getKnowledgeMeta(),
      model: getModelName(),
      mode: isServerless ? 'netlify' : isProd || hasDist ? 'production' : 'development',
    });
  });

  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history = [], country = null } = req.body;
      if (!message?.trim()) {
        return res.status(400).json({ error: '消息不能为空' });
      }
      const reply = await generateChatReply({
        message: message.trim(),
        history,
        country,
      });
      res.json({ reply });
    } catch (err) {
      console.error('[chat]', err.message);
      res.status(500).json({ error: err.message || '对话生成失败' });
    }
  });

  app.post('/api/report', async (req, res) => {
    try {
      const { productIdea, country } = req.body;
      if (!productIdea?.trim()) {
        return res.status(400).json({ error: '请描述您的产品构想' });
      }
      if (!country) {
        return res.status(400).json({ error: '请先选择目标国家' });
      }
      const report = await generateLocalizationReport({
        productIdea: productIdea.trim(),
        country,
      });
      res.json({ report });
    } catch (err) {
      console.error('[report]', err.message);
      res.status(500).json({ error: err.message || '报告生成失败' });
    }
  });

  if (shouldServeWeb) {
    if (isProd && !hasDist) {
      throw new Error('生产模式需要先执行 npm run build');
    }
    app.use(express.static(distPath, { maxAge: isProd ? '7d' : 0 }));
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}
