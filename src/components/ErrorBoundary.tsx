import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
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
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[200px] p-6 m-4 bg-red-50 border border-red-200 rounded-3xl text-center space-y-3">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-base font-bold text-red-800">
            {this.props.fallbackTitle || '画面の表示中にエラーが発生しました'}
          </h3>
          <p className="text-xs text-red-600 font-mono bg-white p-2 rounded-xl border border-red-100 max-w-md mx-auto break-all">
            {this.state.error?.message || '不明なエラー'}
          </p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5"
          >
            <RefreshCw size={14} />
            <span>アプリを再読み込み</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
