import { Component } from 'react';

/**
 * Error Boundary component to catch and display errors gracefully
 * Prevents entire app from crashing due to uncaught errors in child components
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-900/20 to-red-800/20 flex items-center justify-center p-4">
          <div className="bg-red-500/20 border border-red-400/40 rounded-2xl p-8 max-w-md backdrop-blur-sm">
            <h1 className="text-2xl font-bold text-red-100 mb-4">Oops! Something went wrong</h1>
            <p className="text-red-200 mb-6">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            {this.state.error && (
              <details className="mb-6 text-xs text-red-300">
                <summary className="cursor-pointer font-mono mb-2">Error Details (Dev Only)</summary>
                <pre className="overflow-auto bg-black/30 p-3 rounded text-red-200">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleReset}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
