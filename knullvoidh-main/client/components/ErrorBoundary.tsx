import React from 'react';

type Props = { children: React.ReactNode };

type State = { hasError: boolean; message?: string };

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message || 'Runtime error' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.error('UI ErrorBoundary caught:', error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-black text-red-300">
          <div className="p-6 rounded border border-red-500/40 bg-red-900/10 max-w-xl text-center">
            <div className="text-xl font-semibold mb-2">Something went wrong</div>
            <div className="text-sm opacity-80 mb-4">{this.state.message}</div>
            <button onClick={() => (window.location.href = '/')} className="px-4 py-2 rounded bg-red-600/30 border border-red-400/50">Return Home</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
