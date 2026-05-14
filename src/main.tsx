import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { AppFeedbackProvider } from './components/ui/FeedbackProvider';
import { EditorLanguageProvider } from './i18n/editorLanguage';
import { RootErrorBoundary } from './app/RootErrorBoundary';
import { registerServiceWorker } from './app/registerSW';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <EditorLanguageProvider>
        <AppFeedbackProvider>
          <RouterProvider router={router} future={{ v7_startTransition: true }} />
        </AppFeedbackProvider>
      </EditorLanguageProvider>
    </RootErrorBoundary>
  </React.StrictMode>,
);

registerServiceWorker();
