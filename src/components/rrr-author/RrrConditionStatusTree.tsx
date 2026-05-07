import type { CSSProperties } from 'react';
import type { RrrCondition } from '@/rrr';
import type { RrrModuleResult, RrrRuntimeStatus } from '@/rrr-runtime';

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
          <strong>Condition tree</strong>
          <span>No condition selected</span>
        </div>
      </div>
    );
  }

  return (
    <div className="stq-rrr-condition-status">
      <div className="stq-rrr-condition-status__header">
        <strong>Condition tree</strong>
        <span>Debug view</span>
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
          <strong>module</strong>
          <span>
            {module
              ? `${module.label} (${condition.moduleId})`
              : `Missing module ${condition.moduleId}`}
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
          <strong>{condition.type}</strong>
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
              Active step
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
      ? `Step ${activeStepIndex + 1} of ${children.length} is active`
      : `All ${children.length} steps complete`;
  }
  if (condition.type === 'all_of') {
    const missing = statuses.filter((status) => status !== 'success').length;
    return missing === 0
      ? 'All required modules are complete'
      : `${missing} required item${missing === 1 ? '' : 's'} still missing`;
  }
  const solvedIndex = statuses.findIndex((status) => status === 'success');
  return solvedIndex >= 0
    ? `Solved by option ${solvedIndex + 1}`
    : 'Waiting for any option to succeed';
}

function getSequenceActiveStepIndex(
  children: RrrCondition[],
  modules: Record<string, RrrModuleResult>,
): number {
  return children.findIndex(
    (child) => getConditionStatus(child, modules) !== 'success',
  );
}

function getConditionChildren(
  condition: Exclude<RrrCondition, { type: 'module' }>,
): RrrCondition[] {
  return 'steps' in condition ? condition.steps : condition.children;
}

function StatusBadge({ status }: { status: RrrRuntimeStatus }) {
  return (
    <span className={`stq-rrr-status stq-rrr-status--${status}`}>
      {status}
    </span>
  );
}

type TreeDepthStyle = CSSProperties & {
  '--rrr-tree-depth': number;
};
