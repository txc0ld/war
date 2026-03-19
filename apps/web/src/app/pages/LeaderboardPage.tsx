import { Leaderboard } from '@/components/leaderboard/Leaderboard';

export default function LeaderboardPage(): React.ReactNode {
  return (
    <div className="pointer-events-auto flex min-h-screen items-start justify-center px-4 pt-20">
      <Leaderboard />
    </div>
  );
}
