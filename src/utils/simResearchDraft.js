import { hasAnyMaterials } from './researchMaterials.js';

/** 是否有可保存的模拟调研进度 */
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

export const SIM_STEP_LABELS = {
  materials: '0 素材',
  setup: '1 设定',
  personas: '2 人设',
  interviews: '3 访谈',
  report: '4 报告',
};

export function getSimStepLabel(step) {
  return SIM_STEP_LABELS[step] || step || '';
}
