import type { Feature, FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';
import { useMemo, useState } from 'react';
import { geoGraticule10, geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import countriesAtlas from 'world-atlas/countries-110m.json';
import { COUNTRIES } from '@/data/countries';
import { useStore } from '@/store';

interface AtlasTopology {
  objects: {
    countries: object;
    land: object;
  };
}

interface ProjectedCountry {
  code: string;
  name: string;
  atlasId: string;
  d: string;
  x: number;
  y: number;
}

function splitCalloutName(name: string): string[] {
  if (name.length <= 14) {
    return [name];
  }

  const words = name.split(' ');
  if (words.length === 1) {
    return [name];
  }

  const midpoint = Math.ceil(words.length / 2);
  return [words.slice(0, midpoint).join(' '), words.slice(midpoint).join(' ')];
}

const atlas = countriesAtlas as unknown as AtlasTopology;
const landFeature = feature(atlas as never, atlas.objects.land as never) as Feature<Geometry>;
const collection = feature(
  atlas as never,
  atlas.objects.countries as never
) as unknown as FeatureCollection<Geometry, GeoJsonProperties>;

const projection = geoNaturalEarth1().fitExtent(
  [
    [44, 48],
    [1356, 720],
  ],
  landFeature
);

const pathGenerator = geoPath(projection);
const graticulePath = pathGenerator(geoGraticule10()) ?? '';

const PROJECTED_COUNTRIES: ProjectedCountry[] = COUNTRIES.flatMap((country) => {
  const match = collection.features.find(
    (entry) => String(entry.id ?? '').padStart(3, '0') === country.atlasId
  );

  if (!match) {
    return [];
  }

  const d = pathGenerator(match);
  if (!d) {
    return [];
  }

  const [x, y] = pathGenerator.centroid(match);
  return [
    {
      ...country,
      d,
      x: Number.isFinite(x) ? x : 0,
      y: Number.isFinite(y) ? y : 0,
    },
  ];
});

const COUNTRY_MAP = new Map(PROJECTED_COUNTRIES.map((country) => [country.code, country]));

function getCalloutPosition(x: number, y: number) {
  const alignLeft = x > 1020;
  const alignBottom = y < 140;
  return {
    lineX: alignLeft ? x - 38 : x + 38,
    lineY: alignBottom ? y + 42 : y - 42,
    boxX: alignLeft ? x - 270 : x + 26,
    boxY: alignBottom ? y + 18 : y - 102,
  };
}

export function WorldMap(): React.ReactNode {
  const {
    selectedCountry,
    selectCountry,
    showGunSelector,
    phase,
    currentBattle,
  } = useStore();
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  const activeCountry = hoveredCountry ?? selectedCountry;
  const activeData = activeCountry ? COUNTRY_MAP.get(activeCountry) ?? null : null;
  const opponentCountry = useMemo(() => {
    if (!selectedCountry || phase === 'idle') {
      return null;
    }

    const offsetSeed = currentBattle?.right.tokenId ?? 7;
    const currentIndex = COUNTRIES.findIndex((country) => country.code === selectedCountry);
    const target = COUNTRIES[(Math.max(currentIndex, 0) + offsetSeed) % COUNTRIES.length];
    return target?.code === selectedCountry ? COUNTRIES[(offsetSeed + 3) % COUNTRIES.length] : target;
  }, [currentBattle?.right.tokenId, phase, selectedCountry]);

  const route = useMemo(() => {
    if (!selectedCountry || !opponentCountry) {
      return null;
    }

    const start = COUNTRY_MAP.get(selectedCountry);
    const end = COUNTRY_MAP.get(opponentCountry.code);
    if (!start || !end) {
      return null;
    }

    const arc = Math.max(56, Math.abs(end.x - start.x) * 0.18);
    const midX = (start.x + end.x) / 2;
    const midY = Math.min(start.y, end.y) - arc;

    return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
  }, [opponentCountry, selectedCountry]);

  return (
    <div className={`world-map ${showGunSelector ? 'world-map--muted' : ''}`}>
      <svg viewBox="0 0 1400 768" className="world-map__svg" aria-label="World map deployment grid">
        <rect width="1400" height="768" fill="#FFFFFF" />
        <path d={graticulePath} className="world-map__graticule" />

        {PROJECTED_COUNTRIES.map((country) => {
          const isSelected = selectedCountry === country.code;

          return (
            <g key={country.code}>
              <path
                d={country.d}
                className={`world-map__country ${isSelected ? 'world-map__country--selected' : ''}`}
                role="button"
                tabIndex={0}
                aria-label={country.name}
                onMouseEnter={() => setHoveredCountry(country.code)}
                onMouseLeave={() => setHoveredCountry(null)}
                onFocus={() => setHoveredCountry(country.code)}
                onBlur={() => setHoveredCountry(null)}
                onClick={() => selectCountry(country.code)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    selectCountry(country.code);
                  }
                }}
              />
              <circle
                cx={country.x}
                cy={country.y}
                r={isSelected ? 8 : 5}
                className={`world-map__marker ${isSelected ? 'world-map__marker--selected' : ''}`}
              />
            </g>
          );
        })}

        {route && <path d={route} className="world-map__route" />}

        {opponentCountry && phase !== 'idle' && (
          <circle
            cx={COUNTRY_MAP.get(opponentCountry.code)?.x ?? 0}
            cy={COUNTRY_MAP.get(opponentCountry.code)?.y ?? 0}
            r={8}
            className="world-map__marker world-map__marker--active"
          />
        )}

        {activeData && (() => {
          const position = getCalloutPosition(activeData.x, activeData.y);
          const nameLines = splitCalloutName(activeData.name);
          const boxHeight = nameLines.length > 1 ? 102 : 88;
          const stateY = position.boxY + (nameLines.length > 1 ? 88 : 74);
          return (
            <g aria-hidden="true">
              <path
                d={`M ${activeData.x} ${activeData.y} L ${position.lineX} ${position.lineY}`}
                className="world-map__callout-line"
              />
              <rect
                x={position.boxX}
                y={position.boxY}
                width={264}
                height={boxHeight}
                rx={18}
                className="world-map__callout-box"
              />
              <text x={position.boxX + 18} y={position.boxY + 24} className="world-map__callout-code">
                {activeData.code}
              </text>
              <text x={position.boxX + 18} y={position.boxY + 52} className="world-map__callout-name">
                {nameLines.map((line, index) => (
                  <tspan
                    key={`${activeData.code}-${line}`}
                    x={position.boxX + 18}
                    dy={index === 0 ? 0 : 18}
                  >
                    {line}
                  </tspan>
                ))}
              </text>
              <text x={position.boxX + 18} y={stateY} className="world-map__callout-state">
                {selectedCountry === activeData.code ? 'DEPLOYMENT LOCKED' : 'READY TO DEPLOY'}
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
