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
        @keyframes network-pulse {
          0%, 100% {
            opacity: 0.45;
          }
          50% {
            opacity: 0.9;
          }
        }
        .map-overlay-line--active {
          animation: network-pulse 2.2s ease-in-out infinite;
        }
      `}</style>
      {connections.map((conn, i) => (
        <line
          key={i}
          x1={conn.from.x}
          y1={conn.from.y}
          x2={conn.to.x}
          y2={conn.to.y}
          stroke={conn.active ? '#0A0A0A' : 'rgba(10,10,10,0.2)'}
          strokeWidth={conn.active ? 1 : 0.5}
          strokeDasharray={conn.active ? '8 8' : 'none'}
          opacity={conn.active ? 0.9 : 0.5}
          className={conn.active ? 'map-overlay-line--active' : undefined}
        />
      ))}
    </g>
  );
}
