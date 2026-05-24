import React, { useState } from 'react';
import ReportMarkdown from './ReportMarkdown';
import {
  generatePersonas,
  runInterview,
  synthesizeReport,
} from '../services/simulatedResearchApi';
import { downloadResearchPdf } from '../utils/exportResearchPdf';

const STEPS = [
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

export default function SimulatedResearchPanel({ market, marketTitle, aiConfigured }) {
  const [step, setStep] = useState('setup');
  const [researchTopic, setResearchTopic] = useState('');
  const [audienceCriteria, setAudienceCriteria] = useState('');
  const [personaCount, setPersonaCount] = useState(3);
  const [guideQuestions, setGuideQuestions] = useState(DEFAULT_GUIDE.join('\n'));

  const [personas, setPersonas] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [expandedInterview, setExpandedInterview] = useState(null);

  const guideList = guideQuestions
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  const handleGeneratePersonas = async () => {
    if (!researchTopic.trim()) {
      setError('请填写调研主题');
      return;
    }
    setLoading(true);
    setError('');
    setProgress('正在构建当地受访者人设…');
    try {
      const list = await generatePersonas({
        researchTopic,
        audienceCriteria,
        personaCount,
        country: market,
      });
      setPersonas(list);
      setInterviews([]);
      setReport('');
      setStep('personas');
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
    setInterviews([]);
    const results = [];

    try {
      for (let i = 0; i < personas.length; i += 1) {
        const p = personas[i];
        setProgress(`模拟访谈中 (${i + 1}/${personas.length})：${p.name}…`);
        const interview = await runInterview({
          persona: p,
          researchTopic,
          guideQuestions: guideList,
          country: market,
        });
        results.push(interview);
        setInterviews([...results]);
      }
      setStep('interviews');
      setProgress('正在汇总洞察报告…');
      const md = await synthesizeReport({
        researchTopic,
        audienceCriteria,
        personas,
        interviews: results,
        country: market,
      });
      setReport(md);
      setStep('report');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const handleExportPdf = () => {
    if (!report) return;
    downloadResearchPdf({
      title: '模拟用户调研报告',
      subtitle: researchTopic,
      markdown: report,
      marketLabel: marketTitle,
    });
  };

  const resetAll = () => {
    setStep('setup');
    setPersonas([]);
    setInterviews([]);
    setReport('');
    setError('');
    setProgress('');
  };

  return (
    <section className="sim-research-panel">
      <div className="sim-research-header">
        <h3 className="section-heading">
          <span className="section-icon">🎭</span>
          模拟调研 · AI 人设访谈
        </h3>
        <p className="sim-research-desc">
          参考 atypica.AI：为「主观世界」建模——先构建当地受访者人设，再模拟一对一深度访谈，最后生成可导出的调研报告。
        </p>
      </div>

      {!aiConfigured && (
        <div className="ai-error">请先配置 DEEPSEEK_API_KEY 后使用模拟调研</div>
      )}

      <div className="sim-step-tabs">
        {STEPS.map((s, idx) => {
          const currentIdx = STEPS.findIndex((x) => x.id === step);
          return (
            <span
              key={s.id}
              className={`sim-step-tab ${step === s.id ? 'active' : ''} ${
                currentIdx > idx ? 'done' : ''
              }`}
            >
              {s.label}
            </span>
          );
        })}
      </div>

      {step === 'setup' && (
        <div className="sim-step-body">
          <label className="sim-label">调研主题 *</label>
          <textarea
            className="sim-textarea"
            value={researchTopic}
            onChange={(e) => setResearchTopic(e.target.value)}
            placeholder="例：美国 Z 世代对二次元周边二手交易 App 的信任与付费意愿"
            rows={3}
          />
          <label className="sim-label">目标人群条件</label>
          <textarea
            className="sim-textarea"
            value={audienceCriteria}
            onChange={(e) => setAudienceCriteria(e.target.value)}
            placeholder="例：18–28 岁、玩过 ACG、有二手交易经验、主要用 iPhone"
            rows={2}
          />
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
          <label className="sim-label">访谈提纲（每行一题，可改）</label>
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
            {loading ? progress || '生成中…' : '生成受访者人设 →'}
          </button>
        </div>
      )}

      {step === 'personas' && (
        <div className="sim-step-body">
          <p className="sim-hint">以下为 AI 构建的当地受访者，将依次进行模拟深度访谈。</p>
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
                {p.values?.length > 0 && (
                  <p className="sim-tags">
                    {p.values.map((v) => (
                      <span key={v} className="sim-tag">
                        {v}
                      </span>
                    ))}
                  </p>
                )}
              </article>
            ))}
          </div>
          <div className="sim-actions-row">
            <button type="button" className="sim-btn-ghost" onClick={() => setStep('setup')}>
              ← 修改设定
            </button>
            <button
              type="button"
              className="sim-btn-primary"
              disabled={loading || !aiConfigured}
              onClick={handleRunInterviews}
            >
              {loading ? progress || '访谈进行中…' : '开始模拟访谈并生成报告 →'}
            </button>
          </div>
        </div>
      )}

      {(step === 'interviews' || step === 'report') && interviews.length > 0 && (
        <div className="sim-step-body">
          <p className="sim-hint">
            已完成 {interviews.length} 场模拟访谈（访谈员 ↔ 受访者对话）
          </p>
          {interviews.map((iv) => (
            <article key={iv.personaId} className="sim-interview-card">
              <button
                type="button"
                className="sim-interview-toggle"
                onClick={() =>
                  setExpandedInterview(expandedInterview === iv.personaId ? null : iv.personaId)
                }
              >
                <strong>{iv.personaName}</strong>
                <span>{iv.summary}</span>
                <span className="sim-chevron">{expandedInterview === iv.personaId ? '▲' : '▼'}</span>
              </button>
              {expandedInterview === iv.personaId && (
                <div className="sim-transcript">
                  {(iv.transcript || []).map((t, i) => (
                    <div key={i} className={`sim-transcript-line ${t.role}`}>
                      <span className="sim-transcript-role">
                        {t.role === 'interviewer' ? '访谈员' : '受访者'}
                      </span>
                      <p>{t.text}</p>
                    </div>
                  ))}
                </div>
              )}
              {iv.keyQuotes?.length > 0 && (
                <div className="sim-quotes">
                  {iv.keyQuotes.map((q) => (
                    <blockquote key={q}>{q}</blockquote>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {step === 'report' && report && (
        <div className="sim-step-body">
          <div className="sim-actions-row sim-actions-top">
            <button type="button" className="sim-btn-primary sim-btn-pdf" onClick={handleExportPdf}>
              导出 PDF 报告
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

      {loading && progress && step !== 'setup' && (
        <div className="sim-progress-bar">
          <div className="sim-progress-pulse" />
          <span>{progress}</span>
        </div>
      )}

      {error && <div className="ai-error">{error}</div>}
    </section>
  );
}
