import type { CSSProperties } from 'react';
import type { Feature, FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { geoGraticule10, geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature, mesh } from 'topojson-client';
import countriesAtlas from 'world-atlas/countries-110m.json';
import landAtlas from 'world-atlas/land-110m.json';
import { COUNTRIES, NETWORK_LINKS, type CountrySide } from '@/data/countries';
import { playMapCue, prepareMapAudio } from '@/lib/mapAudio';
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
  markerRenderX: number;
  markerRenderY: number;
}

interface ViewBoxState {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PointerPoint {
  x: number;
  y: number;
}

interface GestureState {
  mode: 'pan' | 'pinch' | null;
  startViewBox: ViewBoxState;
  startPoint?: PointerPoint;
  startMidpoint?: PointerPoint;
  startDistance?: number;
}

const VIEWBOX_WIDTH = 1400;
const VIEWBOX_HEIGHT = 768;
const DEFAULT_VIEWBOX: ViewBoxState = {
  x: 0,
  y: 0,
  width: VIEWBOX_WIDTH,
  height: VIEWBOX_HEIGHT,
};
const MAX_ZOOM = 2.8;
const MIN_ZOOM = 1;
const GESTURE_MOVE_THRESHOLD = 8;

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

function createResponsiveViewBox(viewportWidth: number, viewportHeight: number): ViewBoxState {
  const shortViewport = viewportHeight <= 840;

  if (viewportWidth <= 560 || shortViewport) {
    const width = 1218;
    return {
      x: 92,
      y: 34,
      width,
      height: (width / VIEWBOX_WIDTH) * VIEWBOX_HEIGHT,
    };
  }

  if (viewportWidth <= 720) {
    const width = 1272;
    return {
      x: 64,
      y: 22,
      width,
      height: (width / VIEWBOX_WIDTH) * VIEWBOX_HEIGHT,
    };
  }

  if (viewportWidth <= 980) {
    const width = 1332;
    return {
      x: 34,
      y: 16,
      width,
      height: (width / VIEWBOX_WIDTH) * VIEWBOX_HEIGHT,
    };
  }

  return DEFAULT_VIEWBOX;
}

function isSameViewBox(a: ViewBoxState, b: ViewBoxState) {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
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
    [10, 28],
    [1390, 738],
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
  const projectedMarkerPoint =
    country.code === 'FR' ? projection([country.longitude, country.latitude]) : null;
  const markerRenderX = projectedMarkerPoint?.[0] ?? x;
  const markerRenderY = projectedMarkerPoint?.[1] ?? y;

  return [
    {
      ...country,
      d,
      x: Number.isFinite(x) ? x : 0,
      y: Number.isFinite(y) ? y : 0,
      markerRenderX: Number.isFinite(markerRenderX) ? markerRenderX : 0,
      markerRenderY: Number.isFinite(markerRenderY) ? markerRenderY : 0,
    },
  ];
});

const COUNTRY_MAP = new Map(PROJECTED_COUNTRIES.map((country) => [country.code, country]));

function getCalloutPosition(x: number, y: number, boxWidth: number, boxHeight: number) {
  const alignLeft = x > VIEWBOX_WIDTH * 0.64;
  const alignBottom = y < VIEWBOX_HEIGHT * 0.2;
  const unclampedBoxX = alignLeft ? x - (boxWidth + 30) : x + 26;
  const unclampedBoxY = alignBottom ? y + 18 : y - (boxHeight + 18);
  const boxX = clamp(unclampedBoxX, 18, VIEWBOX_WIDTH - boxWidth - 18);
  const boxY = clamp(unclampedBoxY, 18, VIEWBOX_HEIGHT - boxHeight - 18);
  const boxOnLeft = boxX < x;

  return {
    boxX,
    boxY,
    lineX: boxOnLeft ? boxX + boxWidth : boxX,
    lineY: clamp(y, boxY + 18, boxY + boxHeight - 18),
    boxOnLeft,
  };
}

function createArcPath(start: ProjectedCountry, end: ProjectedCountry) {
  const arc = Math.max(26, Math.abs(end.x - start.x) * 0.08);
  const midX = (start.x + end.x) / 2;
  const midY = Math.min(start.y, end.y) - arc;

  return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function clampViewBox(next: ViewBoxState): ViewBoxState {
  const width = clamp(next.width, VIEWBOX_WIDTH / MAX_ZOOM, VIEWBOX_WIDTH / MIN_ZOOM);
  const height = (width / VIEWBOX_WIDTH) * VIEWBOX_HEIGHT;
  const maxX = VIEWBOX_WIDTH - width;
  const maxY = VIEWBOX_HEIGHT - height;

  return {
    x: clamp(next.x, 0, Math.max(0, maxX)),
    y: clamp(next.y, 0, Math.max(0, maxY)),
    width,
    height,
  };
}

function getDistance(a: PointerPoint, b: PointerPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function getMidpoint(a: PointerPoint, b: PointerPoint): PointerPoint {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

export function WorldMap(): React.ReactNode {
  const initialViewBox = useMemo(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_VIEWBOX;
    }

    return createResponsiveViewBox(window.innerWidth, window.innerHeight);
  }, []);
  const {
    selectedCountry,
    selectCountry,
    showGunSelector,
    phase,
    currentBattle,
  } = useStore();
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [defaultViewBox, setDefaultViewBox] = useState<ViewBoxState>(initialViewBox);
  const [viewBox, setViewBox] = useState<ViewBoxState>(initialViewBox);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const viewBoxRef = useRef<ViewBoxState>(initialViewBox);
  const pointersRef = useRef(new Map<number, PointerPoint>());
  const gestureRef = useRef<GestureState>({
    mode: null,
    startViewBox: DEFAULT_VIEWBOX,
  });
  const suppressClickRef = useRef(false);
  const showMapControls = phase === 'idle' && !showGunSelector;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleResize = () => {
      const nextDefault = createResponsiveViewBox(window.innerWidth, window.innerHeight);

      setDefaultViewBox((previousDefault) => {
        if (isSameViewBox(viewBoxRef.current, previousDefault)) {
          setViewBox(nextDefault);
          viewBoxRef.current = nextDefault;
        }

        return nextDefault;
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    prepareMapAudio();
  }, []);

  const getRatiosFromClientPoint = useCallback((point: PointerPoint) => {
    const rect = svgRef.current?.getBoundingClientRect();

    if (!rect || rect.width === 0 || rect.height === 0) {
      return { x: 0.5, y: 0.5 };
    }

    return {
      x: clamp((point.x - rect.left) / rect.width, 0, 1),
      y: clamp((point.y - rect.top) / rect.height, 0, 1),
    };
  }, []);

  const clientPointToViewBoxPoint = useCallback(
    (point: PointerPoint, sourceViewBox: ViewBoxState) => {
      const ratios = getRatiosFromClientPoint(point);

      return {
        x: sourceViewBox.x + ratios.x * sourceViewBox.width,
        y: sourceViewBox.y + ratios.y * sourceViewBox.height,
      };
    },
    [getRatiosFromClientPoint]
  );

  const applyViewBox = useCallback((updater: (current: ViewBoxState) => ViewBoxState) => {
    setViewBox((current) => {
      const next = clampViewBox(updater(current));
      viewBoxRef.current = next;
      return next;
    });
  }, []);

  const zoomToScale = useCallback(
    (nextScale: number, focusPoint?: PointerPoint) => {
      applyViewBox((current) => {
        const clampedScale = clamp(nextScale, MIN_ZOOM, MAX_ZOOM);
        const nextWidth = VIEWBOX_WIDTH / clampedScale;
        const nextHeight = VIEWBOX_HEIGHT / clampedScale;

        if (!focusPoint) {
          const centerX = current.x + current.width / 2;
          const centerY = current.y + current.height / 2;

          return {
            x: centerX - nextWidth / 2,
            y: centerY - nextHeight / 2,
            width: nextWidth,
            height: nextHeight,
          };
        }

        const ratios = getRatiosFromClientPoint(focusPoint);
        const focus = clientPointToViewBoxPoint(focusPoint, current);

        return {
          x: focus.x - ratios.x * nextWidth,
          y: focus.y - ratios.y * nextHeight,
          width: nextWidth,
          height: nextHeight,
        };
      });
    },
    [applyViewBox, clientPointToViewBoxPoint, getRatiosFromClientPoint]
  );

  const handleZoomButton = useCallback(
    (direction: 'in' | 'out') => {
      const currentScale = VIEWBOX_WIDTH / viewBoxRef.current.width;
      const factor = direction === 'in' ? 1.18 : 1 / 1.18;
      zoomToScale(currentScale * factor);
    },
    [zoomToScale]
  );

  const handleReset = useCallback(() => {
    suppressClickRef.current = false;
    pointersRef.current.clear();
    gestureRef.current = {
      mode: null,
      startViewBox: defaultViewBox,
    };
    setViewBox(defaultViewBox);
    viewBoxRef.current = defaultViewBox;
  }, [defaultViewBox]);

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

  const handlePointerDown = useCallback((event: React.PointerEvent<SVGSVGElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    const point = { x: event.clientX, y: event.clientY };
    pointersRef.current.set(event.pointerId, point);

    const points = Array.from(pointersRef.current.values());

    if (points.length >= 2) {
      const [first, second] = points;
      if (!first || !second) {
        return;
      }
      gestureRef.current = {
        mode: 'pinch',
        startViewBox: viewBoxRef.current,
        startMidpoint: getMidpoint(first, second),
        startDistance: getDistance(first, second),
      };
      suppressClickRef.current = true;
      return;
    }

    gestureRef.current = {
      mode: 'pan',
      startViewBox: viewBoxRef.current,
      startPoint: point,
    };
  }, []);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      if (!pointersRef.current.has(event.pointerId)) {
        return;
      }

      const point = { x: event.clientX, y: event.clientY };
      pointersRef.current.set(event.pointerId, point);
      const points = Array.from(pointersRef.current.values());
      const gesture = gestureRef.current;

      if (points.length >= 2 && gesture.startDistance && gesture.startMidpoint) {
        const [first, second] = points;
        if (!first || !second) {
          return;
        }
        const currentDistance = getDistance(first, second);
        if (!Number.isFinite(currentDistance) || currentDistance <= 0) {
          return;
        }

        const scaleRatio = currentDistance / gesture.startDistance;
        const startScale = VIEWBOX_WIDTH / gesture.startViewBox.width;
        const nextScale = clamp(startScale * scaleRatio, MIN_ZOOM, MAX_ZOOM);
        const nextWidth = VIEWBOX_WIDTH / nextScale;
        const nextHeight = VIEWBOX_HEIGHT / nextScale;
        const midpoint = getMidpoint(first, second);
        const focus = clientPointToViewBoxPoint(gesture.startMidpoint, gesture.startViewBox);
        const ratios = getRatiosFromClientPoint(midpoint);

        if (Math.abs(currentDistance - gesture.startDistance) > GESTURE_MOVE_THRESHOLD) {
          suppressClickRef.current = true;
        }

        applyViewBox(() => ({
          x: focus.x - ratios.x * nextWidth,
          y: focus.y - ratios.y * nextHeight,
          width: nextWidth,
          height: nextHeight,
        }));
        return;
      }

      if (points.length === 1 && gesture.mode === 'pan' && gesture.startPoint) {
        const scale = VIEWBOX_WIDTH / gesture.startViewBox.width;
        if (scale <= 1) {
          return;
        }

        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect || rect.width === 0 || rect.height === 0) {
          return;
        }

        const deltaX = ((point.x - gesture.startPoint.x) / rect.width) * gesture.startViewBox.width;
        const deltaY = ((point.y - gesture.startPoint.y) / rect.height) * gesture.startViewBox.height;

        if (Math.abs(point.x - gesture.startPoint.x) > GESTURE_MOVE_THRESHOLD || Math.abs(point.y - gesture.startPoint.y) > GESTURE_MOVE_THRESHOLD) {
          suppressClickRef.current = true;
        }

        applyViewBox(() => ({
          ...gesture.startViewBox,
          x: gesture.startViewBox.x - deltaX,
          y: gesture.startViewBox.y - deltaY,
        }));
      }
    },
    [applyViewBox, clientPointToViewBoxPoint, getRatiosFromClientPoint]
  );

  const handlePointerEnd = useCallback((event: React.PointerEvent<SVGSVGElement>) => {
    pointersRef.current.delete(event.pointerId);

    const points = Array.from(pointersRef.current.values());
    if (points.length >= 2) {
      const [first, second] = points;
      if (!first || !second) {
        return;
      }
      gestureRef.current = {
        mode: 'pinch',
        startViewBox: viewBoxRef.current,
        startMidpoint: getMidpoint(first, second),
        startDistance: getDistance(first, second),
      };
      return;
    }

    if (points.length === 1) {
      const [remaining] = points;
      if (!remaining) {
        return;
      }
      gestureRef.current = {
        mode: 'pan',
        startViewBox: viewBoxRef.current,
        startPoint: remaining,
      };
      return;
    }

    gestureRef.current = {
      mode: null,
      startViewBox: viewBoxRef.current,
    };

    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 80);
  }, []);

  const handleWheel = useCallback(
    (event: React.WheelEvent<SVGSVGElement>) => {
      event.preventDefault();

      const currentScale = VIEWBOX_WIDTH / viewBoxRef.current.width;
      const nextScale =
        event.deltaY < 0 ? currentScale * 1.12 : currentScale / 1.12;

      zoomToScale(nextScale, { x: event.clientX, y: event.clientY });
    },
    [zoomToScale]
  );

  const handleCountrySelect = useCallback(
    (countryCode: string) => {
      if (suppressClickRef.current) {
        suppressClickRef.current = false;
        return;
      }

      playMapCue('selection');
      selectCountry(countryCode);
    },
    [selectCountry]
  );

  const handleCountryHover = useCallback((countryCode: string) => {
    setHoveredCountry((previous) => {
      if (previous !== countryCode) {
        playMapCue('hover');
      }

      return countryCode;
    });
  }, []);

  return (
    <div className={`world-map ${showGunSelector ? 'world-map--muted' : ''}`}>
      {showMapControls ? (
        <div className="world-map__controls" aria-label="Map zoom controls">
          <div className="world-map__zoom-rail">
            <button type="button" className="world-map__control" onClick={() => handleZoomButton('in')} aria-label="Zoom in">
              +
            </button>
            <button type="button" className="world-map__control" onClick={() => handleZoomButton('out')} aria-label="Zoom out">
              -
            </button>
          </div>
          <button type="button" className="world-map__control world-map__control--reset" onClick={handleReset} aria-label="Reset map position">
            Reset
          </button>
        </div>
      ) : null}
      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        className="world-map__svg"
        aria-label="World map deployment grid"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        onWheel={handleWheel}
      >
        <rect width="1400" height="768" fill="#020304" />
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

        {PROJECTED_COUNTRIES.map((country, index) => {
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
          const markerStyle = {
            '--marker-delay': `${index * 38}ms`,
            '--marker-idle-delay': `${(index % 7) * 0.42}s`,
          } as CSSProperties;

          return (
            <g key={country.code}>
              <path
                d={country.d}
                className={countryClasses}
                role="button"
                tabIndex={0}
                aria-label={country.name}
                onMouseEnter={() => handleCountryHover(country.code)}
                onMouseLeave={() => setHoveredCountry(null)}
                onFocus={() => handleCountryHover(country.code)}
                onBlur={() => setHoveredCountry(null)}
                onClick={() => handleCountrySelect(country.code)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleCountrySelect(country.code);
                  }
                }}
              />
              <g
                className={`world-map__marker-cluster ${isSelected ? 'world-map__marker-cluster--selected' : ''}`}
                style={markerStyle}
              >
                <circle
                  cx={country.markerRenderX}
                  cy={country.markerRenderY}
                  r={isSelected ? 15 : 10}
                  className={pulseClasses}
                />
                <circle
                  cx={country.markerRenderX}
                  cy={country.markerRenderY}
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
              cx={COUNTRY_MAP.get(opponentCountry.code)?.markerRenderX ?? 0}
              cy={COUNTRY_MAP.get(opponentCountry.code)?.markerRenderY ?? 0}
              r={16}
              className={`world-map__marker-pulse world-map__marker-pulse--active-${opponentCountry.side}`}
            />
            <circle
              cx={COUNTRY_MAP.get(opponentCountry.code)?.markerRenderX ?? 0}
              cy={COUNTRY_MAP.get(opponentCountry.code)?.markerRenderY ?? 0}
              r={8}
              className={`world-map__marker world-map__marker--active-${opponentCountry.side}`}
            />
          </g>
        )}

        {activeData && (() => {
          const nameLines = splitCalloutName(activeData.name);
          const boxWidth = 268;
          const boxHeight = nameLines.length > 1 ? 102 : 88;
          const position = getCalloutPosition(activeData.x, activeData.y, boxWidth, boxHeight);
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
                width={boxWidth}
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
      {!showGunSelector && activeData ? (
        <div className={`world-map__mobile-chip world-map__mobile-chip--${activeData.side}`}>
          <p className="world-map__mobile-chip-code">{activeData.code}</p>
          <p className="world-map__mobile-chip-name">{activeData.name}</p>
          <p className="world-map__mobile-chip-state">
            {selectedCountry === activeData.code ? 'Deployment Locked' : 'Ready To Deploy'}
          </p>
        </div>
      ) : null}
    </div>
  );
}
