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

  public handleClose = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-red-200 p-6 max-w-md w-full text-center space-y-4 animate-in fade-in">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {this.props.fallbackTitle || '画面の表示中にエラーが発生しました'}
            </h3>
            <p className="text-xs text-red-600 font-mono bg-red-50 p-3 rounded-xl border border-red-100 max-w-md mx-auto break-all text-left">
              {this.state.error?.message || '不明なエラー'}
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={this.handleClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                閉じる
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>再読み込み</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
