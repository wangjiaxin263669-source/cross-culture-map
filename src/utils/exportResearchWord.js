/**
 * 导出 Word（.doc，HTML 格式，Word/WPS 可直接打开）
 */
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function markdownToWordHtml(md) {
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
    const t = line.trim();
    if (!t) {
      closeList();
      continue;
    }
    if (t.startsWith('### ')) {
      closeList();
      parts.push(`<h3>${escapeHtml(t.slice(4))}</h3>`);
    } else if (t.startsWith('## ')) {
      closeList();
      parts.push(`<h2>${escapeHtml(t.slice(3))}</h2>`);
    } else if (t.startsWith('# ')) {
      closeList();
      parts.push(`<h1>${escapeHtml(t.slice(2))}</h1>`);
    } else if (t.startsWith('> ')) {
      closeList();
      parts.push(
        `<p style="margin-left:20px;border-left:3px solid #0ea5e9;padding-left:10px;color:#334155;">${escapeHtml(t.slice(2))}</p>`,
      );
    } else if (t.startsWith('- ') || t.startsWith('* ')) {
      if (!inList) {
        parts.push('<ul>');
        inList = true;
      }
      parts.push(`<li>${escapeHtml(t.slice(2))}</li>`);
    } else {
      closeList();
      parts.push(`<p>${escapeHtml(t)}</p>`);
    }
  }
  closeList();
  return parts.join('\n');
}

export function downloadResearchWord({ title, subtitle, markdown, marketLabel, interviews }) {
  const bodyHtml = markdownToWordHtml(markdown);
  const interviewHtml = (interviews || [])
    .map((iv) => {
      const lines = (iv.transcript || [])
        .map((t, idx) => {
          const obs = (iv.observationLog || []).find((o) => Number(o.transcriptIndex) === idx);
          let html = `<p><b>${t.role === 'interviewer' ? '笔录·访谈员' : '笔录·受访者'}：</b>${escapeHtml(t.text)}</p>`;
          if (t.role === 'participant' && obs) {
            html += `<p style="color:#92400e;"><b>观察·情绪专员：</b>${escapeHtml(obs.scene || '')} ${escapeHtml(obs.expression || '')} ${escapeHtml(obs.userMindInsight || obs.gapNote || '')}</p>`;
          }
          return html;
        })
        .join('');
      return `<h3>访谈：${escapeHtml(iv.personaName)}</h3><p><i>${escapeHtml(iv.summary || '')}</i></p>${lines}`;
    })
    .join('<hr/>');

  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
<body style="font-family:宋体,SimSun,PingFang SC,sans-serif;font-size:12pt;line-height:1.6;">
  <h1>${escapeHtml(title)}</h1>
  <p style="color:#666;">${escapeHtml(subtitle)} · ${escapeHtml(marketLabel)} · CROSS-CULTURE 模拟调研</p>
  <hr/>
  ${bodyHtml}
  ${interviewHtml ? `<h2>附录：访谈实录</h2>${interviewHtml}` : ''}
  <p style="color:#999;font-size:10pt;margin-top:40px;">本报告由 AI 模拟访谈生成，请结合真人调研验证。</p>
</body></html>`;

  const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `模拟调研报告-${marketLabel || 'report'}.doc`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
