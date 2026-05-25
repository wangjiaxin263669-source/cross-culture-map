/** 研究素材默认值与 API 载荷精简（避免 Netlify 请求体过大） */

export const EMPTY_MATERIALS = {
  skipped: false,
  projectDocuments: [],
  productImages: [],
  uiFlowSteps: [],
  uiScreenshot: null,
};

export function createEmptyMaterials() {
  return structuredClone(EMPTY_MATERIALS);
}

const DOC_ACCEPT = '.pdf,.doc,.docx,.ppt,.pptx';

export const PROJECT_DOC_ACCEPT = DOC_ACCEPT;

/** 读取图片为 dataUrl，限制尺寸 */
export function readImageFile(file, maxEdge = 960) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        const scale = Math.min(1, maxEdge / Math.max(width, height));
        width = Math.round(width * scale);
        height = Math.round(height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('无法读取文件'));
    reader.readAsDataURL(file);
  });
}

export function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64 = String(dataUrl).split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('无法读取文件'));
    reader.readAsDataURL(file);
  });
}

/** 本地预览用完整素材；发 API 只传文字描述 + hasImage 标记 */
export function slimMaterialsForApi(materials) {
  if (!materials) return { skipped: true };
  if (materials.skipped) return { skipped: true };

  return {
    skipped: false,
    projectDocuments: (materials.projectDocuments || []).map((d) => ({
      id: d.id,
      name: d.name,
      textExcerpt: d.textExcerpt || '',
      charCount: d.charCount || 0,
      truncated: Boolean(d.truncated),
    })),
    productImages: (materials.productImages || []).map((img) => ({
      id: img.id,
      name: img.name,
      hasImage: Boolean(img.previewUrl || img.dataUrl),
    })),
    uiFlowSteps: (materials.uiFlowSteps || []).map((s) => ({
      step: s.step,
      label: s.label,
      hasImage: Boolean(s.previewUrl || s.dataUrl),
    })),
    uiScreenshot: materials.uiScreenshot
      ? {
          label: materials.uiScreenshot.label,
          hasImage: Boolean(
            materials.uiScreenshot.previewUrl || materials.uiScreenshot.dataUrl,
          ),
        }
      : null,
  };
}

export function hasAnyMaterials(materials) {
  if (!materials || materials.skipped) return false;
  return (
    (materials.projectDocuments?.length || 0) > 0 ||
    (materials.productImages?.length || 0) > 0 ||
    (materials.uiFlowSteps?.length || 0) > 0 ||
    Boolean(materials.uiScreenshot?.previewUrl || materials.uiScreenshot?.dataUrl)
  );
}
