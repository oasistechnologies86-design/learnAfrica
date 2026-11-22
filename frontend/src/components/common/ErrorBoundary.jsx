import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Keep a structured diagnostic for support and identify stale deployment
    // chunks separately from application rendering errors.
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    try {
      const message = String(error?.message || error || '');
      if (/dynamically imported module|failed to fetch dynamically|loading chunk|chunkloaderror/i.test(message)) {
        window.dispatchEvent(new CustomEvent('learnafrica:chunk-render-error', {
          detail: { message, path: window.location.pathname, at: Date.now() },
        }));
      }
    } catch { /* diagnostics must never create a second application error */ }
  }

  handleReset = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <main role="alert" className="min-h-screen w-full flex items-center justify-center bg-white px-5 py-12 text-slate-900">
          <div className="w-full max-w-md space-y-5 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700" aria-hidden="true">
              <span className="text-2xl font-bold">!</span>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">This page ran into a problem</h1>
              <p className="text-sm leading-6 text-slate-600">Your account and learning progress have not been deleted. Refresh the page or return to your dashboard.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => { window.location.href = '/dashboard'; }} className="flex-1 rounded-lg border border-slate-300 px-4 py-3 font-semibold hover:bg-slate-50">Go to dashboard</button>
              <button type="button" onClick={this.handleReset} className="flex-1 rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800">Refresh page</button>
            </div>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
