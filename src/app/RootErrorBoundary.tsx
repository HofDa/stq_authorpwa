import { Component, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

export class RootErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }): void {
    if (typeof console !== 'undefined') {
      console.error('[stq] Unhandled render error', error, info);
    }
  }

  private handleReload = () => {
    if (typeof window !== 'undefined') window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div role="alert" className="stq-root-error">
        <div className="stq-root-error__panel">
          <h1 className="stq-root-error__title">
            Etwas ist schiefgegangen
          </h1>
          <p className="stq-root-error__copy">
            Die Seite konnte nicht geladen werden. Bitte lade die Seite neu.
            Wenn das Problem weiter besteht, schließe und öffne den Browser-Tab erneut.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="stq-root-error__button"
          >
            Seite neu laden
          </button>
        </div>
      </div>
    );
  }
}
