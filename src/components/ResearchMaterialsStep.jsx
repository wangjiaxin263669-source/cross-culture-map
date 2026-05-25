import React, { useRef, useState } from 'react';
import { readImageFile, PROJECT_DOC_ACCEPT } from '../utils/researchMaterials';
import { parseProjectDocument } from '../services/simulatedResearchApi';

function uid() {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * 可选研究素材：项目文档 / 产品图 / UI 流程 / 单张 UI（均可跳过）
 */
export default function ResearchMaterialsStep({ materials, onChange, onSkip, onNext }) {
  const productInputRef = useRef(null);
  const flowInputRef = useRef(null);
  const singleInputRef = useRef(null);
  const docInputRef = useRef(null);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState('');

  const update = (patch) => onChange({ ...materials, skipped: false, ...patch });

  const addProductImages = async (files) => {
    const list = [...(materials.productImages || [])];
    for (const file of Array.from(files).slice(0, 5 - list.length)) {
      if (!file.type.startsWith('image/')) continue;
      const previewUrl = await readImageFile(file);
      list.push({ id: uid(), name: file.name, previewUrl });
    }
    update({ productImages: list });
  };

  const addProjectDoc = async (file) => {
    if (!file) return;
    setDocError('');
    setDocLoading(true);
    try {
      const result = await parseProjectDocument(file);
      const list = [...(materials.projectDocuments || [])];
      if (list.length >= 3) {
        setDocError('最多上传 3 份项目文档');
        return;
      }
      list.push({
        id: uid(),
        name: file.name,
        textExcerpt: result.text,
        charCount: result.charCount,
        truncated: result.truncated,
      });
      update({ projectDocuments: list });
    } catch (err) {
      setDocError(err.message);
    } finally {
      setDocLoading(false);
    }
  };

  const addFlowStep = () => {
    const steps = materials.uiFlowSteps || [];
    const nextStep = steps.length ? Math.max(...steps.map((s) => s.step || 0)) + 1 : 1;
    update({
      uiFlowSteps: [
        ...steps,
        { id: uid(), step: nextStep, label: '', previewUrl: null },
      ],
    });
  };

  const updateFlowStep = (id, patch) => {
    update({
      uiFlowSteps: (materials.uiFlowSteps || []).map((s) =>
        s.id === id ? { ...s, ...patch } : s,
      ),
    });
  };

  const uploadFlowImage = async (id, file) => {
    if (!file?.type?.startsWith('image/')) return;
    const previewUrl = await readImageFile(file);
    updateFlowStep(id, { previewUrl, name: file.name });
  };

  const setSingleUi = async (file) => {
    if (!file?.type?.startsWith('image/')) return;
    const previewUrl = await readImageFile(file);
    update({
      uiScreenshot: {
        label: materials.uiScreenshot?.label || '',
        previewUrl,
        name: file.name,
      },
    });
  };

  return (
    <div className="sim-step-body sim-materials-step">
      <p className="sim-hint sim-materials-intro">
        以下四项<strong>全部可选</strong>，可跳过。具体调研问题请在下一步「研究设定」中填写；此处仅提供产品/UI/项目背景，供 AI 理解框架并结合小红书/微博语料做模拟访谈。
      </p>

      <section className="sim-materials-block">
        <h4 className="sim-materials-title">① 项目框架文档（PDF / Word / PPT）</h4>
        <p className="sim-materials-desc">
          上传 PRD、方案、汇报等，帮助 AI 理解项目要做什么（单文件 ≤6MB，最多 3 份）。
        </p>
        <button
          type="button"
          className="sim-btn-ghost"
          disabled={docLoading}
          onClick={() => docInputRef.current?.click()}
        >
          {docLoading ? '正在解析文档…' : '+ 上传文档'}
        </button>
        <input
          ref={docInputRef}
          type="file"
          accept={PROJECT_DOC_ACCEPT}
          hidden
          onChange={(e) => {
            addProjectDoc(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        {docError && <p className="sim-doc-error">{docError}</p>}
        <ul className="sim-doc-list">
          {(materials.projectDocuments || []).map((doc) => (
            <li key={doc.id} className="sim-doc-item">
              <span className="sim-doc-name">📄 {doc.name}</span>
              <span className="sim-doc-meta">
                已提取 {doc.charCount || 0} 字{doc.truncated ? '（节选）' : ''}
              </span>
              <button
                type="button"
                className="sim-link-btn"
                onClick={() =>
                  update({
                    projectDocuments: materials.projectDocuments.filter((d) => d.id !== doc.id),
                  })
                }
              >
                移除
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="sim-materials-block">
        <h4 className="sim-materials-title">② 产品实体图（本地上传）</h4>
        <p className="sim-materials-desc">有实物/包装/场景图时使用。</p>
        <button
          type="button"
          className="sim-btn-ghost"
          onClick={() => productInputRef.current?.click()}
        >
          + 添加产品图
        </button>
        <input
          ref={productInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            addProductImages(e.target.files);
            e.target.value = '';
          }}
        />
        <div className="sim-materials-grid">
          {(materials.productImages || []).map((img) => (
            <article key={img.id} className="sim-materials-card">
              {img.previewUrl && (
                <img src={img.previewUrl} alt={img.name} className="sim-materials-thumb" />
              )}
              <span className="sim-materials-filename">{img.name}</span>
              <button
                type="button"
                className="sim-link-btn sim-materials-remove"
                onClick={() =>
                  update({
                    productImages: materials.productImages.filter((p) => p.id !== img.id),
                  })
                }
              >
                移除
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="sim-materials-block">
        <h4 className="sim-materials-title">③ App / 软件主流程界面（多图 + 步骤标注）</h4>
        <p className="sim-materials-desc">按使用顺序标注第几步、对应页面名称，并上传该步界面图。</p>
        <button type="button" className="sim-btn-ghost" onClick={addFlowStep}>
          + 添加流程步骤
        </button>
        {(materials.uiFlowSteps || []).map((s) => (
          <div key={s.id} className="sim-flow-step-card">
            <div className="sim-flow-step-head">
              <label>
                第
                <input
                  type="number"
                  min={1}
                  max={99}
                  className="sim-flow-step-num"
                  value={s.step}
                  onChange={(e) =>
                    updateFlowStep(s.id, { step: Number(e.target.value) || 1 })
                  }
                />
                步
              </label>
              <input
                className="sim-flow-step-label"
                placeholder="页面名称，如：首页 / 支付页"
                value={s.label}
                onChange={(e) => updateFlowStep(s.id, { label: e.target.value })}
              />
              <button
                type="button"
                className="sim-link-btn"
                onClick={() =>
                  update({
                    uiFlowSteps: materials.uiFlowSteps.filter((x) => x.id !== s.id),
                  })
                }
              >
                删除步骤
              </button>
            </div>
            {s.previewUrl && (
              <img src={s.previewUrl} alt={s.label} className="sim-materials-thumb-wide" />
            )}
            <button
              type="button"
              className="sim-btn-ghost"
              onClick={() => {
                flowInputRef.current?.setAttribute('data-step-id', s.id);
                flowInputRef.current?.click();
              }}
            >
              {s.previewUrl ? '更换界面图' : '上传该步界面图'}
            </button>
          </div>
        ))}
        <input
          ref={flowInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const stepId = flowInputRef.current?.getAttribute('data-step-id');
            const file = e.target.files?.[0];
            if (stepId && file) await uploadFlowImage(stepId, file);
            e.target.value = '';
          }}
        />
      </section>

      <section className="sim-materials-block">
        <h4 className="sim-materials-title">④ 单张 UI 界面</h4>
        <p className="sim-materials-desc">聚焦某一屏，用于访谈中追问该页逻辑与视觉感受。</p>
        <button
          type="button"
          className="sim-btn-ghost"
          onClick={() => singleInputRef.current?.click()}
        >
          {materials.uiScreenshot?.previewUrl ? '更换图片' : '上传单张 UI'}
        </button>
        <input
          ref={singleInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            setSingleUi(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        {materials.uiScreenshot?.previewUrl && (
          <img
            src={materials.uiScreenshot.previewUrl}
            alt="UI"
            className="sim-materials-thumb-wide"
          />
        )}
        <input
          className="sim-flow-step-label"
          placeholder="页面说明（可选），如：订阅弹窗"
          value={materials.uiScreenshot?.label || ''}
          onChange={(e) =>
            update({
              uiScreenshot: { ...materials.uiScreenshot, label: e.target.value },
            })
          }
        />
      </section>

      <div className="sim-actions-row">
        <button type="button" className="sim-btn-ghost" onClick={onSkip}>
          跳过，仅概念调研 →
        </button>
        <button type="button" className="sim-btn-primary" onClick={onNext}>
          下一步：填写调研主题 →
        </button>
      </div>
    </div>
  );
}
