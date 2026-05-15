import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import {
  LazyRouteElement,
  RrrFieldTestRoute,
  RrrRuntimeDemoRoute,
  TourEditorRoute,
  TourRedirectRoute,
} from './LazyRouteElement';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/tours" replace /> },
      {
        path: 'tours',
        element: (
          <LazyRouteElement>
            <TourRedirectRoute />
          </LazyRouteElement>
        ),
      },
      {
        path: 'tours/:draftId',
        element: (
          <LazyRouteElement>
            <TourEditorRoute />
          </LazyRouteElement>
        ),
      },
      ...(import.meta.env.DEV
        ? [
            {
              path: 'rrr-runtime-demo',
              element: (
                <LazyRouteElement>
                  <RrrRuntimeDemoRoute />
                </LazyRouteElement>
              ),
            },
            {
              path: 'rrr-field-test',
              element: (
                <LazyRouteElement>
                  <RrrFieldTestRoute />
                </LazyRouteElement>
              ),
            },
          ]
        : []),
    ],
  },
]);
