import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { StoreProvider } from './store/store';
import './styles.css';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('[app-error]', error);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            padding: 28,
            fontFamily: 'ui-monospace, Consolas, monospace',
            fontSize: 13,
            whiteSpace: 'pre-wrap',
            lineHeight: 1.6
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>
            页面出错了
          </div>
          <div style={{ color: '#b23b2e' }}>
            {String(this.state.error.stack || this.state.error)}
          </div>
          <button
            className="btn"
            style={{ marginTop: 16 }}
            onClick={() => window.location.reload()}
          >
            刷新页面
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <StoreProvider>
        <App />
      </StoreProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
