import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import { generateChatReply, generateLocalizationReport, getModelName, isConfigured } from './deepseek.js';
import {
  generateResearchPersonas,
  runSimulatedInterview,
  synthesizeResearchReport,
  buildSimResearchSyncPayload,
} from './simulatedResearch.js';
import { searchCorpus, formatCorpusForPrompt, getCorpusMeta } from './corpus/index.js';
import {
  listPersonaLibrary,
  savePersona,
  deletePersona,
  saveSession,
  deleteSession,
} from './personaStore.js';
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

  /** 防止请求挂死导致 Vite/Netlify 返回 504 */
  const API_DEADLINE_MS = Number(process.env.API_DEADLINE_MS || 52000);
  const SIM_RESEARCH_DEADLINE_MS = Number(process.env.SIM_RESEARCH_DEADLINE_MS || 90000);
  app.use('/api', (req, res, next) => {
    const limit = String(req.originalUrl || req.path).includes('simulated-research')
      ? SIM_RESEARCH_DEADLINE_MS
      : API_DEADLINE_MS;
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(504).json({
          error:
            'AI 处理超时。请缩短描述后重试；本地请重启 npm run dev；线上请确认 Netlify 已配置 DEEPSEEK_API_KEY。',
        });
      }
    }, limit);
    res.on('finish', () => clearTimeout(timer));
    next();
  });

  // Netlify Functions：部分环境下 express.json 解析不到 body，从 Lambda event 补读
  app.use((req, _res, next) => {
    const hasFields = (b) =>
      b &&
      typeof b === 'object' &&
      !Buffer.isBuffer(b) &&
      (b.message?.trim?.() || b.productIdea?.trim?.() || Object.keys(b).length > 0);

    if (hasFields(req.body)) return next();

    const event = req.apiGateway?.event;
    let raw = null;
    if (event?.body) {
      raw = event.isBase64Encoded
        ? Buffer.from(event.body, 'base64').toString('utf8')
        : event.body;
    } else if (typeof req.body === 'string' && req.body.trim()) {
      raw = req.body;
    } else if (Buffer.isBuffer(req.body)) {
      raw = req.body.toString('utf8');
    }

    if (raw) {
      try {
        req.body = JSON.parse(raw);
      } catch {
        /* 非 JSON 时保持原样 */
      }
    }
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      aiConfigured: isConfigured(),
      geminiConfigured: isConfigured(),
      provider: 'deepseek',
      agent: getSkillMeta(),
      knowledge: getKnowledgeMeta(),
      corpus: getCorpusMeta(),
      model: getModelName(),
      mode: isServerless ? 'netlify' : isProd || hasDist ? 'production' : 'development',
    });
  });

  app.post('/api/corpus/search', async (req, res) => {
    try {
      const { query, marketId, sources } = req.body;
      if (!query?.trim()) {
        return res.status(400).json({ error: '请提供检索关键词' });
      }
      const result = await searchCorpus({
        query: query.trim(),
        marketId,
        sources: sources || ['xiaohongshu', 'weibo', 'zhihu'],
      });
      res.json(result);
    } catch (err) {
      console.error('[corpus]', err.message);
      res.status(500).json({ error: err.message || '语料检索失败' });
    }
  });

  if (!isServerless) {
    app.get('/api/persona-library', (_req, res) => {
      res.json(listPersonaLibrary());
    });

    app.post('/api/persona-library/persona', (req, res) => {
      try {
        const item = savePersona(req.body);
        res.json({ persona: item });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    app.delete('/api/persona-library/persona/:id', (req, res) => {
      deletePersona(req.params.id);
      res.json({ ok: true });
    });

    app.post('/api/persona-library/session', (req, res) => {
      try {
        const item = saveSession(req.body);
        res.json({ session: item });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    app.delete('/api/persona-library/session/:id', (req, res) => {
      deleteSession(req.params.id);
      res.json({ ok: true });
    });
  }

  app.post('/api/simulated-research/sync-payload', (req, res) => {
    try {
      const payload = buildSimResearchSyncPayload(req.body);
      res.json({ productIdea: payload });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
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

  app.post('/api/simulated-research/personas', async (req, res) => {
    try {
      const {
        researchTopic,
        audienceCriteria,
        personaCount,
        country,
        corpusContext,
        corpusSnippets,
      } = req.body;
      if (!researchTopic?.trim()) {
        return res.status(400).json({ error: '请填写调研主题' });
      }
      if (!country) {
        return res.status(400).json({ error: '请先在地球上选择目标国家/地区' });
      }
      let ctx = corpusContext;
      if (!ctx && corpusSnippets?.length) {
        ctx = formatCorpusForPrompt(corpusSnippets);
      }
      const personas = await generateResearchPersonas({
        researchTopic: researchTopic.trim(),
        audienceCriteria: audienceCriteria?.trim() || '',
        personaCount,
        country,
        corpusContext: ctx,
      });
      res.json({ personas });
    } catch (err) {
      console.error('[sim-personas]', err.message);
      res.status(500).json({ error: err.message || '人设生成失败' });
    }
  });

  app.post('/api/simulated-research/interview', async (req, res) => {
    try {
      const { persona, researchTopic, guideQuestions, country, corpusContext } = req.body;
      if (!persona?.name) {
        return res.status(400).json({ error: '缺少受访者人设' });
      }
      if (!researchTopic?.trim()) {
        return res.status(400).json({ error: '请填写调研主题' });
      }
      const interview = await runSimulatedInterview({
        persona,
        researchTopic: researchTopic.trim(),
        guideQuestions: guideQuestions || [],
        country,
        corpusContext: corpusContext || '',
      });
      res.json({ interview });
    } catch (err) {
      console.error('[sim-interview]', err.message);
      res.status(500).json({ error: err.message || '模拟访谈失败' });
    }
  });

  app.post('/api/simulated-research/report', async (req, res) => {
    try {
      const {
        researchTopic,
        audienceCriteria,
        personas,
        interviews,
        country,
        corpusSnippets,
      } = req.body;
      if (!researchTopic?.trim() || !personas?.length || !interviews?.length) {
        return res.status(400).json({ error: '缺少调研主题、人设或访谈记录' });
      }
      const report = await synthesizeResearchReport({
        researchTopic: researchTopic.trim(),
        audienceCriteria: audienceCriteria?.trim() || '',
        personas,
        interviews,
        country,
        corpusSnippets: corpusSnippets || [],
      });
      res.json({ report });
    } catch (err) {
      console.error('[sim-report]', err.message);
      res.status(500).json({ error: err.message || '调研报告生成失败' });
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
