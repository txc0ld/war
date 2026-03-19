import type { Feature, FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';
import {
  geoGraticule10,
  geoNaturalEarth1,
  geoPath,
} from 'd3-geo';
import { feature } from 'topojson-client';
import { useState, useCallback } from 'react';
import countriesAtlas from 'world-atlas/countries-110m.json';
import { CountryPath } from './CountryPath';
import { COUNTRIES, NETWORK_LINKS } from '@/lib/countries';
import { useStore } from '@/store';
import { cn } from '@/lib/cn';

interface AtlasTopology {
  objects: {
    countries: object;
    land: object;
  };
}

interface ProjectedCountry {
  code: string;
  name: string;
  d: string;
  labelX: number;
  labelY: number;
}

const atlas = countriesAtlas as unknown as AtlasTopology;
const landFeature = feature(atlas as never, atlas.objects.land as never) as Feature<Geometry>;
const countryCollection = feature(
  atlas as never,
  atlas.objects.countries as never
) as unknown as FeatureCollection<Geometry, GeoJsonProperties>;
const projection = geoNaturalEarth1().fitExtent(
  [
    [34, 36],
    [966, 464],
  ],
  landFeature
);
const pathGenerator = geoPath(projection);
const landPath = pathGenerator(landFeature) ?? '';
const graticulePath = pathGenerator(geoGraticule10()) ?? '';
const WORLD_COUNTRY_PATHS = countryCollection.features
  .map((entry, index) => ({
    id: String(entry.id ?? index),
    d: pathGenerator(entry) ?? '',
  }))
  .filter((entry) => entry.d.length > 0);
const PROJECTED_COUNTRIES: ProjectedCountry[] = COUNTRIES.flatMap((country) => {
  const match = countryCollection.features.find(
    (entry) => String(entry.id ?? '').padStart(3, '0') === country.atlasId
  );

  if (!match) {
    return [];
  }

  const d = pathGenerator(match);
  if (!d) {
    return [];
  }

  const [labelX, labelY] = pathGenerator.centroid(match);
  return [
    {
      ...country,
      d,
      labelX: Number.isFinite(labelX) ? labelX : 500,
      labelY: Number.isFinite(labelY) ? labelY : 250,
    },
  ];
});
const COUNTRY_BY_CODE = new Map(PROJECTED_COUNTRIES.map((country) => [country.code, country]));
const ROUTE_PATHS = NETWORK_LINKS.flatMap(([from, to]) => {
  const start = COUNTRY_BY_CODE.get(from);
  const end = COUNTRY_BY_CODE.get(to);

  if (!start || !end) {
    return [];
  }

  const midX = (start.labelX + end.labelX) / 2;
  const midY = (start.labelY + end.labelY) / 2;
  const distance = Math.hypot(end.labelX - start.labelX, end.labelY - start.labelY);
  const arch = Math.max(28, distance * 0.16);

  return [
    {
      id: `${from}-${to}`,
      d: `M ${start.labelX} ${start.labelY} Q ${midX} ${midY - arch} ${end.labelX} ${end.labelY}`,
    },
  ];
});

export function WorldMap(): React.ReactNode {
  const { selectedCountry, selectCountry } = useStore();
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  const handleCountrySelect = useCallback(
    (code: string) => {
      selectCountry(code);
    },
    [selectCountry]
  );

  const hoveredData = hoveredCountry
    ? PROJECTED_COUNTRIES.find((c) => c.code === hoveredCountry)
    : null;
  const selectedData = selectedCountry
    ? PROJECTED_COUNTRIES.find((c) => c.code === selectedCountry)
    : null;
  const activeData = hoveredData ?? selectedData ?? null;

  const getCalloutNameLines = useCallback((name: string) => {
    if (name.length <= 13) {
      return [name];
    }

    const parts = name.split(' ');
    if (parts.length < 2) {
      return [name];
    }

    const firstLine: string[] = [];
    const secondLine: string[] = [];

    parts.forEach((part) => {
      const currentFirst = [...firstLine, part].join(' ');
      if (firstLine.length === 0 || currentFirst.length <= 13) {
        firstLine.push(part);
      } else {
        secondLine.push(part);
      }
    });

    return secondLine.length > 0
      ? [firstLine.join(' '), secondLine.join(' ')]
      : [name];
  }, []);

  const getCalloutPosition = useCallback((x: number, y: number) => {
    const placeRight = x < 360;
    const placeFarLeft = x > 720;
    const placeBelow = y < 120;
    const lineMidX = x + (placeFarLeft ? -34 : placeRight ? 24 : -22);
    const lineMidY = y + (placeBelow ? 26 : -26);
    const boxX = x + (placeFarLeft ? -218 : placeRight ? 30 : -170);
    const boxY = y + (placeBelow ? 16 : -58);
    return {
      lineStartX: x,
      lineStartY: y,
      lineMidX,
      lineMidY,
      boxX,
      boxY,
      textX: boxX + 16,
      textY: boxY + 18,
    };
  }, []);

  return (
    <div
      className={cn('relative h-full w-full overflow-hidden bg-[#02070c]')}
    >
      <svg
        viewBox="0 0 1000 500"
        className="h-full w-full"
      >
        <defs>
          <linearGradient id="ocean" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#01060a" />
            <stop offset="48%" stopColor="#05131d" />
            <stop offset="100%" stopColor="#010409" />
          </linearGradient>
          <radialGradient id="auroraNorth" cx="50%" cy="16%" r="64%">
            <stop offset="0%" stopColor="rgba(94, 235, 255, 0.12)" />
            <stop offset="52%" stopColor="rgba(94, 235, 255, 0.025)" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
          </radialGradient>
          <radialGradient id="atmosphere" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="rgba(0, 240, 255, 0.08)" />
            <stop offset="50%" stopColor="rgba(0, 240, 255, 0.02)" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
          </radialGradient>
          <linearGradient id="landFill" x1="15%" y1="5%" x2="85%" y2="95%">
            <stop offset="0%" stopColor="rgba(15, 34, 46, 0.94)" />
            <stop offset="48%" stopColor="rgba(9, 18, 26, 0.985)" />
            <stop offset="100%" stopColor="rgba(4, 10, 15, 0.995)" />
          </linearGradient>
          <linearGradient id="shoreline" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(159, 245, 255, 0.4)" />
            <stop offset="50%" stopColor="rgba(95, 200, 255, 0.18)" />
            <stop offset="100%" stopColor="rgba(159, 245, 255, 0.28)" />
          </linearGradient>
          <linearGradient id="routeGlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(126,246,255,0.05)" />
            <stop offset="50%" stopColor="rgba(126,246,255,0.44)" />
            <stop offset="100%" stopColor="rgba(126,246,255,0.05)" />
          </linearGradient>
          <filter id="routeBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
          <filter id="landGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="18" floodColor="#00d7ff" floodOpacity="0.09" />
          </filter>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path
              d="M 50 0 L 0 0 0 50"
              fill="none"
              stroke="rgba(84, 111, 125, 0.1)"
              strokeWidth="0.5"
            />
          </pattern>
          <pattern id="major-grid" width="200" height="100" patternUnits="userSpaceOnUse">
            <path
              d="M 200 0 L 0 0 0 100"
              fill="none"
              stroke="rgba(112, 188, 214, 0.08)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="1000" height="500" fill="url(#ocean)" />
        <rect width="1000" height="500" fill="url(#auroraNorth)" />
        <rect width="1000" height="500" fill="url(#atmosphere)" />
        <rect width="1000" height="500" fill="url(#grid)" />
        <rect width="1000" height="500" fill="url(#major-grid)" />
        <ellipse
          cx="500"
          cy="260"
          rx="430"
          ry="180"
          fill="rgba(6, 20, 32, 0.32)"
          stroke="rgba(142, 247, 255, 0.08)"
          strokeWidth="1"
        />
        <ellipse
          cx="500"
          cy="260"
          rx="448"
          ry="196"
          fill="none"
          stroke="rgba(105, 226, 255, 0.06)"
          strokeWidth="0.8"
        />

        <path
          d={graticulePath}
          fill="none"
          stroke="rgba(126, 246, 255, 0.075)"
          strokeWidth="0.65"
          vectorEffect="non-scaling-stroke"
        />

        <g filter="url(#landGlow)">
          <path
            d={landPath}
            fill="url(#landFill)"
            stroke="url(#shoreline)"
            strokeWidth="1.1"
            vectorEffect="non-scaling-stroke"
          />
        </g>

        <g opacity={0.74}>
          {WORLD_COUNTRY_PATHS.map((country) => (
            <path
              key={country.id}
              d={country.d}
              fill="none"
              stroke="rgba(133, 215, 255, 0.09)"
              strokeWidth="0.42"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>

        <g opacity={0.8}>
          {ROUTE_PATHS.map((path) => (
            <g key={path.id}>
              <path
                d={path.d}
                fill="none"
                stroke="rgba(126,246,255,0.16)"
                strokeWidth="4"
                opacity="0.16"
                filter="url(#routeBlur)"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d={path.d}
                fill="none"
                stroke="url(#routeGlow)"
                strokeWidth="1.15"
                strokeDasharray="5 8"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          ))}
        </g>

        {PROJECTED_COUNTRIES.map((country) => (
          <g
            key={country.code}
            onMouseEnter={() => setHoveredCountry(country.code)}
            onMouseLeave={() => setHoveredCountry(null)}
          >
            <CountryPath
              code={country.code}
              name={country.name}
              d={country.d}
              x={country.labelX}
              y={country.labelY}
              isSelected={selectedCountry === country.code}
              isHovered={hoveredCountry === country.code}
              onSelect={handleCountrySelect}
            />
          </g>
        ))}

        {activeData && (() => {
          const callout = getCalloutPosition(activeData.labelX, activeData.labelY);
          const accent = hoveredData ? '#8EF7FF' : '#CCFF00';
          const nameLines = getCalloutNameLines(activeData.name);
          const boxHeight = nameLines.length > 1 ? 66 : 54;
          const codeY = callout.boxY + 18;
          const nameY = callout.boxY + 34;
          const statusY = callout.boxY + (nameLines.length > 1 ? 56 : 46);

          return (
            <g className="pointer-events-none">
              <path
                d={`M ${callout.lineStartX} ${callout.lineStartY} L ${callout.lineMidX} ${callout.lineMidY} L ${callout.boxX + 12} ${callout.lineMidY}`}
                fill="none"
                stroke={accent}
                strokeWidth="1.1"
                vectorEffect="non-scaling-stroke"
                opacity={0.9}
              />
              <rect
                x={callout.boxX}
                y={callout.boxY}
                width="176"
                height={boxHeight}
                rx="12"
                fill="rgba(4, 12, 18, 0.92)"
                stroke={hoveredData ? 'rgba(142,247,255,0.4)' : 'rgba(204,255,0,0.38)'}
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={callout.textX}
                y={codeY}
                fill={accent}
                fontSize="8"
                fontFamily="'Plus Jakarta Sans', sans-serif"
                letterSpacing="1.9"
              >
                {activeData.code}
              </text>
              <text
                x={callout.textX}
                y={nameY}
                fill="rgba(223, 238, 245, 0.88)"
                fontSize="10"
                fontFamily="'Plus Jakarta Sans', sans-serif"
              >
                {nameLines.map((line, index) => (
                  <tspan
                    key={`${activeData.code}-${line}`}
                    x={callout.textX}
                    dy={index === 0 ? 0 : 10}
                  >
                    {line}
                  </tspan>
                ))}
              </text>
              <text
                x={callout.textX}
                y={statusY}
                fill="rgba(141, 165, 178, 0.82)"
                fontSize="7.5"
                fontFamily="'Plus Jakarta Sans', sans-serif"
                letterSpacing="1.4"
              >
                {hoveredData ? 'READY TO DEPLOY' : 'ACTIVE TARGET'}
              </text>
            </g>
          );
        })()}
      </svg>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(88,236,255,0.1),transparent_26%),radial-gradient(circle_at_50%_100%,rgba(204,255,0,0.05),transparent_24%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,transparent_24%,transparent_78%,rgba(0,0,0,0.34)_100%)]" />
      <div className="pointer-events-none absolute inset-3 rounded-[32px] border border-white/6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),inset_0_0_0_1px_rgba(5,18,24,0.8)]" />
      <div className="pointer-events-none absolute inset-x-8 top-16 h-px bg-gradient-to-r from-transparent via-accent-cyan/12 to-transparent" />

      {/* Tooltip */}
      <div className="pointer-events-none absolute left-4 top-24 z-20 w-[min(420px,calc(100%-2rem))] md:left-6 md:top-28">
        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,19,27,0.92)_0%,rgba(4,10,16,0.74)_100%)] px-5 py-4 shadow-[0_28px_90px_rgba(0,0,0,0.46)] backdrop-blur-xl">
          <div className="mb-4 h-px w-full bg-gradient-to-r from-accent-cyan/0 via-accent-cyan/50 to-accent-cyan/0" />
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-text-dim">
            Global Deployment Grid
          </p>
          <div className="mt-3 flex items-start justify-between gap-8">
            <div className="min-w-0">
              <h2 className="font-mono whitespace-nowrap text-[2rem] uppercase leading-[0.88] tracking-[0.14em] text-white md:text-[2.35rem]">
                WAR PATH
              </h2>
              <p className="mt-3 max-w-[235px] font-mono text-[11px] uppercase leading-[1.45] tracking-[0.2em] text-text-muted">
                {hoveredData
                  ? `Inspecting ${hoveredData.name}`
                  : selectedData
                    ? `Deployment locked on ${selectedData.name}`
                    : 'Hover a sector or click to deploy'}
              </p>
            </div>
            <div className="hidden shrink-0 pt-3 font-mono text-right text-[10px] uppercase leading-[1.5] tracking-[0.18em] text-text-dim md:block">
              <p>Static Grid</p>
              <p>Sector Lock</p>
              <p>Deploy</p>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-6 right-6 z-20 hidden md:block">
        <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,19,27,0.88)_0%,rgba(4,10,16,0.7)_100%)] px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.32)] backdrop-blur-xl">
          <div className="mb-3 h-px w-16 bg-gradient-to-r from-accent-neon/60 to-transparent" />
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-text-dim">
            Sector Status
          </p>
          <div className="mt-3 flex items-center gap-6 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.18em]">
            <span className="flex items-center gap-2 text-text-muted">
              <span className="h-2 w-2 rounded-full bg-[rgba(142,247,255,0.55)]" />
              Reachable
            </span>
            <span className="flex items-center gap-2 text-text-muted">
              <span className="h-2 w-2 rounded-full bg-accent-neon" />
              Selected
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
