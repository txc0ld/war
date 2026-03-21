interface LocationMarkerProps {
  x: number;
  y: number;
  isCurrentUser: boolean;
  address: string;
}

export function LocationMarker({
  x,
  y,
  isCurrentUser,
  address,
}: LocationMarkerProps): React.ReactNode {
  const color = isCurrentUser ? '#00BDFE' : '#00F0FF';
  const opacity = isCurrentUser ? 1 : 0.5;
  const label = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <g transform={`translate(${x}, ${y})`} opacity={opacity}>
      {isCurrentUser && (
        <circle
          cx={0}
          cy={0}
          r={6}
          fill={color}
          opacity={0.15}
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />
      )}
      <circle
        cx={0}
        cy={0}
        r={3}
        fill={color}
        style={
          isCurrentUser
            ? { filter: `drop-shadow(0 0 6px ${color})` }
            : undefined
        }
      />
      <text
        x={0}
        y={-7}
        fill={color}
        fontSize="5"
        fontFamily="'Plus Jakarta Sans', sans-serif"
        textAnchor="middle"
        dominantBaseline="auto"
        className="pointer-events-none select-none"
      >
        {label}
      </text>
    </g>
  );
}
