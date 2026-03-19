import { Link, useParams } from 'react-router-dom';

export default function BattlePage(): React.ReactNode {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="pointer-events-auto flex min-h-screen items-center justify-center">
      <div className="border border-bg-border bg-bg-card/90 px-8 py-6 text-center backdrop-blur-sm">
        <h2 className="font-mono text-lg uppercase tracking-widest text-accent-red">
          Battle Not Found
        </h2>
        <p className="mt-2 font-mono text-sm text-text-muted">
          No active spectator view is available for battle {id ?? 'unknown'}.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex font-mono text-xs uppercase tracking-widest text-accent-cyan transition-colors hover:text-accent-neon"
        >
          Return to Map
        </Link>
      </div>
    </div>
  );
}
