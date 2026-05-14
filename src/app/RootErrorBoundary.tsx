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
      <div
        role="alert"
        style={{
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          padding: '24px',
          background: 'var(--stq-color-bg, #fff8f7)',
          color: 'var(--stq-color-text, #2b1f1c)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <h1 style={{ fontSize: 20, marginBottom: 12 }}>
            Etwas ist schiefgegangen
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 20 }}>
            Die Seite konnte nicht geladen werden. Bitte lade die Seite neu.
            Wenn das Problem weiter besteht, schließe und öffne den Browser-Tab erneut.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            style={{
              padding: '10px 18px',
              borderRadius: 12,
              border: '1px solid currentColor',
              background: 'transparent',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Seite neu laden
          </button>
        </div>
      </div>
    );
  }
}
