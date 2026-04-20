import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { TourListPage } from '@/pages/TourListPage';
import { TourEditorPage } from '@/pages/TourEditorPage';
import { StationEditorPage } from '@/pages/StationEditorPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/tours" replace /> },
      { path: 'tours', element: <TourListPage /> },
      { path: 'tours/:draftId', element: <TourEditorPage /> },
      {
        path: 'tours/:draftId/stations/:stationId',
        element: <StationEditorPage />,
      },
    ],
  },
]);
