/**
 * 将 Markdown 调研报告导出为 PDF（浏览器打印）
 */
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function markdownToSimpleHtml(md) {
  const lines = String(md).split('\n');
  const parts = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      parts.push('</ul>');
      inList = false;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      closeList();
      parts.push('<br/>');
      continue;
    }
    if (trimmed.startsWith('### ')) {
      closeList();
      parts.push(`<h3>${escapeHtml(trimmed.slice(4))}</h3>`);
    } else if (trimmed.startsWith('## ')) {
      closeList();
      parts.push(`<h2>${escapeHtml(trimmed.slice(3))}</h2>`);
    } else if (trimmed.startsWith('# ')) {
      closeList();
      parts.push(`<h1>${escapeHtml(trimmed.slice(2))}</h1>`);
    } else if (trimmed.startsWith('> ')) {
      closeList();
      parts.push(`<blockquote>${escapeHtml(trimmed.slice(2))}</blockquote>`);
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) {
        parts.push('<ul>');
        inList = true;
      }
      parts.push(`<li>${escapeHtml(trimmed.slice(2))}</li>`);
    } else {
      closeList();
      parts.push(`<p>${escapeHtml(trimmed)}</p>`);
    }
  }
  closeList();
  return parts.join('\n');
}

export function downloadResearchPdf({ title, subtitle, markdown, marketLabel }) {
  const html = markdownToSimpleHtml(markdown);
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) {
    alert('请允许弹出窗口以导出 PDF');
    return;
  }

  const doc = win.document;
  doc.open();
  doc.write(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { margin: 18mm; }
    body {
      font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
      color: #1a1a1a;
      line-height: 1.65;
      font-size: 13px;
      max-width: 720px;
      margin: 0 auto;
      padding: 24px;
    }
    .cover {
      border-bottom: 2px solid #0ea5e9;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .cover h1 { font-size: 22px; margin: 0 0 8px; }
    .cover .meta { color: #64748b; font-size: 12px; }
    h2 { font-size: 16px; margin-top: 24px; color: #0f172a; }
    h3 { font-size: 14px; margin-top: 18px; }
    blockquote {
      border-left: 3px solid #0ea5e9;
      margin: 12px 0;
      padding: 8px 14px;
      background: #f0f9ff;
      color: #334155;
    }
    ul { padding-left: 20px; }
    li { margin: 4px 0; }
    .footer {
      margin-top: 40px;
      font-size: 11px;
      color: #94a3b8;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="cover">
    <h1>${escapeHtml(title)}</h1>
    <div class="meta">${escapeHtml(subtitle)} · 市场：${escapeHtml(marketLabel)} · CROSS-CULTURE 模拟调研</div>
  </div>
  <div class="content">${html}</div>
  <div class="footer">本报告由 AI 模拟访谈生成，仅供假设验证与探索，重大决策请结合真人调研。</div>
</body>
</html>`);
  doc.close();

  win.onload = () => {
    setTimeout(() => {
      win.print();
    }, 400);
  };
}
