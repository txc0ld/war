export type CountryCode =
  | 'AR'
  | 'AU'
  | 'BR'
  | 'CA'
  | 'CN'
  | 'DE'
  | 'EG'
  | 'FR'
  | 'GB'
  | 'IN'
  | 'JP'
  | 'KE'
  | 'KR'
  | 'MX'
  | 'NG'
  | 'RU'
  | 'SE'
  | 'US'
  | 'ZA'
  | 'AE';

export type CountrySide = 'left' | 'right';

export interface CountryLocation {
  code: CountryCode;
  name: string;
  atlasId: string;
  side: CountrySide;
  region:
    | 'North America'
    | 'South America'
    | 'Europe'
    | 'Africa'
    | 'Middle East'
    | 'Asia Pacific';
  latitude: number;
  longitude: number;
  markerX: number;
  markerY: number;
  status: 'active' | 'contested' | 'monitoring';
  networkTier: 'core' | 'relay' | 'frontier';
  theater: string;
  deploymentWindow: string;
}

export type CountryNetworkLink = readonly [CountryCode, CountryCode];

export const COUNTRIES: CountryLocation[] = [
  {
    code: 'US',
    name: 'United States',
    atlasId: '840',
    side: 'left',
    region: 'North America',
    latitude: 38.0,
    longitude: -97.0,
    markerX: 18,
    markerY: 42,
    status: 'active',
    networkTier: 'core',
    theater: 'Atlantic Command',
    deploymentWindow: '06:00-18:00 UTC',
  },
  {
    code: 'CA',
    name: 'Canada',
    atlasId: '124',
    side: 'left',
    region: 'North America',
    latitude: 56.1304,
    longitude: -106.3468,
    markerX: 18,
    markerY: 30,
    status: 'monitoring',
    networkTier: 'relay',
    theater: 'Arctic Relay',
    deploymentWindow: '00:00-12:00 UTC',
  },
  {
    code: 'MX',
    name: 'Mexico',
    atlasId: '484',
    side: 'left',
    region: 'North America',
    latitude: 23.6345,
    longitude: -102.5528,
    markerX: 15,
    markerY: 50,
    status: 'contested',
    networkTier: 'frontier',
    theater: 'Pacific Corridor',
    deploymentWindow: '10:00-22:00 UTC',
  },
  {
    code: 'BR',
    name: 'Brazil',
    atlasId: '076',
    side: 'left',
    region: 'South America',
    latitude: -14.235,
    longitude: -51.9253,
    markerX: 30,
    markerY: 65,
    status: 'active',
    networkTier: 'core',
    theater: 'Amazon Lattice',
    deploymentWindow: '12:00-00:00 UTC',
  },
  {
    code: 'AR',
    name: 'Argentina',
    atlasId: '032',
    side: 'left',
    region: 'South America',
    latitude: -38.4161,
    longitude: -63.6167,
    markerX: 27,
    markerY: 78,
    status: 'monitoring',
    networkTier: 'relay',
    theater: 'Southern Reach',
    deploymentWindow: '14:00-02:00 UTC',
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    atlasId: '826',
    side: 'left',
    region: 'Europe',
    latitude: 55.3781,
    longitude: -3.436,
    markerX: 47,
    markerY: 32,
    status: 'active',
    networkTier: 'core',
    theater: 'North Sea Net',
    deploymentWindow: '04:00-16:00 UTC',
  },
  {
    code: 'FR',
    name: 'France',
    atlasId: '250',
    side: 'left',
    region: 'Europe',
    latitude: 46.2276,
    longitude: 2.2137,
    markerX: 49,
    markerY: 36,
    status: 'monitoring',
    networkTier: 'relay',
    theater: 'Gaul Exchange',
    deploymentWindow: '05:00-17:00 UTC',
  },
  {
    code: 'DE',
    name: 'Germany',
    atlasId: '276',
    side: 'right',
    region: 'Europe',
    latitude: 51.1657,
    longitude: 10.4515,
    markerX: 51,
    markerY: 34,
    status: 'active',
    networkTier: 'core',
    theater: 'Rhine Control',
    deploymentWindow: '05:00-17:00 UTC',
  },
  {
    code: 'SE',
    name: 'Sweden',
    atlasId: '752',
    side: 'right',
    region: 'Europe',
    latitude: 60.1282,
    longitude: 18.6435,
    markerX: 52,
    markerY: 25,
    status: 'monitoring',
    networkTier: 'relay',
    theater: 'Baltic Screen',
    deploymentWindow: '03:00-15:00 UTC',
  },
  {
    code: 'RU',
    name: 'Russia',
    atlasId: '643',
    side: 'right',
    region: 'Europe',
    latitude: 61.524,
    longitude: 105.3188,
    markerX: 65,
    markerY: 28,
    status: 'contested',
    networkTier: 'frontier',
    theater: 'Eurasian Rim',
    deploymentWindow: '00:00-12:00 UTC',
  },
  {
    code: 'EG',
    name: 'Egypt',
    atlasId: '818',
    side: 'right',
    region: 'Africa',
    latitude: 26.8206,
    longitude: 30.8025,
    markerX: 55,
    markerY: 47,
    status: 'active',
    networkTier: 'relay',
    theater: 'Suez Gate',
    deploymentWindow: '06:00-18:00 UTC',
  },
  {
    code: 'NG',
    name: 'Nigeria',
    atlasId: '566',
    side: 'left',
    region: 'Africa',
    latitude: 9.082,
    longitude: 8.6753,
    markerX: 50,
    markerY: 55,
    status: 'contested',
    networkTier: 'frontier',
    theater: 'Gulf Watch',
    deploymentWindow: '08:00-20:00 UTC',
  },
  {
    code: 'KE',
    name: 'Kenya',
    atlasId: '404',
    side: 'right',
    region: 'Africa',
    latitude: -0.0236,
    longitude: 37.9062,
    markerX: 57,
    markerY: 60,
    status: 'monitoring',
    networkTier: 'relay',
    theater: 'Equator Link',
    deploymentWindow: '07:00-19:00 UTC',
  },
  {
    code: 'ZA',
    name: 'South Africa',
    atlasId: '710',
    side: 'right',
    region: 'Africa',
    latitude: -30.5595,
    longitude: 22.9375,
    markerX: 55,
    markerY: 75,
    status: 'active',
    networkTier: 'core',
    theater: 'Cape Spine',
    deploymentWindow: '10:00-22:00 UTC',
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    atlasId: '784',
    side: 'right',
    region: 'Middle East',
    latitude: 23.4241,
    longitude: 53.8478,
    markerX: 60,
    markerY: 48,
    status: 'active',
    networkTier: 'relay',
    theater: 'Strait Gateway',
    deploymentWindow: '06:00-18:00 UTC',
  },
  {
    code: 'IN',
    name: 'India',
    atlasId: '356',
    side: 'right',
    region: 'Asia Pacific',
    latitude: 20.5937,
    longitude: 78.9629,
    markerX: 68,
    markerY: 48,
    status: 'active',
    networkTier: 'core',
    theater: 'Monsoon Grid',
    deploymentWindow: '08:00-20:00 UTC',
  },
  {
    code: 'CN',
    name: 'China',
    atlasId: '156',
    side: 'right',
    region: 'Asia Pacific',
    latitude: 35.8617,
    longitude: 104.1954,
    markerX: 75,
    markerY: 40,
    status: 'contested',
    networkTier: 'frontier',
    theater: 'Silk Relay',
    deploymentWindow: '00:00-12:00 UTC',
  },
  {
    code: 'KR',
    name: 'South Korea',
    atlasId: '410',
    side: 'right',
    region: 'Asia Pacific',
    latitude: 35.9078,
    longitude: 127.7669,
    markerX: 80,
    markerY: 40,
    status: 'monitoring',
    networkTier: 'relay',
    theater: 'Peninsula Stack',
    deploymentWindow: '00:00-12:00 UTC',
  },
  {
    code: 'JP',
    name: 'Japan',
    atlasId: '392',
    side: 'right',
    region: 'Asia Pacific',
    latitude: 36.2048,
    longitude: 138.2529,
    markerX: 83,
    markerY: 40,
    status: 'active',
    networkTier: 'core',
    theater: 'Pacific Arc',
    deploymentWindow: '00:00-12:00 UTC',
  },
  {
    code: 'AU',
    name: 'Australia',
    atlasId: '036',
    side: 'right',
    region: 'Asia Pacific',
    latitude: -25.2744,
    longitude: 133.7751,
    markerX: 82,
    markerY: 72,
    status: 'active',
    networkTier: 'core',
    theater: 'Coral Shield',
    deploymentWindow: '22:00-10:00 UTC',
  },
];

export const COUNTRY_BY_CODE = new Map(
  COUNTRIES.map((country) => [country.code, country])
);

export function getCountryByCode(code: string | null | undefined): CountryLocation | null {
  if (!code) {
    return null;
  }

  return COUNTRY_BY_CODE.get(code as CountryCode) ?? null;
}

export function getCountrySide(code: string | null | undefined): CountrySide | null {
  return getCountryByCode(code)?.side ?? null;
}

export const NETWORK_LINKS: CountryNetworkLink[] = [
  ['US', 'GB'],
  ['US', 'BR'],
  ['CA', 'DE'],
  ['MX', 'US'],
  ['BR', 'AR'],
  ['BR', 'ZA'],
  ['GB', 'DE'],
  ['FR', 'EG'],
  ['DE', 'SE'],
  ['DE', 'AE'],
  ['EG', 'NG'],
  ['NG', 'KE'],
  ['AE', 'IN'],
  ['RU', 'CN'],
  ['IN', 'CN'],
  ['CN', 'KR'],
  ['KR', 'JP'],
  ['JP', 'AU'],
];
