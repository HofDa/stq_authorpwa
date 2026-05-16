export type ModuleFeedbackKind = 'idle' | 'running' | 'success' | 'error' | 'info';

export type ModuleFeedbackRuntimeStatus =
  | 'idle'
  | 'running'
  | 'success'
  | 'failed';

export function moduleFeedbackKindFromStatus(
  status: ModuleFeedbackRuntimeStatus | undefined,
): ModuleFeedbackKind {
  switch (status) {
    case 'success':
      return 'success';
    case 'failed':
      return 'error';
    case 'running':
      return 'running';
    case 'idle':
    case undefined:
      return 'idle';
  }
}
