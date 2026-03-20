import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const MapPage = React.lazy(() => import('@/app/pages/MapPage'));
const LeaderboardPage = React.lazy(() => import('@/app/pages/LeaderboardPage'));
const BattlePage = React.lazy(() => import('@/app/pages/BattlePage'));

function LoadingFallback(): React.ReactNode {
  return (
    <div className="screen-loader">
      <p>LOADING…</p>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <MapPage />
      </Suspense>
    ),
  },
  {
    path: '/leaderboard',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <LeaderboardPage />
      </Suspense>
    ),
  },
  {
    path: '/battle/:id',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <BattlePage />
      </Suspense>
    ),
  },
]);

export function AppRouter(): React.ReactNode {
  return <RouterProvider router={router} />;
}
