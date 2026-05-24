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
import {
  searchCorpus,
  formatCorpusForPrompt,
  getCorpusMeta,
  getOpenPlatformStatus,
  getAuthorizeUrls,
} from './corpus/index.js';
import { exchangeXhsCodeForToken, refreshXhsToken } from './corpus/providers/xiaohongshu-ark.js';
import { exchangeWeiboCodeForToken } from './corpus/providers/weibo-official.js';
import { clearPlatformTokens } from './corpus/openPlatformStore.js';
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
import authRoutes from './auth/routes.js';
import { getWechatConfig } from './auth/wechat.js';
import { isDbWritable } from './db/store.js';
import { getStorageBackend } from './db/engine.js';
import { ensureBlobsReady } from './db/blobContext.js';
import walletRoutes from './wallet/routes.js';
import { withWalletCharge } from './wallet/middleware.js';
import { getWalletPublicConfig } from './wallet/config.js';
import { getPaymentPublicConfig } from './payment/index.js';

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

  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '2mb' }));

  app.use(async (req, _res, next) => {
    const event = req.apiGateway?.event;
    if (event) {
      try {
        await ensureBlobsReady(event);
      } catch {
        /* ignore */
      }
    }
    next();
  });

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

  app.get('/api/health', async (_req, res) => {
    const wx = getWechatConfig();
    const isProd = process.env.NODE_ENV === 'production';
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
      auth: {
        dbWritable: isDbWritable(),
        storage: getStorageBackend(),
        blobsContext: Boolean(process.env.NETLIFY_BLOBS_CONTEXT),
        siteId: Boolean(process.env.SITE_ID || process.env.NETLIFY_SITE_ID),
        wechatLogin: wx.configured,
        devLogin:
          process.env.WECHAT_LOGIN_MOCK === 'true' || (!isProd && !wx.configured),
        authMode: 'wechat',
      },
      wallet: getWalletPublicConfig(),
      payment: getPaymentPublicConfig(),
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/wallet', walletRoutes);

  app.get('/api/open-platform/status', (_req, res) => {
    res.json({
      platforms: getOpenPlatformStatus(),
      authorizeUrls: getAuthorizeUrls(),
      netlifyNote: isServerless
        ? '线上环境请用环境变量注入 Token，OAuth 回调请在本地完成授权后复制到 Netlify'
        : null,
    });
  });

  app.get('/api/open-platform/xhs/authorize', (_req, res) => {
    const url = getAuthorizeUrls().xiaohongshu;
    if (!url) {
      return res.status(400).json({
        error: '请先在 .env 配置 XHS_ARK_APP_ID、XHS_ARK_APP_SECRET、XHS_ARK_REDIRECT_URI',
      });
    }
    res.redirect(url);
  });

  app.get('/api/open-platform/xhs/callback', async (req, res) => {
    try {
      const { code, error: oauthErr } = req.query;
      if (oauthErr) {
        return res.status(400).send(`小红书授权失败: ${oauthErr}`);
      }
      if (!code) {
        return res.status(400).send('缺少授权 code');
      }
      const data = await exchangeXhsCodeForToken(String(code));
      res.send(
        `<html><body style="font-family:sans-serif;padding:40px"><h2>小红书开放平台授权成功</h2><p>商家：${data.sellerName || '—'}</p><p>可关闭此页，返回 CROSS-CULTURE 继续模拟调研。</p><script>setTimeout(()=>window.close(),3000)</script></body></html>`,
      );
    } catch (err) {
      res.status(500).send(`授权失败: ${err.message}`);
    }
  });

  app.post('/api/open-platform/xhs/refresh', async (_req, res) => {
    try {
      const data = await refreshXhsToken();
      res.json({ ok: true, sellerName: data.sellerName });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/open-platform/weibo/authorize', (_req, res) => {
    const url = getAuthorizeUrls().weibo;
    if (!url) {
      return res.status(400).json({
        error: '请先在 .env 配置 WEIBO_APP_KEY、WEIBO_APP_SECRET、WEIBO_REDIRECT_URI',
      });
    }
    res.redirect(url);
  });

  app.get('/api/open-platform/weibo/callback', async (req, res) => {
    try {
      const { code, error: oauthErr } = req.query;
      if (oauthErr) {
        return res.status(400).send(`微博授权失败: ${oauthErr}`);
      }
      if (!code) {
        return res.status(400).send('缺少授权 code');
      }
      const data = await exchangeWeiboCodeForToken(String(code));
      res.send(
        `<html><body style="font-family:sans-serif;padding:40px"><h2>微博开放平台授权成功</h2><p>UID：${data.uid || '—'}</p><p>可关闭此页，返回 CROSS-CULTURE。</p></body></html>`,
      );
    } catch (err) {
      res.status(500).send(`授权失败: ${err.message}`);
    }
  });

  app.post('/api/open-platform/disconnect', (req, res) => {
    const { platform } = req.body;
    if (!platform) {
      return res.status(400).json({ error: '请指定 platform' });
    }
    clearPlatformTokens(platform);
    res.json({ ok: true });
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

  app.post(
    '/api/chat',
    ...withWalletCharge('chat', async (req, res) => {
      const { message, history = [], country = null } = req.body;
      if (!message?.trim()) {
        return res.status(400).json({ error: '消息不能为空' });
      }
      const reply = await generateChatReply({
        message: message.trim(),
        history,
        country,
      });
      res.json({
        reply,
        balanceCents: req.walletCharge?.balanceCents,
        costCents: req.walletCharge?.costCents,
      });
    }),
  );

  app.post(
    '/api/simulated-research/personas',
    ...withWalletCharge('sim_personas', async (req, res) => {
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
      res.json({ personas, balanceCents: req.walletCharge?.balanceCents });
    }),
  );

  app.post(
    '/api/simulated-research/interview',
    ...withWalletCharge('sim_interview', async (req, res) => {
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
      res.json({ interview, balanceCents: req.walletCharge?.balanceCents });
    }),
  );

  app.post(
    '/api/simulated-research/report',
    ...withWalletCharge('sim_report', async (req, res) => {
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
      res.json({ report, balanceCents: req.walletCharge?.balanceCents });
    }),
  );

  app.post(
    '/api/report',
    ...withWalletCharge('report', async (req, res) => {
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
      res.json({
        report,
        balanceCents: req.walletCharge?.balanceCents,
        costCents: req.walletCharge?.costCents,
      });
    }),
  );

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
