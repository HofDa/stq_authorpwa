import { lazy, Suspense } from 'react';
import type { RrrInteractionEditorProps } from '@/components/rrr-author/types';

const RrrInteractionEditor = lazy(() =>
  import('@/components/rrr-author/RrrInteractionEditor').then((module) => ({
    default: module.RrrInteractionEditor,
  })),
);

export function LazyRrrInteractionEditor(props: RrrInteractionEditorProps) {
  return (
    <Suspense fallback={<RrrInteractionEditorLoadingState />}>
      <RrrInteractionEditor {...props} />
    </Suspense>
  );
}

function RrrInteractionEditorLoadingState() {
  return (
    <div className="stq-rrr-editor__empty" role="status" aria-live="polite">
      Loading riddle editor...
    </div>
  );
}
