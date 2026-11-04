import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-800 dark:text-rose-200 text-xs">
          <p className="font-semibold mb-1">A rendering error occurred in this view:</p>
          <pre className="font-mono text-[11px] overflow-auto max-h-32 mb-3 bg-white dark:bg-slate-900 p-2 rounded border border-rose-100 dark:border-rose-900">
            {this.state.error?.message || 'Unknown error'}
          </pre>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              this.props.onReset?.();
            }}
            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-medium text-xs shadow-xs"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
