import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorId: null,
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true, errorId: `err_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}` };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("Uncaught error:", error, errorInfo);
    } else {
      console.error("An unexpected error occurred. Error ID:", this.state.errorId);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, errorId: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
          </p>
          {this.state.errorId && (
            <p className="text-xs text-muted-foreground mb-4">
              Error ID: <code className="bg-muted px-2 py-0.5 rounded">{this.state.errorId}</code>
            </p>
          )}
          <div className="flex gap-3">
            <Button onClick={this.handleReset} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
            <Button onClick={() => window.location.reload()} className="gap-2">
              Refresh Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
