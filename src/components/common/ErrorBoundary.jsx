/**
 * @fileoverview Resilient Error Boundary Component
 * Catches runtime React render exceptions, prevents total screen blackouts,
 * and provides safe one-click navigation recovery back to the dashboard.
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */
import React from 'react';
import { AlertTriangle, RotateCcw, Home, ArrowLeft } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught render exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleBackToSafety = () => {
    if (this.props.onRecovery) {
      this.props.onRecovery();
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/student/dashboard';
    }
  };

  handleGoDashboard = () => {
    window.location.href = '/student/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 w-full min-h-[400px] flex items-center justify-center p-6 bg-bg text-text">
          <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-5 animate-in fade-in">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-text">
                {this.props.title || 'View Encountered An Error'}
              </h2>
              <p className="text-xs text-muted leading-relaxed">
                {this.props.message || 'The page experienced an unexpected issue. You can safely return to your dashboard or reload the view.'}
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-bg rounded-lg border border-border text-left font-mono text-[11px] text-muted overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleBackToSafety}
                className="w-full sm:w-auto px-4 py-2 bg-bg border border-border hover:bg-surface text-text rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Go Back</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto px-4 py-2 bg-surface border border-border hover:bg-bg text-text rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoDashboard}
                className="w-full sm:w-auto px-4 py-2 bg-text text-bg hover:opacity-90 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
