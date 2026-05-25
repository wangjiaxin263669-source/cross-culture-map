/**
 * 将用户上传的产品/UI/项目文档转为提示词（强调用户自发思维，非逻辑推演）
 */
export function formatResearchMaterialsForPrompt(materials) {
  if (!materials || materials.skipped) {
    return '\n【研究素材】用户尚未提供产品实体、UI 或项目文档，仅基于第二步调研设定与外部语料开展。洞察须来自受访者自发表达，勿用产品经理式逻辑推演填补。\n';
  }

  const parts = [];

  if (materials.projectDocuments?.length) {
    parts.push('## 项目框架文档（用户上传，用于理解项目要做什么）');
    materials.projectDocuments.forEach((doc, i) => {
      const excerpt = doc.textExcerpt?.trim();
      parts.push(
        `- 文档${i + 1}「${doc.name || '未命名'}」${doc.charCount ? `（约 ${doc.charCount} 字${doc.truncated ? '，已截断' : ''}）` : ''}`,
      );
      if (excerpt) {
        parts.push(`  摘要节选：${excerpt.slice(0, 1200)}${excerpt.length > 1200 ? '…' : ''}`);
      }
    });
  }

  if (materials.productImages?.length) {
    parts.push('## 产品实体图（用户已上传，访谈中结合调研主题追问使用情境）');
    materials.productImages.forEach((img, i) => {
      parts.push(`- 图${i + 1}${img.name ? `「${img.name}」` : ''}${img.hasImage ? '（已附图）' : ''}`);
    });
  }

  if (materials.uiFlowSteps?.length) {
    parts.push('## App 主流程界面（用户标注步骤，按顺序追问使用感受）');
    materials.uiFlowSteps
      .slice()
      .sort((a, b) => (a.step || 0) - (b.step || 0))
      .forEach((s) => {
        parts.push(
          `- 第${s.step}步 · ${s.label || '未命名页面'}${s.hasImage ? '（已附界面图）' : ''}`,
        );
      });
  }

  if (materials.uiScreenshot?.hasImage || materials.uiScreenshot?.label) {
    const s = materials.uiScreenshot;
    parts.push('## 单张 UI 界面（用于追问该页逻辑/视觉感受）');
    parts.push(`- ${s.label || '关键页面'}${s.hasImage ? '（已附图）' : ''}`);
  }

  if (parts.length === 0) {
    return '\n【研究素材】用户跳过素材上传，请在第二步调研主题与访谈提纲中开展。禁止用逻辑推演代替用户原话。\n';
  }

  return `\n【研究素材 · 结合第二步调研设定提问；发现须来自用户自发反应】\n${parts.join('\n')}\n`;
}
