interface Connection {
  from: { x: number; y: number };
  to: { x: number; y: number };
  active: boolean;
}

interface MapOverlayProps {
  connections: Connection[];
}

export function MapOverlay({ connections }: MapOverlayProps): React.ReactNode {
  return (
    <g>
      <style>{`
        @keyframes dash-scroll {
          to {
            stroke-dashoffset: -20;
          }
        }
        .map-overlay-line--active {
          animation: dash-scroll 1s linear infinite;
        }
      `}</style>
      {connections.map((conn, i) => (
        <line
          key={i}
          x1={conn.from.x}
          y1={conn.from.y}
          x2={conn.to.x}
          y2={conn.to.y}
          stroke={conn.active ? '#00F0FF' : '#2A2A2A'}
          strokeWidth={conn.active ? 1 : 0.5}
          strokeDasharray={conn.active ? '6 4' : 'none'}
          strokeDashoffset={0}
          opacity={conn.active ? 0.9 : 0.5}
          className={conn.active ? 'map-overlay-line--active' : undefined}
        />
      ))}
    </g>
  );
}
