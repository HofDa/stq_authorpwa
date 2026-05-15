import type { CSSProperties } from 'react';
import {
  getConditionChildren,
  type RrrCondition,
  type RrrConditionType,
} from '@/rrr';
import type { RrrModuleResult, RrrRuntimeStatus } from '@/rrr/runtime';

interface RrrConditionStatusTreeProps {
  condition: RrrCondition | undefined;
  modules: Record<string, RrrModuleResult>;
}

export function RrrConditionStatusTree({
  condition,
  modules,
}: RrrConditionStatusTreeProps) {
  if (!condition) {
    return (
      <div className="stq-rrr-condition-status">
        <div className="stq-rrr-condition-status__header">
          <strong>Lösungsregel-Ansicht</strong>
          <span>Keine Lösungsregel gewählt</span>
        </div>
      </div>
    );
  }

  return (
    <div className="stq-rrr-condition-status">
      <div className="stq-rrr-condition-status__header">
        <strong>Lösungsregel-Ansicht</strong>
        <span>Detailansicht</span>
      </div>
      <ConditionNode condition={condition} modules={modules} depth={0} />
    </div>
  );
}

function ConditionNode({
  condition,
  modules,
  depth,
}: {
  condition: RrrCondition;
  modules: Record<string, RrrModuleResult>;
  depth: number;
}) {
  const status = getConditionStatus(condition, modules);

  if (condition.type === 'module') {
    const module = modules[condition.moduleId];
    return (
      <div
        className="stq-rrr-condition-status__node"
        style={{ '--rrr-tree-depth': depth } as TreeDepthStyle}
      >
        <div>
          <strong>Baustein</strong>
          <span>
            {module
              ? `${module.label} (${condition.moduleId})`
              : `Fehlender Baustein ${condition.moduleId}`}
          </span>
          {module && <small>{module.message}</small>}
        </div>
        <StatusBadge status={status} />
      </div>
    );
  }

  const children = getConditionChildren(condition);
  const detail = getConditionDetail(condition, modules);
  const activeStepIndex =
    condition.type === 'sequence'
      ? getSequenceActiveStepIndex(children, modules)
      : -1;

  return (
    <div className="stq-rrr-condition-status__branch">
      <div
        className="stq-rrr-condition-status__node"
        style={{ '--rrr-tree-depth': depth } as TreeDepthStyle}
      >
        <div>
          <strong>{getConditionTypeLabel(condition.type)}</strong>
          <span>{detail}</span>
        </div>
        <StatusBadge status={status} />
      </div>
      {children.map((child, index) => (
        <div key={`${condition.type}-${depth}-${index}`}>
          {condition.type === 'sequence' && index === activeStepIndex && (
            <div
              className="stq-rrr-condition-status__active"
              style={{ '--rrr-tree-depth': depth + 1 } as TreeDepthStyle}
            >
              Aktiver Schritt
            </div>
          )}
          <ConditionNode condition={child} modules={modules} depth={depth + 1} />
        </div>
      ))}
    </div>
  );
}

function getConditionStatus(
  condition: RrrCondition,
  modules: Record<string, RrrModuleResult>,
): RrrRuntimeStatus {
  if (condition.type === 'module') {
    return modules[condition.moduleId]?.status ?? 'failed';
  }

  const childStatuses = getConditionChildren(condition).map((child) =>
    getConditionStatus(child, modules),
  );
  if (childStatuses.length === 0) {
    return 'idle';
  }
  if (condition.type === 'any_of') {
    if (childStatuses.includes('success')) {
      return 'success';
    }
    return childStatuses.every((status) => status === 'failed')
      ? 'failed'
      : 'running';
  }
  if (childStatuses.includes('failed')) {
    return 'failed';
  }
  return childStatuses.every((status) => status === 'success')
    ? 'success'
    : 'running';
}

function getConditionDetail(
  condition: Exclude<RrrCondition, { type: 'module' }>,
  modules: Record<string, RrrModuleResult>,
): string {
  const children = getConditionChildren(condition);
  const statuses = children.map((child) => getConditionStatus(child, modules));
  if (condition.type === 'sequence') {
    const activeStepIndex = getSequenceActiveStepIndex(children, modules);
    return activeStepIndex >= 0
      ? `Schritt ${activeStepIndex + 1} von ${children.length} ist aktiv`
      : `Alle ${children.length} Schritte sind erfüllt`;
  }
  if (condition.type === 'all_of') {
    const missing = statuses.filter((status) => status !== 'success').length;
    return missing === 0
      ? 'Alle nötigen Bausteine sind erfüllt'
      : `${missing} nötige${missing === 1 ? 'r' : ''} Baustein${
          missing === 1 ? '' : 'e'
        } fehlt${missing === 1 ? '' : 'en'} noch`;
  }
  const solvedIndex = statuses.findIndex((status) => status === 'success');
  return solvedIndex >= 0
    ? `Gelöst durch Möglichkeit ${solvedIndex + 1}`
    : 'Warte auf eine erfüllte Möglichkeit';
}

function getSequenceActiveStepIndex(
  children: RrrCondition[],
  modules: Record<string, RrrModuleResult>,
): number {
  return children.findIndex(
    (child) => getConditionStatus(child, modules) !== 'success',
  );
}

function StatusBadge({ status }: { status: RrrRuntimeStatus }) {
  return (
    <span className={`stq-rrr-status stq-rrr-status--${status}`}>
      {getStatusLabel(status)}
    </span>
  );
}

function getStatusLabel(status: RrrRuntimeStatus): string {
  switch (status) {
    case 'idle':
      return 'Bereit';
    case 'running':
      return 'Läuft';
    case 'success':
      return 'Erfüllt';
    case 'failed':
      return 'Fehlgeschlagen';
  }
}

function getConditionTypeLabel(type: RrrConditionType): string {
  switch (type) {
    case 'module':
      return 'Baustein';
    case 'sequence':
      return 'Nacheinander';
    case 'all_of':
      return 'Alles muss erfüllt sein';
    case 'any_of':
      return 'Eine Lösung reicht';
  }
}

type TreeDepthStyle = CSSProperties & {
  '--rrr-tree-depth': number;
};
