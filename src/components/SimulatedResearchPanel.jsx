import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import ReportMarkdown from './ReportMarkdown';
import InterviewReplay from './InterviewReplay';
import {
  searchCorpus,
  generatePersonas,
  runInterview,
  synthesizeReport,
  buildSyncToThreeStepPayload,
} from '../services/simulatedResearchApi';
import { downloadResearchPdf } from '../utils/exportResearchPdf';
import { downloadResearchWord } from '../utils/exportResearchWord';
import OpenPlatformPanel from './OpenPlatformPanel';
import ResearchMaterialsStep from './ResearchMaterialsStep';
import {
  createEmptyMaterials,
  slimMaterialsForApi,
  hasAnyMaterials,
} from '../utils/researchMaterials';
import { useAiModel } from '../context/AiModelContext';
import { useAuth } from '../context/AuthContext';
import { saveSimResearchSession } from '../services/historyApi';
import { shouldPersistSimDraft } from '../utils/simResearchDraft';
import {
  listPersonas,
  savePersonaToLibrary,
  deletePersonaFromLibrary,
} from '../storage/researchStorage';

const STEPS = [
  { id: 'materials', label: '0. 素材（可选）' },
  { id: 'setup', label: '1. 研究设定' },
  { id: 'personas', label: '2. 人设' },
  { id: 'interviews', label: '3. 模拟访谈' },
  { id: 'report', label: '4. 报告' },
];

const DEFAULT_GUIDE = [
  '您如何理解/使用这类产品？',
  '最近一次相关购买或使用经历？',
  '什么会让您信任或犹豫？',
  '价格、社交、品牌对您决策的影响？',
];

const CORPUS_OPTIONS = [
  { id: 'xiaohongshu', label: '小红书（精选语料）' },
  { id: 'weibo', label: '微博' },
  { id: 'zhihu', label: '知乎' },
  { id: 'reddit', label: 'Reddit/英文' },
  { id: 'web', label: '全网搜索（需 SERPER_API_KEY）' },
];

function simFlowCostYuan(costsYuan) {
  const personas = Number(costsYuan?.sim_personas ?? 0.1);
  const interview = Number(costsYuan?.sim_interview ?? 0.25);
  const report = Number(costsYuan?.sim_report ?? 0.1);
  return (personas + interview + report).toFixed(2);
}

function stepCostYuan(costsYuan, key) {
  return costsYuan?.[key] ?? ({ sim_personas: '0.10', sim_interview: '0.25', sim_report: '0.10' }[key]);
}

const SimulatedResearchPanel = forwardRef(function SimulatedResearchPanel(
  {
    market,
    marketTitle,
    aiConfigured,
    walletCostsYuan,
    onSyncToThreeStepReport,
    onReportGenerated,
    onSavedToHistory,
    onSnapshotChange,
  },
  ref,
) {
  const { user } = useAuth();
  const { modelId, current: currentModel } = useAiModel();
  const [step, setStep] = useState('materials');
  const [researchMaterials, setResearchMaterials] = useState(createEmptyMaterials);
  const [researchTopic, setResearchTopic] = useState('');
  const [audienceCriteria, setAudienceCriteria] = useState('');
  const [personaCount, setPersonaCount] = useState(3);
  const [guideQuestions, setGuideQuestions] = useState(DEFAULT_GUIDE.join('\n'));
  const [corpusSources, setCorpusSources] = useState(['xiaohongshu', 'weibo', 'zhihu']);

  const [corpusSnippets, setCorpusSnippets] = useState([]);
  const [corpusMeta, setCorpusMeta] = useState(null);
  const [corpusErrors, setCorpusErrors] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [report, setReport] = useState('');
  const [historySessionId, setHistorySessionId] = useState(null);
  const [interviewBatchId, setInterviewBatchId] = useState(null);
  const [materialsStarted, setMaterialsStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [expandedInterview, setExpandedInterview] = useState(null);
  const [replayInterview, setReplayInterview] = useState(null);

  const [savedPersonas, setSavedPersonas] = useState([]);
  const [showLibrary, setShowLibrary] = useState(false);

  const refreshLibrary = useCallback(() => {
    setSavedPersonas(listPersonas());
  }, []);

  useEffect(() => {
    refreshLibrary();
  }, [refreshLibrary]);

  const guideList = guideQuestions
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  const marketId = market?.id || market?.parentId;
  const materialsPayload = slimMaterialsForApi(researchMaterials);

  const toggleSource = (id) => {
    setCorpusSources((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const fetchCorpus = async () => {
    if (!researchTopic.trim()) return [];
    setProgress('检索小红书/微博/知乎等外部语料…');
    const { snippets, meta } = await searchCorpus({
      query: `${researchTopic} ${audienceCriteria}`.trim(),
      marketId,
      sources: corpusSources,
    });
    setCorpusSnippets(snippets);
    setCorpusMeta(meta);
    setCorpusErrors(meta?.errors || []);
    return snippets;
  };

  const buildSessionPayload = useCallback(
    (overrides = {}) => ({
      step,
      researchTopic,
      audienceCriteria,
      guideQuestions,
      corpusSources,
      corpusSnippets,
      researchMaterials,
      personas,
      interviews,
      report,
      interviewBatchId,
      personaCount,
      modelId,
      marketId,
      marketTitle,
      materialsStarted,
      ...overrides,
    }),
    [
      step,
      researchTopic,
      audienceCriteria,
      guideQuestions,
      corpusSources,
      corpusSnippets,
      researchMaterials,
      personas,
      interviews,
      report,
      interviewBatchId,
      personaCount,
      modelId,
      marketId,
      marketTitle,
      materialsStarted,
    ],
  );

  const applySessionState = useCallback((s) => {
    setHistorySessionId(s.id || null);
    setResearchTopic(s.researchTopic || '');
    setAudienceCriteria(s.audienceCriteria || '');
    setGuideQuestions(s.guideQuestions || DEFAULT_GUIDE.join('\n'));
    setCorpusSources(s.corpusSources || ['xiaohongshu', 'weibo', 'zhihu']);
    setCorpusSnippets(s.corpusSnippets || []);
    setResearchMaterials(s.researchMaterials || createEmptyMaterials());
    setPersonas(s.personas || []);
    setInterviews(s.interviews || []);
    setReport(s.report || '');
    setInterviewBatchId(s.interviewBatchId || null);
    if (s.personaCount) setPersonaCount(s.personaCount);
    setMaterialsStarted(
      Boolean(s.materialsStarted) ||
        hasAnyMaterials(s.researchMaterials) ||
        s.researchMaterials?.skipped,
    );
    if (s.step && STEPS.some((x) => x.id === s.step)) setStep(s.step);
    else if (s.report) setStep('report');
    else if (s.interviews?.length) setStep('interviews');
    else if (s.personas?.length) setStep('personas');
    else if (s.researchTopic || s.materialsStarted) setStep('setup');
    else setStep('materials');
    setError('');
  }, []);

  const buildHistoryPayload = useCallback(
    (overrides = {}) => {
      const payload = buildSessionPayload(overrides);
      const title =
        payload.researchTopic?.trim().slice(0, 48) ||
        `${marketTitle || '跨文化'} · 模拟调研`;
      return {
        id: historySessionId || undefined,
        title,
        market: marketId ? { id: marketId, title: marketTitle } : null,
        ...payload,
      };
    },
    [buildSessionPayload, historySessionId, marketId, marketTitle],
  );

  const saveToHistory = useCallback(
    async (overrides = {}) => {
      if (!user) {
        throw new Error('请先登录后再保存到「我的历史」');
      }
      const payload = buildHistoryPayload(overrides);
      if (!shouldPersistSimDraft(payload)) {
        throw new Error('当前没有可保存的调研内容');
      }
      const session = await saveSimResearchSession(payload);
      setHistorySessionId(session.id);
      onSavedToHistory?.(session);
      return session;
    },
    [user, buildHistoryPayload, onSavedToHistory],
  );

  const latestSnapshotRef = useRef({});

  const getSnapshot = useCallback(() => {
    return {
      historySessionId,
      marketId,
      marketTitle,
      ...buildSessionPayload(),
    };
  }, [historySessionId, marketId, marketTitle, buildSessionPayload]);

  latestSnapshotRef.current = getSnapshot();

  const pushSnapshot = useCallback(() => {
    const snap = getSnapshot();
    onSnapshotChange?.(snap);
    return snap;
  }, [getSnapshot, onSnapshotChange]);

  useEffect(() => {
    pushSnapshot();
  }, [pushSnapshot]);

  useImperativeHandle(
    ref,
    () => ({
      getSnapshot: () => latestSnapshotRef.current,
      loadFromHistory: (session) => applySessionState(session),
      notifyHistorySaved: (id) => setHistorySessionId(id),
    }),
    [applySessionState],
  );

  const goToStep = (nextStep) => {
    setStep(nextStep);
  };

  const handleMaterialsChange = (next) => {
    setResearchMaterials(next);
    if (hasAnyMaterials(next)) setMaterialsStarted(true);
  };

  const handleGeneratePersonas = async () => {
    if (!researchTopic.trim()) {
      setError('请填写调研主题');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const snippets = await fetchCorpus();
      setProgress('正在结合外部语料构建受访者人设…');
      const list = await generatePersonas({
        researchTopic,
        audienceCriteria,
        personaCount,
        country: market,
        corpusSnippets: snippets,
        researchMaterials: materialsPayload,
        model: modelId,
      });
      setPersonas(list);
      setInterviews([]);
      setReport('');
      setStep('personas');
      if (user) {
        try {
          await saveToHistory({
            step: 'personas',
            personas: list,
            corpusSnippets: snippets,
            interviews: [],
            report: '',
          });
        } catch {
          /* 人设已生成，退出时可再保存 */
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const handleRunInterviews = async () => {
    if (!personas.length) return;
    setLoading(true);
    setError('');
    const results = [...interviews];
    const startIdx = results.length;
    let batchId = interviewBatchId;
    const corpusContext = corpusSnippets
      .map((s) => `[${s.sourceLabel}] ${s.title}: ${s.content}`)
      .join('\n');

    try {
      for (let i = startIdx; i < personas.length; i += 1) {
        const p = personas[i];
        setProgress(
          `模拟访谈 (${i + 1}/${personas.length})：${p.name}…（笔录专员 + 表情观察专员）`,
        );
        const { interview, batchId: nextBatchId } = await runInterview({
          persona: p,
          researchTopic,
          guideQuestions: guideList,
          country: market,
          corpusContext,
          researchMaterials: materialsPayload,
          model: modelId,
          batchId,
        });
        if (nextBatchId) {
          batchId = nextBatchId;
          setInterviewBatchId(nextBatchId);
        }
        results.push(interview);
        setInterviews([...results]);
      }
      setStep('interviews');
    } catch (err) {
      setError(
        `${err.message}${results.length ? ' · 已完成部分访谈；关闭面板时可选择「保存到历史」' : ''}`,
      );
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const handleGenerateReport = async () => {
    if (!interviews.length) {
      setError('请先完成至少一场模拟访谈');
      return;
    }
    setLoading(true);
    setError('');
    try {
      setProgress('正在汇总调研报告…');
      const md = await synthesizeReport({
        researchTopic,
        audienceCriteria,
        personas,
        interviews,
        country: market,
        corpusSnippets,
        researchMaterials: materialsPayload,
        model: modelId,
      });
      setReport(md);
      setStep('report');
      onReportGenerated?.(md, researchTopic);
      if (user) {
        try {
          await saveToHistory({ step: 'report', interviews, report: md });
        } catch {
          /* ignore */
        }
      }
    } catch (err) {
      setError(`${err.message} · 访谈记录仍在页面中，关闭时可保存到历史`);
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const handleSavePersona = (p) => {
    savePersonaToLibrary({
      persona: p,
      marketId,
      marketTitle,
      researchTopic,
      corpusSnippets,
    });
    refreshLibrary();
  };

  const handleUseSavedPersona = (entry) => {
    setPersonas((prev) => {
      const exists = prev.some((p) => p.id === entry.persona.id);
      if (exists) return prev;
      return [...prev, entry.persona];
    });
    if (entry.researchTopic) setResearchTopic(entry.researchTopic);
    setStep('personas');
    setShowLibrary(false);
  };

  const handleSyncThreeStep = async (autoGenerate = false) => {
    if (!report && !interviews.length) {
      setError('请先完成模拟访谈或生成报告');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = await buildSyncToThreeStepPayload({
        researchTopic,
        audienceCriteria,
        marketTitle,
        personas,
        interviews,
        simReport: report,
        corpusSnippets,
        researchMaterials: materialsPayload,
      });
      onSyncToThreeStepReport?.(payload, { autoGenerate });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = () => {
    downloadResearchPdf({
      title: '模拟用户调研报告',
      subtitle: researchTopic,
      markdown: report,
      marketLabel: marketTitle,
    });
  };

  const handleExportWord = () => {
    downloadResearchWord({
      title: '模拟用户调研报告',
      subtitle: researchTopic,
      markdown: report,
      marketLabel: marketTitle,
      interviews,
    });
  };

  const resetAll = () => {
    setStep('materials');
    setResearchMaterials(createEmptyMaterials());
    setPersonas([]);
    setInterviews([]);
    setReport('');
    setCorpusSnippets([]);
    setHistorySessionId(null);
    setInterviewBatchId(null);
    setMaterialsStarted(false);
    setError('');
    setProgress('');
    refreshLibrary();
  };

  const skipMaterials = () => {
    setMaterialsStarted(true);
    setResearchMaterials({ ...createEmptyMaterials(), skipped: true });
    goToStep('setup');
  };

  return (
    <section className="sim-research-panel">
      <div className="sim-research-header">
        <h3 className="section-heading">
          <span className="section-icon">🎭</span>
          模拟调研 · AI 人设访谈
        </h3>
        <p className="sim-research-desc">
          可选上传产品/UI 素材 → 外接小红书/微博/知乎语料 → 构建人设 → 双专员模拟访谈（笔录 + 表情情绪观察）→
          导出 / 联动三步分析。
        </p>
        <p className="sim-research-pricing">
          步骤 0–1 免费 · 人设 ¥{stepCostYuan(walletCostsYuan, 'sim_personas')} · 全部访谈 ¥
          {stepCostYuan(walletCostsYuan, 'sim_interview')} · 报告 ¥{stepCostYuan(walletCostsYuan, 'sim_report')} · 合计约 ¥
          {simFlowCostYuan(walletCostsYuan)}
        </p>
        <button
          type="button"
          className="sim-btn-ghost sim-library-toggle"
          onClick={() => setShowLibrary(!showLibrary)}
        >
          {showLibrary ? '收起人设库' : `人设库 (${savedPersonas.length})`}
        </button>
        <span className="sim-hint sim-history-hint">
          退出本页时可保存进度到右上角「我的历史」
        </span>
      </div>

      {showLibrary && (
        <div className="sim-library-panel">
          <h4 className="sim-library-title">已保存人设</h4>
          {savedPersonas.length === 0 && <p className="sim-hint">暂无，可在人设卡片上点击「存入人设库」</p>}
          {savedPersonas.map((entry) => (
            <div key={entry.id} className="sim-library-item">
              <span>
                <strong>{entry.persona?.name}</strong> · {entry.marketTitle}
              </span>
              <div className="sim-library-actions">
                <button type="button" className="sim-link-btn" onClick={() => handleUseSavedPersona(entry)}>
                  选用
                </button>
                <button
                  type="button"
                  className="sim-link-btn danger"
                  onClick={() => {
                    deletePersonaFromLibrary(entry.id);
                    refreshLibrary();
                  }}
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!aiConfigured && (
        <div className="ai-error">请先配置 DEEPSEEK_API_KEY 后使用模拟调研</div>
      )}
      {modelId === 'deepseek-v4-pro' && (
        <p className="sim-hint sim-pro-hint">
          当前为 {currentModel?.label || 'DeepSeek Pro'}：单步耗时较长，进度会自动保存到历史会话；若超时建议改用 Flash 或减少受访者人数。
        </p>
      )}

      <OpenPlatformPanel />

      <div className="sim-step-tabs">
        {STEPS.map((s, idx) => {
          const currentIdx = STEPS.findIndex((x) => x.id === step);
          return (
            <span
              key={s.id}
              className={`sim-step-tab ${step === s.id ? 'active' : ''} ${currentIdx > idx ? 'done' : ''}`}
            >
              {s.label}
            </span>
          );
        })}
      </div>

      {step === 'materials' && (
        <ResearchMaterialsStep
          materials={researchMaterials}
          onChange={handleMaterialsChange}
          onSkip={skipMaterials}
          onNext={() => {
            setMaterialsStarted(true);
            setResearchMaterials((m) => ({ ...m, skipped: !hasAnyMaterials(m) }));
            goToStep('setup');
          }}
        />
      )}

      {step === 'setup' && (
        <div className="sim-step-body">
          {hasAnyMaterials(researchMaterials) && (
            <p className="sim-hint sim-materials-badge">
              已添加研究素材（产品/UI），生成人设后将按流程追问用户自发感受。
            </p>
          )}
          <button type="button" className="sim-link-btn sim-back-materials" onClick={() => setStep('materials')}>
            ← 返回修改素材
          </button>
          <label className="sim-label">调研主题 *</label>
          <textarea
            className="sim-textarea"
            value={researchTopic}
            onChange={(e) => {
              const value = e.target.value;
              setResearchTopic(value);
              onSnapshotChange?.({
                historySessionId,
                marketId,
                marketTitle,
                ...buildSessionPayload({ researchTopic: value }),
              });
            }}
            placeholder="例：美国 Z 世代对二次元周边二手交易 App 的信任与付费意愿"
            rows={3}
          />
          <label className="sim-label">目标人群条件</label>
          <textarea
            className="sim-textarea"
            value={audienceCriteria}
            onChange={(e) => {
              const value = e.target.value;
              setAudienceCriteria(value);
              onSnapshotChange?.({
                historySessionId,
                marketId,
                marketTitle,
                ...buildSessionPayload({ audienceCriteria: value }),
              });
            }}
            placeholder="例：18–28 岁、玩过 ACG、有二手交易经验"
            rows={2}
          />
          <label className="sim-label">外部语料来源（构建人设前自动检索）</label>
          <div className="sim-corpus-sources">
            {CORPUS_OPTIONS.map((opt) => (
              <label key={opt.id} className="sim-corpus-check">
                <input
                  type="checkbox"
                  checked={corpusSources.includes(opt.id)}
                  onChange={() => toggleSource(opt.id)}
                />
                {opt.label}
              </label>
            ))}
          </div>
          {corpusMeta && (
            <p className="sim-hint">
              精选 {corpusMeta.snippetCount ?? '—'} 条
              {corpusMeta.justoneConfigured ? ' · Just One API 已配置' : ' · 配置 JUSTONE_API_TOKEN 可拉取真实笔记'}
              {corpusMeta.serperConfigured ? ' · Serper 已启用' : ''}
            </p>
          )}
          {corpusErrors.length > 0 && (
            <div className="sim-corpus-errors">
              {corpusErrors.map((e) => (
                <p key={e}>{e}</p>
              ))}
            </div>
          )}
          {corpusSnippets.length > 0 && (
            <div className="sim-corpus-preview">
              <span className="sim-label">已检索语料 ({corpusSnippets.length})</span>
              {corpusSnippets.slice(0, 3).map((s, i) => (
                <p key={i} className="sim-corpus-snippet">
                  [{s.sourceLabel}] {s.title}：{s.content.slice(0, 80)}…
                </p>
              ))}
            </div>
          )}
          <label className="sim-label">受访者人数（2–5）</label>
          <select
            className="sim-select"
            value={personaCount}
            onChange={(e) => setPersonaCount(Number(e.target.value))}
          >
            {[2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} 人
              </option>
            ))}
          </select>
          <label className="sim-label">访谈提纲（每行一题）</label>
          <textarea
            className="sim-textarea sim-textarea-sm"
            value={guideQuestions}
            onChange={(e) => setGuideQuestions(e.target.value)}
            rows={5}
          />
          <button
            type="button"
            className="sim-btn-primary"
            disabled={loading || !aiConfigured}
            onClick={handleGeneratePersonas}
          >
            {loading
              ? progress || '处理中…'
              : `检索语料并生成人设 →（¥${stepCostYuan(walletCostsYuan, 'sim_personas')}）`}
          </button>
        </div>
      )}

      {step === 'personas' && (
        <div className="sim-step-body">
          <p className="sim-hint">人设已结合外部语料与 {marketTitle} 文化数据生成。</p>
          <div className="sim-persona-grid">
            {personas.map((p) => (
              <article key={p.id} className="sim-persona-card">
                <h4>
                  {p.name}
                  <span className="sim-persona-meta">
                    {p.age}岁 · {p.occupation}
                    {p.city ? ` · ${p.city}` : ''}
                  </span>
                </h4>
                <p className="sim-persona-oneliner">{p.oneLiner}</p>
                <p className="sim-persona-bg">{p.background}</p>
                {p.corpusInspiration && (
                  <p className="sim-corpus-inspire">📎 语料：{p.corpusInspiration}</p>
                )}
                <button type="button" className="sim-link-btn" onClick={() => handleSavePersona(p)}>
                  存入人设库
                </button>
              </article>
            ))}
          </div>
          <div className="sim-actions-row">
            <button type="button" className="sim-btn-ghost" onClick={() => goToStep('setup')}>
              ← 修改设定
            </button>
            <button
              type="button"
              className="sim-btn-primary"
              disabled={loading || !aiConfigured}
              onClick={handleRunInterviews}
            >
              {loading ? progress || '进行中…' : '开始模拟访谈并生成报告 →'}
            </button>
          </div>
        </div>
      )}

      {(step === 'interviews' || step === 'report') && interviews.length > 0 && (
        <div className="sim-step-body">
          <p className="sim-hint">
            已完成 {interviews.length}/{personas.length || interviews.length} 场模拟访谈 · 含访谈笔录专员与表情情绪观察专员记录 · 可回放
          </p>
          {step === 'interviews' && interviews.length < personas.length && (
            <button
              type="button"
              className="sim-btn-primary"
              disabled={loading || !aiConfigured}
              onClick={handleRunInterviews}
            >
              {loading
                ? progress || '进行中…'
                : `继续未完成访谈 (${interviews.length}/${personas.length}) →`}
            </button>
          )}
          {step === 'interviews' && interviews.length >= personas.length && !report && (
            <div className="sim-actions-row">
              <button
                type="button"
                className="sim-btn-primary"
                disabled={loading || !aiConfigured}
                onClick={handleGenerateReport}
              >
                {loading
                  ? progress || '生成中…'
                  : `生成调研报告 →（¥${stepCostYuan(walletCostsYuan, 'sim_report')}）`}
              </button>
            </div>
          )}
          {interviews.map((iv) => (
            <article key={iv.personaId} className="sim-interview-card">
              <div className="sim-interview-actions">
                <button
                  type="button"
                  className="sim-link-btn"
                  onClick={() => setReplayInterview(iv)}
                >
                  ▶ 回放访谈
                </button>
                <button
                  type="button"
                  className="sim-link-btn"
                  onClick={() =>
                    setExpandedInterview(expandedInterview === iv.personaId ? null : iv.personaId)
                  }
                >
                  {expandedInterview === iv.personaId ? '收起笔录' : '查看笔录'}
                </button>
              </div>
              <strong>{iv.personaName}</strong>
              <span className="sim-interview-summary">{iv.summary}</span>
              {expandedInterview === iv.personaId && (
                <div className="sim-transcript-dual">
                  {(iv.transcript || []).map((t, i) => {
                    const obs = (iv.observationLog || []).find(
                      (o) => Number(o.transcriptIndex) === i,
                    );
                    return (
                      <div key={i} className="sim-transcript-row">
                        <div className={`sim-transcript-line ${t.role}`}>
                          <span className="sim-transcript-role sim-role-transcript">
                            {t.role === 'interviewer' ? '笔录·访谈员' : '笔录·受访者'}
                          </span>
                          <p>{t.text}</p>
                        </div>
                        {t.role === 'participant' && obs && (
                          <div className="sim-observation-line">
                            <span className="sim-transcript-role sim-role-observer">观察·情绪专员</span>
                            <p>
                              <strong>{obs.scene}</strong> {obs.expression} · {obs.emotion}
                              {obs.gapNote ? ` · 落差：${obs.gapNote}` : ''}
                              {obs.userMindInsight ? ` · 自发：${obs.userMindInsight}` : ''}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {step === 'report' && report && (
        <div className="sim-step-body">
          <div className="sim-actions-row sim-actions-top sim-actions-wrap">
            <button type="button" className="sim-btn-primary sim-btn-pdf" onClick={handleExportPdf}>
              导出 PDF
            </button>
            <button type="button" className="sim-btn-primary sim-btn-word" onClick={handleExportWord}>
              导出 Word
            </button>
            <button
              type="button"
              className="sim-btn-primary sim-btn-sync"
              disabled={loading}
              onClick={() => handleSyncThreeStep(false)}
            >
              填入三步分析
            </button>
            <button
              type="button"
              className="sim-btn-primary sim-btn-sync-auto"
              disabled={loading}
              onClick={() => handleSyncThreeStep(true)}
            >
              联动并生成三步报告
            </button>
            <button type="button" className="sim-btn-ghost" onClick={resetAll}>
              新建调研
            </button>
          </div>
          <div className="ai-report-box sim-report-box">
            <ReportMarkdown text={report} />
          </div>
        </div>
      )}

      {loading && progress && (
        <div className="sim-progress-bar">
          <div className="sim-progress-pulse" />
          <span>{progress}</span>
        </div>
      )}

      {error && <div className="ai-error">{error}</div>}

      {replayInterview && (
        <InterviewReplay interview={replayInterview} onClose={() => setReplayInterview(null)} />
      )}

    </section>
  );
});

export default SimulatedResearchPanel;
