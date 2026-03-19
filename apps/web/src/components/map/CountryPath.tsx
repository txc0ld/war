import { useState, useCallback } from 'react';

interface CountryPathProps {
  code: string;
  name: string;
  d: string;
  x: number;
  y: number;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (code: string) => void;
}

export function CountryPath({
  code,
  name,
  d,
  x,
  y,
  isSelected,
  isHovered,
  onSelect,
}: CountryPathProps): React.ReactNode {
  const [isFocused, setIsFocused] = useState(false);
  const isActive = isHovered || isFocused || isSelected;

  const handleClick = useCallback(() => {
    onSelect(code);
  }, [code, onSelect]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<SVGPathElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelect(code);
      }
    },
    [code, onSelect]
  );

  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={isSelected ? 15 : 12}
        data-country={code}
        fill="transparent"
        className="cursor-pointer"
        onClick={handleClick}
      />
      <path
        d={d}
        data-country={code}
        role="button"
        tabIndex={0}
        aria-label={`Select ${name}`}
        aria-pressed={isSelected}
        vectorEffect="non-scaling-stroke"
        className="cursor-pointer transition-all duration-300"
        fill={
          isSelected
            ? 'rgba(204, 255, 0, 0.22)'
            : isActive
              ? 'rgba(0, 240, 255, 0.16)'
              : 'rgba(125, 220, 255, 0.035)'
        }
        stroke={
          isSelected
            ? '#CCFF00'
            : isActive
              ? '#8EF7FF'
              : 'rgba(91, 214, 255, 0.14)'
        }
        strokeWidth={isSelected ? 1.6 : isActive ? 1.15 : 0.8}
        style={
          isSelected
            ? { filter: 'drop-shadow(0 0 24px rgba(204, 255, 0, 0.32))' }
            : isActive
              ? { filter: 'drop-shadow(0 0 16px rgba(0, 240, 255, 0.18))' }
              : undefined
        }
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      />
      <g
        className="pointer-events-none"
        opacity={isSelected ? 1 : isActive ? 0.95 : 0.55}
      >
        <circle
          cx={x}
          cy={y}
          r={isSelected ? 8 : isActive ? 6.5 : 4}
          fill="none"
          stroke={isSelected ? 'rgba(204,255,0,0.65)' : 'rgba(0,240,255,0.24)'}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
          style={{
            filter: isSelected
              ? 'drop-shadow(0 0 10px rgba(204,255,0,0.24))'
              : undefined,
          }}
        />
        <circle
          cx={x}
          cy={y}
          r={isSelected ? 3 : 2.2}
          fill={isSelected ? '#CCFF00' : '#8EF7FF'}
        />
        {(isSelected || isActive) && (
          <circle
            cx={x}
            cy={y}
            r={isSelected ? 12 : 9}
            fill="none"
            stroke={isSelected ? 'rgba(204,255,0,0.18)' : 'rgba(142,247,255,0.14)'}
            strokeWidth={0.8}
            vectorEffect="non-scaling-stroke"
          />
        )}
      </g>
    </g>
  );
}
