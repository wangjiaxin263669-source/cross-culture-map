import React from 'react';

export default class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: 40,
          color: '#fca5a5',
          background: '#111',
          minHeight: '100vh',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <h2 style={{ color: '#fff' }}>页面加载出错</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, marginTop: 16 }}>
            {this.state.error.message}
          </pre>
          <p style={{ color: '#94a3b8', marginTop: 20, fontSize: 13 }}>
            请按 Ctrl+Shift+R 强制刷新，或在终端执行 npm run dev 后重试。
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
