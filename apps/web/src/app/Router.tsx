import React, { Suspense } from 'react';
import { Outlet, createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Shell } from '@/components/layout/Shell';
import { Spinner } from '@/components/ui/Spinner';
import { WalletGate } from '@/components/wallet/WalletGate';

const MapPage = React.lazy(() => import('@/app/pages/MapPage'));
const LeaderboardPage = React.lazy(() => import('@/app/pages/LeaderboardPage'));
const BattlePage = React.lazy(() => import('@/app/pages/BattlePage'));

function LoadingFallback(): React.ReactNode {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

function PageWrapper({ children }: { children: React.ReactNode }): React.ReactNode {
  return <div className="min-h-screen">{children}</div>;
}

function ShellLayout(): React.ReactNode {
  return (
    <Shell>
      <Outlet />
    </Shell>
  );
}

function GatedRoute({ children }: { children: React.ReactNode }): React.ReactNode {
  return <WalletGate>{children}</WalletGate>;
}

const router = createBrowserRouter([
  {
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <ShellLayout />
      </Suspense>
    ),
    children: [
      {
        path: '/',
        element: (
          <PageWrapper>
            <GatedRoute>
              <MapPage />
            </GatedRoute>
          </PageWrapper>
        ),
      },
      {
        path: '/leaderboard',
        element: (
          <PageWrapper>
            <LeaderboardPage />
          </PageWrapper>
        ),
      },
      {
        path: '/battle/:id',
        element: (
          <PageWrapper>
            <GatedRoute>
              <BattlePage />
            </GatedRoute>
          </PageWrapper>
        ),
      },
    ],
  },
]);

export function AppRouter(): React.ReactNode {
  return <RouterProvider router={router} />;
}
