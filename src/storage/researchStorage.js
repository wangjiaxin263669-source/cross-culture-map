import { hasAnyMaterials } from '../utils/researchMaterials';

const STORAGE_KEY = 'cross-culture-research-v1';
const ACTIVE_DRAFT_KEY = 'cross-culture-sim-active-draft-v1';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { personas: [], sessions: [] };
  } catch {
    return { personas: [], sessions: [] };
  }
}

function loadActiveDraftMap() {
  try {
    const raw = localStorage.getItem(ACTIVE_DRAFT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveActiveDraftMap(map) {
  try {
    localStorage.setItem(ACTIVE_DRAFT_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

function stripMaterialsHeavyImages(materials) {
  if (!materials) return materials;
  return {
    ...materials,
    productImages: (materials.productImages || []).map(({ previewUrl, dataUrl, ...rest }) => ({
      ...rest,
      imageStripped: true,
    })),
    uiFlowSteps: (materials.uiFlowSteps || []).map(({ previewUrl, dataUrl, ...rest }) => ({
      ...rest,
      imageStripped: true,
    })),
    uiScreenshot: materials.uiScreenshot
      ? {
          ...materials.uiScreenshot,
          previewUrl: undefined,
          dataUrl: undefined,
          imageStripped: true,
        }
      : null,
  };
}

function save(data, { stripImages = false } = {}) {
  const payload = stripImages
    ? {
        ...data,
        sessions: (data.sessions || []).map((s) => ({
          ...s,
          researchMaterials: stripMaterialsHeavyImages(s.researchMaterials),
        })),
      }
    : data;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return { ok: true, stripped: stripImages };
  } catch (err) {
    if (!stripImages && (err?.name === 'QuotaExceededError' || err?.code === 22)) {
      return save(data, { stripImages: true });
    }
    console.warn('[researchStorage] save failed', err);
    return { ok: false, error: err };
  }
}

function uid() {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function setActiveSimDraftId(marketId, sessionId) {
  if (!marketId || !sessionId) return;
  const map = loadActiveDraftMap();
  map[marketId] = sessionId;
  saveActiveDraftMap(map);
}

export function clearActiveSimDraftId(marketId) {
  if (!marketId) return;
  const map = loadActiveDraftMap();
  delete map[marketId];
  saveActiveDraftMap(map);
}

/** 是否应写入草稿（从素材上传成功 / 进入设定步起即保存） */
export function shouldPersistSimDraft({
  step,
  researchTopic,
  audienceCriteria,
  researchMaterials,
  personas,
  interviews,
  report,
  materialsStarted,
}) {
  if ((personas?.length || 0) > 0) return true;
  if ((interviews?.length || 0) > 0) return true;
  if (report) return true;
  if (researchTopic?.trim()) return true;
  if (audienceCriteria?.trim()) return true;
  if (hasAnyMaterials(researchMaterials)) return true;
  if (researchMaterials?.skipped) return true;
  if (materialsStarted) return true;
  if (step && step !== 'materials') return true;
  return false;
}

export function listPersonas() {
  return load().personas.sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || ''));
}

export function listSessions() {
  return load().sessions.sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || ''));
}

export function savePersonaToLibrary({ persona, marketId, marketTitle, researchTopic, corpusSnippets }) {
  const data = load();
  const item = {
    id: uid(),
    savedAt: new Date().toISOString(),
    persona,
    marketId,
    marketTitle,
    researchTopic,
    corpusSnippets: corpusSnippets || [],
  };
  data.personas.unshift(item);
  if (data.personas.length > 50) data.personas.length = 50;
  save(data);
  return item;
}

export function saveSessionToLibrary(session) {
  const data = load();
  const item = {
    id: session.id || uid(),
    savedAt: new Date().toISOString(),
    ...session,
  };
  const idx = data.sessions.findIndex((s) => s.id === item.id);
  if (idx >= 0) data.sessions[idx] = item;
  else data.sessions.unshift(item);
  if (data.sessions.length > 30) data.sessions.length = 30;
  const result = save(data);
  if (item.marketId && item.isDraft !== false) {
    setActiveSimDraftId(item.marketId, item.id);
  }
  return { ...item, storageWarning: result.stripped ? 'images_stripped' : null, saveOk: result.ok };
}

/** 自动保存模拟调研草稿（失败/中途退出可恢复） */
export function saveSimDraft(session) {
  return saveSessionToLibrary({
    ...session,
    isDraft: session.isDraft !== false,
  });
}

const STEP_LABELS = {
  materials: '0 素材',
  setup: '1 设定',
  personas: '2 人设',
  interviews: '3 访谈',
  report: '4 报告',
};

export function getSimSessionStepLabel(session) {
  if (!session?.step) return '';
  return STEP_LABELS[session.step] || session.step;
}

/** 当前国家/地区下应自动恢复的草稿 */
export function getActiveSimDraftForMarket(marketId) {
  if (!marketId) return null;
  const map = loadActiveDraftMap();
  const linkedId = map[marketId];
  if (linkedId) {
    const linked = getSessionById(linkedId);
    if (linked) return linked;
  }
  return (
    listSessions().find((s) => s.marketId === marketId && s.isDraft !== false) || null
  );
}

export function deletePersonaFromLibrary(id) {
  const data = load();
  data.personas = data.personas.filter((p) => p.id !== id);
  save(data);
}

export function deleteSessionFromLibrary(id) {
  const data = load();
  const removed = data.sessions.find((s) => s.id === id);
  data.sessions = data.sessions.filter((s) => s.id !== id);
  save(data);
  if (removed?.marketId) {
    const map = loadActiveDraftMap();
    if (map[removed.marketId] === id) clearActiveSimDraftId(removed.marketId);
  }
}

export function getSessionById(id) {
  return load().sessions.find((s) => s.id === id) || null;
}
