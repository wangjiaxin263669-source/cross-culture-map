import React, { useEffect, useState, useRef } from 'react';

/**
 * 逐步回放模拟访谈笔录（atypica 式「回放」）
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
      <div className="sim-replay-modal">
        <div className="sim-replay-header">
          <h4>访谈回放 · {interview.personaName}</h4>
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
        <div className="sim-replay-transcript">
          {visible.map((t, i) => (
            <div
              key={i}
              className={`sim-transcript-line ${t.role} ${i === lineIndex ? 'sim-line-active' : ''}`}
            >
              <span className="sim-transcript-role">
                {t.role === 'interviewer' ? '访谈员' : '受访者'}
              </span>
              <p>{t.text}</p>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </div>
    </div>
  );
}
