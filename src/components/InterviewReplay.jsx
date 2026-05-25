import React, { useEffect, useState, useRef } from 'react';

function observationForLine(observationLog, lineIndex) {
  return (observationLog || []).find((o) => Number(o.transcriptIndex) === lineIndex);
}

/**
 * 逐步回放：访谈笔录专员 + 表情情绪观察专员
 */
export default function InterviewReplay({ interview, onClose }) {
  const [lineIndex, setLineIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1.2);
  const endRef = useRef(null);

  const lines = interview?.transcript || [];
  const visible = lines.slice(0, lineIndex + 1);

  useEffect(() => {
    setLineIndex(0);
    setPlaying(true);
  }, [interview?.personaId]);

  useEffect(() => {
    if (!playing || lineIndex >= lines.length - 1) {
      if (lineIndex >= lines.length - 1 && lines.length) setPlaying(false);
      return undefined;
    }
    const ms = Math.max(400, 1200 / speed);
    const t = setTimeout(() => setLineIndex((i) => i + 1), ms);
    return () => clearTimeout(t);
  }, [playing, lineIndex, lines.length, speed]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lineIndex]);

  if (!interview) return null;

  return (
    <div className="sim-replay-overlay" role="dialog" aria-modal="true">
      <div className="sim-replay-modal sim-replay-modal-wide">
        <div className="sim-replay-header">
          <h4>访谈回放 · {interview.personaName}</h4>
          <span className="sim-replay-dual-badge">笔录专员 + 表情观察专员</span>
          <button type="button" className="sim-replay-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <p className="sim-replay-summary">{interview.summary}</p>
        <div className="sim-replay-controls">
          <button
            type="button"
            className="sim-btn-ghost"
            onClick={() => {
              if (lineIndex >= lines.length - 1) {
                setLineIndex(0);
              }
              setPlaying(!playing);
            }}
          >
            {playing ? '暂停' : lineIndex >= lines.length - 1 ? '重播' : '继续'}
          </button>
          <label className="sim-replay-speed">
            速度
            <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
              <option value={0.8}>慢</option>
              <option value={1.2}>中</option>
              <option value={2}>快</option>
            </select>
          </label>
          <span className="sim-replay-progress">
            {Math.min(lineIndex + 1, lines.length)} / {lines.length}
          </span>
        </div>
        <div className="sim-replay-transcript sim-transcript-dual">
          {visible.map((t, i) => {
            const obs = t.role === 'participant' ? observationForLine(interview.observationLog, i) : null;
            return (
              <div key={i} className="sim-transcript-row">
                <div
                  className={`sim-transcript-line ${t.role} ${i === lineIndex ? 'sim-line-active' : ''}`}
                >
                  <span className="sim-transcript-role sim-role-transcript">
                    {t.role === 'interviewer' ? '笔录·访谈员' : '笔录·受访者'}
                  </span>
                  <p>{t.text}</p>
                </div>
                {obs && (
                  <div className={`sim-observation-line ${i === lineIndex ? 'sim-line-active' : ''}`}>
                    <span className="sim-transcript-role sim-role-observer">观察·情绪专员</span>
                    <p>
                      <strong>{obs.scene}</strong> {obs.expression}
                      {obs.emotion ? ` · ${obs.emotion}` : ''}
                      {obs.gapNote ? ` · 落差：${obs.gapNote}` : ''}
                      {obs.userMindInsight ? ` · 自发：${obs.userMindInsight}` : ''}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
      </div>
    </div>
  );
}
