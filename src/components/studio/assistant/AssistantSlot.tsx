import type { CSSProperties } from 'react';
import { Icon } from '../Icon';
import type { LocalCheck } from '../readiness';
import type { StudioWorkflowSection } from '../workflow/workflowTypes';
import type { AssistantAction, AssistantSuggestion } from './assistantTypes';
import { LocalCheckList } from './LocalCheckList';
import { SuggestionPanel } from './SuggestionPanel';

interface Props {
  /**
   * The workspace this slot belongs to. Reserved for later routing of real
   * agent actions; not used visually in PR-18.
   */
  section: StudioWorkflowSection;
  title: string;
  description?: string;
  checks?: LocalCheck[];
  actions?: AssistantAction[];
  suggestions?: AssistantSuggestion[];
  disabled?: boolean;
}

/**
 * Reusable slot for per-workspace assistant UI.
 *
 * In PR-18 this is purely structural: it renders local checks, an action
 * button row, and a suggestion list. No network, no model — the only line
 * the user sees confirms that "Local checks only. AI provider is not
 * connected yet." Later PRs replace the inert action handlers with real
 * agent calls and start populating `suggestions`.
 */
export function AssistantSlot({
  section: _section,
  title,
  description,
  checks,
  actions,
  suggestions,
  disabled,
}: Props) {
  return (
    <section style={containerStyle}>
      <header style={headerStyle}>
        <span
          style={{
            display: 'inline-grid',
            placeItems: 'center',
            width: 26,
            height: 26,
            borderRadius: 8,
            background: 'rgba(144, 74, 72, 0.1)',
            color: 'var(--stq-primary)',
          }}
        >
          <Icon name="sparkles" size={14} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={eyebrow}>Assistant</div>
          <div
            style={{
              fontFamily: 'var(--stq-font-ui)',
              fontSize: 15,
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            {title}
          </div>
        </div>
      </header>

      {description && (
        <p
          style={{
            margin: 0,
            fontSize: 12.5,
            color: 'var(--stq-text-mute)',
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      )}

      {checks && checks.length > 0 && (
        <Block label="Local checks">
          <LocalCheckList checks={checks} showReady={false} />
        </Block>
      )}

      {actions && actions.length > 0 && (
        <Block label="Actions">
          <div
            style={{
              display: 'flex',
              gap: 6,
              flexWrap: 'wrap',
            }}
          >
            {actions.map((action) => (
              <button
                key={action.id}
                type="button"
                className="studio-btn-ghost"
                style={{
                  minHeight: 28,
                  padding: '0 10px',
                  fontSize: 12,
                }}
                onClick={action.onTrigger}
                disabled={disabled || action.disabled || !action.onTrigger}
                title={action.description}
              >
                {action.label}
              </button>
            ))}
          </div>
        </Block>
      )}

      {suggestions && suggestions.length > 0 && (
        <Block label="Suggestions">
          <SuggestionPanel suggestions={suggestions} />
        </Block>
      )}

      <footer style={footerStyle}>
        <Icon name="wifi-off" size={11} />
        <span>Local checks only. AI provider is not connected yet.</span>
      </footer>
    </section>
  );
}

function Block({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.12em',
          color: 'var(--stq-text-mute)',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

const containerStyle: CSSProperties = {
  background: 'var(--stq-author-surface, white)',
  border: '1px solid var(--stq-border)',
  borderRadius: 10,
  padding: 16,
  boxShadow: 'none',
  color: 'var(--stq-text)',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const footerStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 11,
  color: 'var(--stq-text-mute)',
  paddingTop: 4,
  borderTop: '1px solid var(--stq-border-soft)',
  marginTop: 'auto',
};

const eyebrow: CSSProperties = {
  fontSize: 9.5,
  fontWeight: 700,
  letterSpacing: '0.14em',
  color: 'var(--stq-primary)',
  textTransform: 'uppercase',
};
