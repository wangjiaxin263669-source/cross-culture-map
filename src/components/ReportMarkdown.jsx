/** 轻量 Markdown 渲染（报告展示用） */
export default function ReportMarkdown({ text }) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(<div key={`sp-${i}`} className="report-spacer" />);
      return;
    }
    if (trimmed.startsWith('### ')) {
      elements.push(<h4 key={i} className="report-h4">{trimmed.slice(4)}</h4>);
      return;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(<h3 key={i} className="report-h3">{trimmed.slice(3)}</h3>);
      return;
    }
    if (trimmed.startsWith('# ')) {
      elements.push(<h2 key={i} className="report-h2">{trimmed.slice(2)}</h2>);
      return;
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(<li key={i} className="report-li">{trimmed.slice(2)}</li>);
      return;
    }
    elements.push(<p key={i} className="report-p">{trimmed}</p>);
  });

  return <div className="ai-report-body">{elements}</div>;
}
