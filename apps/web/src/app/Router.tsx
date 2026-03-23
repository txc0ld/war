import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const MapPage = React.lazy(() => import('@/app/pages/MapPage'));
const LeaderboardPage = React.lazy(() => import('@/app/pages/LeaderboardPage'));
const BattlePage = React.lazy(() => import('@/app/pages/BattlePage'));
const KillfeedPage = React.lazy(() => import('@/app/pages/KillfeedPage'));
const ChatPage = React.lazy(() => import('@/app/pages/ChatPage'));

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
    path: '/killfeed',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <KillfeedPage />
      </Suspense>
    ),
  },
  {
    path: '/chat',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <ChatPage />
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
