import { Component, type ReactNode, type ErrorInfo } from 'react';
import { logger } from '../core/logger.js';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.fatal(error.message, [], {
      'error.component_stack': info.componentStack ?? '',
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback ?? <p>Something went wrong.</p>;
    }
    return this.props.children;
  }
}
