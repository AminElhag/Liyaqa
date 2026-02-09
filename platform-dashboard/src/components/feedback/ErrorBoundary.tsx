import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="mb-4 h-16 w-16 text-status-warning" />
          <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {this.state.error?.message ?? 'An unexpected error occurred'}
          </p>
          <button
            onClick={this.handleReset}
            className="mt-4 flex items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-bg-inverse transition-colors hover:bg-brand-accent-hover"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
