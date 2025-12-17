/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * Logs errors and displays a fallback UI
 */

'use client';

import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error details:', errorInfo);

    // You can also log to an error reporting service here
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
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI with ARCHITECT ZERO styling
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0A0E27 0%, #1a1f3a 100%)',
            padding: '20px',
          }}
        >
          <div
            style={{
              maxWidth: '600px',
              width: '100%',
              padding: '48px',
              borderRadius: '24px',
              background: 'rgba(13, 17, 38, 0.95)',
              border: '1px solid rgba(77, 189, 255, 0.3)',
              backdropFilter: 'blur(24px) saturate(180%)',
              boxShadow: '0 0 60px rgba(77, 189, 255, 0.2), inset 0 2px 0 rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Error Icon */}
            <div
              style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 24px',
                borderRadius: '50%',
                background: 'rgba(255, 59, 48, 0.2)',
                border: '2px solid rgba(255, 59, 48, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px',
              }}
            >
              ⚠️
            </div>

            {/* Error Title */}
            <h1
              style={{
                fontSize: '32px',
                fontWeight: 700,
                color: '#FFFFFF',
                textAlign: 'center',
                marginBottom: '16px',
                textShadow: '0 0 20px rgba(77, 189, 255, 0.5)',
              }}
            >
              Что-то пошло не так
            </h1>

            {/* Error Message */}
            <p
              style={{
                fontSize: '16px',
                color: 'rgba(255, 255, 255, 0.7)',
                textAlign: 'center',
                marginBottom: '32px',
                lineHeight: '1.6',
              }}
            >
              Произошла непредвиденная ошибка. Мы уже работаем над её исправлением.
            </p>

            {/* Error Details (only in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div
                style={{
                  marginBottom: '32px',
                  padding: '20px',
                  borderRadius: '12px',
                  background: 'rgba(255, 59, 48, 0.1)',
                  border: '1px solid rgba(255, 59, 48, 0.3)',
                }}
              >
                <p
                  style={{
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    color: '#FF3B30',
                    marginBottom: '12px',
                    fontWeight: 600,
                  }}
                >
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                    <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>
                      Stack Trace
                    </summary>
                    <pre
                      style={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontSize: '11px',
                        lineHeight: '1.4',
                      }}
                    >
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                gap: '16px',
                justifyContent: 'center',
              }}
            >
              {/* Reset Button */}
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  padding: '14px 32px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #4DBDFF, #B13CFF)',
                  border: '1px solid rgba(77, 189, 255, 0.5)',
                  color: '#FFFFFF',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 0 30px rgba(77, 189, 255, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 0 40px rgba(77, 189, 255, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 0 30px rgba(77, 189, 255, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.2)';
                }}
              >
                Попробовать снова
              </button>

              {/* Home Button */}
              <button
                type="button"
                onClick={() => window.location.href = '/'}
                style={{
                  padding: '14px 32px',
                  borderRadius: '12px',
                  background: 'rgba(77, 189, 255, 0.1)',
                  border: '1px solid rgba(77, 189, 255, 0.3)',
                  color: '#4DBDFF',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(77, 189, 255, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(77, 189, 255, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(77, 189, 255, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(77, 189, 255, 0.3)';
                }}
              >
                На главную
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
