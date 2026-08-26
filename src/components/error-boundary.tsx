import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-background p-6 text-foreground">
        <p className="text-sm font-medium">The session view crashed</p>
        <p className="mt-2 max-w-md text-center font-mono text-xs text-muted-foreground">{this.state.error.message}</p>
        <button className="mt-4 text-sm underline" onClick={() => this.setState({ error: null })}>
          Try again
        </button>
      </div>
    );
  }
}
