import { Component, type ErrorInfo, type ReactNode } from "react";

export class AppErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("App render failed", error, info);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="app-error">
        <span className="eyebrow">ERROR / 页面加载失败</span>
        <h1>这一页没有打开。</h1>
        <p>可能是版本刚更新，或者本地缓存里少了一个文件。重新加载通常就能恢复。</p>
        <div>
          <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
            重新加载
          </button>
          <a className="btn btn--outline" href="/">
            回首页
          </a>
        </div>
      </div>
    );
  }
}
