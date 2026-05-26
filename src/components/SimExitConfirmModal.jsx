import React from 'react';
import { getSimStepLabel } from '../utils/simResearchDraft';

/**
 * 退出国家面板时询问是否保存模拟调研进度
 */
export default function SimExitConfirmModal({
  open,
  step,
  researchTopic,
  loggedIn,
  saving,
  error,
  onSave,
  onDiscard,
  onCancel,
}) {
  if (!open) return null;

  const topicPreview = researchTopic?.trim()
    ? researchTopic.trim().slice(0, 40)
    : '（未填写主题）';

  return (
    <div className="sim-exit-overlay" onClick={onCancel}>
      <div className="sim-exit-dialog" onClick={(e) => e.stopPropagation()}>
        <h4>是否保存当前模拟调研？</h4>
        <p className="sim-exit-desc">
          将保存步骤 <strong>{getSimStepLabel(step)}</strong>、素材与已填写内容到「我的历史」，之后可点击继续。
        </p>
        <p className="sim-exit-topic">主题：{topicPreview}</p>
        {!loggedIn && (
          <p className="sim-exit-warn">
            当前未登录，无法写入云端历史。请选择「不保存，直接退出」，或登录后重新保存。
          </p>
        )}
        {error && <p className="sim-exit-error">{error}</p>}
        <div className="sim-exit-actions">
          <button
            type="button"
            className="sim-btn-primary"
            disabled={!loggedIn || saving}
            onClick={onSave}
          >
            {saving ? '保存中…' : '保存到历史'}
          </button>
          <button type="button" className="sim-btn-ghost" disabled={saving} onClick={onDiscard}>
            不保存，直接退出
          </button>
          <button type="button" className="sim-link-btn" disabled={saving} onClick={onCancel}>
            继续编辑
          </button>
        </div>
      </div>
    </div>
  );
}
