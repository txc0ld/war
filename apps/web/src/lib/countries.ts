export interface CountryData {
  code: string;
  name: string;
  atlasId: string;
}

export const COUNTRIES: CountryData[] = [
  { code: 'US', name: 'United States', atlasId: '840' },
  { code: 'CA', name: 'Canada', atlasId: '124' },
  { code: 'MX', name: 'Mexico', atlasId: '484' },
  { code: 'BR', name: 'Brazil', atlasId: '076' },
  { code: 'AR', name: 'Argentina', atlasId: '032' },
  { code: 'CO', name: 'Colombia', atlasId: '170' },
  { code: 'GB', name: 'United Kingdom', atlasId: '826' },
  { code: 'FR', name: 'France', atlasId: '250' },
  { code: 'DE', name: 'Germany', atlasId: '276' },
  { code: 'ES', name: 'Spain', atlasId: '724' },
  { code: 'IT', name: 'Italy', atlasId: '380' },
  { code: 'RU', name: 'Russia', atlasId: '643' },
  { code: 'CN', name: 'China', atlasId: '156' },
  { code: 'JP', name: 'Japan', atlasId: '392' },
  { code: 'KR', name: 'South Korea', atlasId: '410' },
  { code: 'IN', name: 'India', atlasId: '356' },
  { code: 'AU', name: 'Australia', atlasId: '036' },
  { code: 'ZA', name: 'South Africa', atlasId: '710' },
  { code: 'NG', name: 'Nigeria', atlasId: '566' },
  { code: 'EG', name: 'Egypt', atlasId: '818' },
  { code: 'SA', name: 'Saudi Arabia', atlasId: '682' },
  { code: 'TR', name: 'Turkey', atlasId: '792' },
  { code: 'UA', name: 'Ukraine', atlasId: '804' },
  { code: 'SE', name: 'Sweden', atlasId: '752' },
  { code: 'KE', name: 'Kenya', atlasId: '404' },
  { code: 'TH', name: 'Thailand', atlasId: '764' },
  { code: 'ID', name: 'Indonesia', atlasId: '360' },
  { code: 'PH', name: 'Philippines', atlasId: '608' },
  { code: 'PE', name: 'Peru', atlasId: '604' },
  { code: 'CL', name: 'Chile', atlasId: '152' },
];

export const NETWORK_LINKS: ReadonlyArray<readonly [string, string]> = [
  ['US', 'GB'],
  ['US', 'BR'],
  ['GB', 'DE'],
  ['DE', 'UA'],
  ['EG', 'IN'],
  ['IN', 'JP'],
  ['AU', 'JP'],
  ['NG', 'GB'],
  ['BR', 'ZA'],
];
