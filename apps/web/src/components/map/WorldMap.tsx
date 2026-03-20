import type { Feature, FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';
import { useMemo, useState } from 'react';
import { geoGraticule10, geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature, mesh } from 'topojson-client';
import countriesAtlas from 'world-atlas/countries-110m.json';
import landAtlas from 'world-atlas/land-110m.json';
import { COUNTRIES, NETWORK_LINKS, type CountrySide } from '@/data/countries';
import { useStore } from '@/store';

interface CountriesTopology {
  objects: {
    countries: object;
  };
}

interface LandTopology {
  objects: {
    land: object;
  };
}

interface ProjectedCountry {
  code: string;
  name: string;
  atlasId: string;
  side: CountrySide;
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

const countriesTopology = countriesAtlas as unknown as CountriesTopology;
const landTopology = landAtlas as unknown as LandTopology;
const landFeature = feature(
  landTopology as never,
  landTopology.objects.land as never
) as Feature<Geometry>;
const collection = feature(
  countriesTopology as never,
  countriesTopology.objects.countries as never
) as unknown as FeatureCollection<Geometry, GeoJsonProperties>;

const projection = geoNaturalEarth1().fitExtent(
  [
    [44, 48],
    [1356, 720],
  ],
  landFeature
);

const pathGenerator = geoPath(projection);
const landPath = pathGenerator(landFeature) ?? '';
const graticulePath = pathGenerator(geoGraticule10()) ?? '';
const bordersPath =
  pathGenerator(
    mesh(
      countriesTopology as never,
      countriesTopology.objects.countries as never,
      (a, b) => a !== b
    ) as never
  ) ?? '';

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

function createArcPath(start: ProjectedCountry, end: ProjectedCountry) {
  const arc = Math.max(26, Math.abs(end.x - start.x) * 0.08);
  const midX = (start.x + end.x) / 2;
  const midY = Math.min(start.y, end.y) - arc;

  return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
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
    const selectedSide = COUNTRIES.find((country) => country.code === selectedCountry)?.side;
    const targetPool = COUNTRIES.filter(
      (country) => country.code !== selectedCountry && country.side !== selectedSide
    );

    if (targetPool.length === 0) {
      return null;
    }

    return targetPool[offsetSeed % targetPool.length] ?? null;
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

    return createArcPath(start, end);
  }, [opponentCountry, selectedCountry]);

  const networkRoutes = useMemo(
    () =>
      NETWORK_LINKS.flatMap(([startCode, endCode]) => {
        const start = COUNTRY_MAP.get(startCode);
        const end = COUNTRY_MAP.get(endCode);

        if (!start || !end) {
          return [];
        }

        return [
          {
            key: `${startCode}-${endCode}`,
            d: createArcPath(start, end),
            active:
              route !== null &&
              ((selectedCountry === startCode && opponentCountry?.code === endCode) ||
                (selectedCountry === endCode && opponentCountry?.code === startCode)),
          },
        ];
      }),
    [opponentCountry?.code, route, selectedCountry]
  );

  return (
    <div className={`world-map ${showGunSelector ? 'world-map--muted' : ''}`}>
      <svg viewBox="0 0 1400 768" className="world-map__svg" aria-label="World map deployment grid">
        <defs>
          <linearGradient id="world-map-route-gradient" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#0044FF" />
            <stop offset="50%" stopColor="#0A0A0A" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#FF0000" />
          </linearGradient>
        </defs>
        <rect width="1400" height="768" fill="#FFFFFF" />
        <path d={landPath} className="world-map__land" />
        <path d={graticulePath} className="world-map__graticule" />
        <path d={bordersPath} className="world-map__borders" />
        {networkRoutes.map((connection) => (
          <path
            key={connection.key}
            d={connection.d}
            className={`world-map__network-line ${connection.active ? 'world-map__network-line--active' : ''}`}
          />
        ))}

        {PROJECTED_COUNTRIES.map((country) => {
          const isSelected = selectedCountry === country.code;
          const countryClasses = [
            'world-map__country',
            `world-map__country--${country.side}`,
            isSelected ? `world-map__country--selected-${country.side}` : '',
          ]
            .filter(Boolean)
            .join(' ');
          const pulseClasses = [
            'world-map__marker-pulse',
            `world-map__marker-pulse--${country.side}`,
            isSelected ? `world-map__marker-pulse--selected-${country.side}` : '',
          ]
            .filter(Boolean)
            .join(' ');
          const markerClasses = [
            'world-map__marker',
            `world-map__marker--${country.side}`,
            isSelected ? `world-map__marker--selected-${country.side}` : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <g key={country.code}>
              <path
                d={country.d}
                className={countryClasses}
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
              <g className={`world-map__marker-cluster ${isSelected ? 'world-map__marker-cluster--selected' : ''}`}>
                <circle
                  cx={country.x}
                  cy={country.y}
                  r={isSelected ? 15 : 10}
                  className={pulseClasses}
                />
                <circle
                  cx={country.x}
                  cy={country.y}
                  r={isSelected ? 8 : 5}
                  className={markerClasses}
                />
              </g>
            </g>
          );
        })}

        {route && <path d={route} className="world-map__route" />}

        {opponentCountry && phase !== 'idle' && (
          <g className="world-map__marker-cluster world-map__marker-cluster--active">
            <circle
              cx={COUNTRY_MAP.get(opponentCountry.code)?.x ?? 0}
              cy={COUNTRY_MAP.get(opponentCountry.code)?.y ?? 0}
              r={16}
              className={`world-map__marker-pulse world-map__marker-pulse--active-${opponentCountry.side}`}
            />
            <circle
              cx={COUNTRY_MAP.get(opponentCountry.code)?.x ?? 0}
              cy={COUNTRY_MAP.get(opponentCountry.code)?.y ?? 0}
              r={8}
              className={`world-map__marker world-map__marker--active-${opponentCountry.side}`}
            />
          </g>
        )}

        {activeData && (() => {
          const position = getCalloutPosition(activeData.x, activeData.y);
          const nameLines = splitCalloutName(activeData.name);
          const boxHeight = nameLines.length > 1 ? 102 : 88;
          const stateY = position.boxY + (nameLines.length > 1 ? 88 : 74);
          const calloutSideClass = `world-map__callout--${activeData.side}`;
          return (
            <g aria-hidden="true" className={`world-map__callout ${calloutSideClass}`}>
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
