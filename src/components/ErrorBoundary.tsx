import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-6 font-sans">
          <div className="max-w-lg w-full bg-surface-container-low border border-error/20 rounded-2xl shadow-xl p-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-6 text-error">
              <div className="bg-error/10 p-3 rounded-full">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold text-on-surface">
                Oops, something went wrong.
              </h1>
            </div>

            <div className="bg-surface-container-highest rounded-lg p-4 mb-6 overflow-auto max-h-64 custom-scrollbar border border-outline-variant/30">
              <p className="font-mono text-sm text-error font-medium mb-2">
                {this.state.error?.toString()}
              </p>
              {this.state.errorInfo && (
                <pre className="font-mono text-xs text-on-surface-variant whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-primary text-on-primary font-bold py-3 px-6 rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                <RefreshCcw className="w-4 h-4" />
                Reload Application
              </button>
            </div>
            <p className="mt-6 text-center text-xs text-on-surface-variant">
              If this persists, please contact support with the error details
              above.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
