import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { TourRedirectPage } from '@/pages/TourRedirectPage';
import { TourEditorPage } from '@/pages/TourEditorPage';
import { RrrRuntimeDemo } from '@/pages/RrrRuntimeDemo';
import { RrrFieldTest } from '@/pages/RrrFieldTest';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/tours" replace /> },
      { path: 'tours', element: <TourRedirectPage /> },
      { path: 'tours/:draftId', element: <TourEditorPage /> },
      ...(import.meta.env.DEV
        ? [
            { path: 'rrr-runtime-demo', element: <RrrRuntimeDemo /> },
            { path: 'rrr-field-test', element: <RrrFieldTest /> },
          ]
        : []),
    ],
  },
]);
