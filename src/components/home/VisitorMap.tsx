'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapIcon } from '@heroicons/react/24/outline';
import { geoCentroid, geoGraticule10, geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import worldAtlas from 'world-atlas/countries-110m.json';
import { useLocaleStore } from '@/lib/stores/localeStore';

type VisitorLocation = {
  id: string;
  labelEn: string;
  labelZh: string;
  coordinates: [number, number];
};

type CounterPayload = {
  count?: unknown;
  value?: unknown;
  data?: { count?: unknown; value?: unknown };
};

type LocationCache = {
  counts: Record<string, number>;
  savedAt: number;
};

type IpWhoPayload = {
  success?: unknown;
  country?: unknown;
  country_code?: unknown;
  region?: unknown;
  region_code?: unknown;
  latitude?: unknown;
  longitude?: unknown;
};

type MapStatus = 'loading' | 'ready' | 'stale' | 'unavailable';

const counterNamespace = 'kian-qiyan.github.io';
const counterAction = 'visitor-location';
const counterBaseUrl = `https://counterapi.com/api/${counterNamespace}/${counterAction}`;
const counterStatsUrl = `https://counterapi.com/stats/${counterNamespace}/${counterAction}`;
const countryLookupUrl = 'https://ipwho.is/';
const sessionKey = 'kian-home-location-counted-v3';
const cacheKey = 'kian-home-location-counts-v3';
const requestTimeout = 10000;
const refreshInterval = 120000;

const chineseLocations: readonly VisitorLocation[] = [
  { id: 'cn-ah', labelEn: 'Anhui', labelZh: '安徽', coordinates: [117.28, 31.86] },
  { id: 'cn-bj', labelEn: 'Beijing', labelZh: '北京', coordinates: [116.41, 39.9] },
  { id: 'cn-cq', labelEn: 'Chongqing', labelZh: '重庆', coordinates: [106.55, 29.56] },
  { id: 'cn-fj', labelEn: 'Fujian', labelZh: '福建', coordinates: [119.3, 26.08] },
  { id: 'cn-gd', labelEn: 'Guangdong', labelZh: '广东', coordinates: [113.27, 23.13] },
  { id: 'cn-gs', labelEn: 'Gansu', labelZh: '甘肃', coordinates: [103.83, 36.06] },
  { id: 'cn-gx', labelEn: 'Guangxi', labelZh: '广西', coordinates: [108.32, 22.82] },
  { id: 'cn-gz', labelEn: 'Guizhou', labelZh: '贵州', coordinates: [106.71, 26.58] },
  { id: 'cn-ha', labelEn: 'Henan', labelZh: '河南', coordinates: [113.63, 34.75] },
  { id: 'cn-hb', labelEn: 'Hubei', labelZh: '湖北', coordinates: [114.31, 30.59] },
  { id: 'cn-he', labelEn: 'Hebei', labelZh: '河北', coordinates: [114.51, 38.04] },
  { id: 'cn-hi', labelEn: 'Hainan', labelZh: '海南', coordinates: [110.35, 20.02] },
  { id: 'cn-hk', labelEn: 'Hong Kong', labelZh: '香港', coordinates: [114.17, 22.32] },
  { id: 'cn-hl', labelEn: 'Heilongjiang', labelZh: '黑龙江', coordinates: [126.64, 45.76] },
  { id: 'cn-hn', labelEn: 'Hunan', labelZh: '湖南', coordinates: [112.94, 28.23] },
  { id: 'cn-jl', labelEn: 'Jilin', labelZh: '吉林', coordinates: [125.32, 43.9] },
  { id: 'cn-js', labelEn: 'Jiangsu', labelZh: '江苏', coordinates: [118.8, 32.06] },
  { id: 'cn-jx', labelEn: 'Jiangxi', labelZh: '江西', coordinates: [115.86, 28.68] },
  { id: 'cn-ln', labelEn: 'Liaoning', labelZh: '辽宁', coordinates: [123.43, 41.8] },
  { id: 'cn-mo', labelEn: 'Macao', labelZh: '澳门', coordinates: [113.54, 22.2] },
  { id: 'cn-nm', labelEn: 'Inner Mongolia', labelZh: '内蒙古', coordinates: [111.75, 40.84] },
  { id: 'cn-nx', labelEn: 'Ningxia', labelZh: '宁夏', coordinates: [106.23, 38.49] },
  { id: 'cn-qh', labelEn: 'Qinghai', labelZh: '青海', coordinates: [101.78, 36.62] },
  { id: 'cn-sc', labelEn: 'Sichuan', labelZh: '四川', coordinates: [104.07, 30.67] },
  { id: 'cn-sd', labelEn: 'Shandong', labelZh: '山东', coordinates: [117.12, 36.65] },
  { id: 'cn-sh', labelEn: 'Shanghai', labelZh: '上海', coordinates: [121.47, 31.23] },
  { id: 'cn-sn', labelEn: 'Shaanxi', labelZh: '陕西', coordinates: [108.94, 34.26] },
  { id: 'cn-sx', labelEn: 'Shanxi', labelZh: '山西', coordinates: [112.55, 37.87] },
  { id: 'cn-tj', labelEn: 'Tianjin', labelZh: '天津', coordinates: [117.2, 39.08] },
  { id: 'cn-tw', labelEn: 'Taiwan', labelZh: '台湾', coordinates: [121.0, 23.7] },
  { id: 'cn-xj', labelEn: 'Xinjiang', labelZh: '新疆', coordinates: [87.62, 43.82] },
  { id: 'cn-xz', labelEn: 'Tibet', labelZh: '西藏', coordinates: [91.12, 29.65] },
  { id: 'cn-yn', labelEn: 'Yunnan', labelZh: '云南', coordinates: [102.71, 25.04] },
  { id: 'cn-zj', labelEn: 'Zhejiang', labelZh: '浙江', coordinates: [120.15, 30.27] },
] as const;

const chineseLocationById = new Map(chineseLocations.map((location) => [location.id, location]));

const topology = worldAtlas as unknown as Parameters<typeof feature>[0];
const geography = feature(topology, topology.objects.countries);
const countries = geography.type === 'FeatureCollection' ? geography.features : [geography];
const projection = geoNaturalEarth1().translate([360, 174]).scale(126);
const pathGenerator = geoPath(projection);
const graticulePath = pathGenerator(geoGraticule10());

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const countryNameAliases: Readonly<Record<string, string>> = {
  'antigua-barbuda': 'antigua-and-barb',
  'bosnia-herzegovina': 'bosnia-and-herz',
  'bosnia-and-herzegovina': 'bosnia-and-herz',
  'cape-verde': 'cabo-verde',
  'central-african-republic': 'central-african-rep',
  'congo-brazzaville': 'congo',
  'congo-kinshasa': 'dem-rep-congo',
  'democratic-republic-of-the-congo': 'dem-rep-congo',
  'dominican-republic': 'dominican-rep',
  'equatorial-guinea': 'eq-guinea',
  'falkland-islands': 'falkland-is',
  'myanmar-burma': 'myanmar',
  'north-macedonia': 'macedonia',
  'palestinian-territories': 'palestine',
  'sao-tome-principe': 'sao-tome-and-principe',
  'solomon-islands': 'solomon-is',
  'south-sudan': 's-sudan',
  'st-vincent-grenadines': 'st-vin-and-gren',
  'timor-leste': 'east-timor',
  'trinidad-tobago': 'trinidad-and-tobago',
  'turkiye': 'turkey',
  'united-states': 'united-states-of-america',
  'vatican-city': 'vatican',
  'western-sahara': 'w-sahara',
};

// The compact 110 m basemap omits several small countries. Their fixed country
// centroids keep those visits visible without loading a much larger map bundle.
const countryCoordinateFallbacks: Readonly<Record<string, [number, number]>> = {
  AD: [1.5606, 42.542],
  AI: [-63.066, 18.2243],
  AN: [-68.9721, 12.1957],
  AS: [-170.7179, -14.3046],
  AW: [-69.9827, 12.521],
  BB: [-59.5602, 13.1811],
  BH: [50.5425, 26.0417],
  BL: [-62.841, 17.8988],
  BM: [-64.7558, 32.3131],
  CW: [-68.9721, 12.1957],
  DM: [-61.3576, 15.4394],
  FM: [153.2966, 7.5361],
  GD: [-61.6818, 12.1174],
  GG: [-2.5726, 49.4678],
  GU: [144.767, 13.4406],
  IM: [-4.5388, 54.224],
  JE: [-2.1272, 49.2181],
  KI: [-167.9217, 0.893],
  KM: [43.6844, -11.879],
  LI: [9.5357, 47.1367],
  MC: [7.4073, 43.7526],
  MF: [-63.0599, 18.0888],
  MS: [-62.1856, 16.7404],
  MT: [14.405, 35.9215],
  MU: [57.5714, -20.2779],
  MV: [73.4573, 3.7316],
  NF: [167.9497, -29.0516],
  NR: [166.9326, -0.5189],
  NU: [-169.8704, -19.0489],
  PW: [134.4056, 7.286],
  SC: [55.476, -4.6601],
  SG: [103.817, 1.359],
  SM: [12.4594, 43.9415],
  SX: [-63.0572, 18.0509],
  TO: [-174.7998, -20.4161],
  WS: [-172.1649, -13.7536],
};

const countryFeatureBySlug = new Map(
  countries.flatMap((country) => {
    const name = country.properties?.name;
    return typeof name === 'string' ? [[slugify(name), country] as const] : [];
  })
);
const countryNamesEn = new Intl.DisplayNames(['en'], { type: 'region' });
const countryNamesZh = new Intl.DisplayNames(['zh-CN'], { type: 'region' });

function buildCountryLocations() {
  const locations = new Map<string, VisitorLocation>();

  for (let first = 65; first <= 90; first += 1) {
    for (let second = 65; second <= 90; second += 1) {
      const code = String.fromCharCode(first, second);
      const displayName = countryNamesEn.of(code);
      if (!displayName || displayName === code) continue;

      const displaySlug = slugify(displayName);
      const atlasSlug = countryNameAliases[displaySlug] ?? displaySlug;
      const country = countryFeatureBySlug.get(atlasSlug);
      const coordinates = country
        ? geoCentroid(country) as [number, number]
        : countryCoordinateFallbacks[code];
      if (!coordinates) continue;

      locations.set(`country-${code.toLowerCase()}`, {
        id: `country-${code.toLowerCase()}`,
        labelEn: displayName,
        labelZh: countryNamesZh.of(code) ?? displayName,
        coordinates,
      });
    }
  }

  return locations;
}

const countryLocationById = buildCountryLocations();

function isLocationId(value: string) {
  return /^cn-[a-z]{2}$/.test(value) || /^country-[a-z]{2}$/.test(value);
}

function resolveLocation(id: string) {
  return chineseLocationById.get(id) ?? countryLocationById.get(id) ?? null;
}

function counterUrl(locationId: string, increment = false) {
  const params = new URLSearchParams();
  if (!increment) params.set('readOnly', 'true');
  return `${counterBaseUrl}/${locationId}?${params.toString()}`;
}

function readCount(payload: unknown): number | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as CounterPayload;
  const candidate = record.count ?? record.value ?? record.data?.count ?? record.data?.value;
  const parsed = typeof candidate === 'number' ? candidate : Number(candidate);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : null;
}

async function fetchResponse(url: string, keepalive = false) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), requestTimeout);

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal,
      keepalive,
    });
    if (!response.ok) throw new Error(`Request failed with ${response.status}`);
    return response;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function wait(delay: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, delay));
}

async function withRetry<T>(request: () => Promise<T>, attempts = 2): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await request();
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) await wait(450 * (attempt + 1));
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Unable to load visitor data');
}

function parseLocationCounts(html: string) {
  const documentNode = new DOMParser().parseFromString(html, 'text/html');
  const counts: Record<string, number> = {};

  documentNode.querySelectorAll('table tr').forEach((row) => {
    const link = Array.from(row.querySelectorAll<HTMLAnchorElement>('a[href]')).find((anchor) =>
      anchor.getAttribute('href')?.startsWith(`/stats/${counterNamespace}/${counterAction}/`)
    );
    if (!link) return;

    const href = link.getAttribute('href') ?? '';
    const locationId = decodeURIComponent(href.split('/').filter(Boolean).at(-1) ?? '');
    if (!isLocationId(locationId)) return;

    const cells = row.querySelectorAll('td');
    const countText = cells.item(2)?.textContent ?? '';
    const parsed = Number(countText.replace(/[^0-9]/g, ''));
    if (Number.isFinite(parsed)) counts[locationId] = Math.max(0, parsed);
  });

  return counts;
}

async function loadLocationCounts() {
  return withRetry(async () => {
    const response = await fetchResponse(`${counterStatsUrl}?sort=top`);
    return parseLocationCounts(await response.text());
  });
}

async function incrementLocation(locationId: string): Promise<number | null> {
  try {
    return await withRetry(async () => {
      const payload = await (await fetchResponse(counterUrl(locationId, true), true)).json();
      const count = readCount(payload);
      if (count === null) throw new Error('Invalid location count');
      return count;
    }, 3);
  } catch {
    return null;
  }
}

function fallbackCountryLocation(payload: IpWhoPayload, code: string): VisitorLocation | null {
  const latitude = Number(payload.latitude);
  const longitude = Number(payload.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const labelEn = typeof payload.country === 'string' ? payload.country : code;
  return {
    id: `country-${code.toLowerCase()}`,
    labelEn,
    labelZh: countryNamesZh.of(code) ?? labelEn,
    coordinates: [longitude, latitude],
  };
}

async function getCurrentLocation(): Promise<VisitorLocation | null> {
  try {
    const payload = (await (await fetchResponse(countryLookupUrl)).json()) as IpWhoPayload;
    if (payload.success === false) return null;

    const countryCode = typeof payload.country_code === 'string'
      ? payload.country_code.toUpperCase()
      : '';

    if (countryCode === 'CN') {
      const regionCode = typeof payload.region_code === 'string'
        ? payload.region_code.toLowerCase()
        : '';
      return chineseLocationById.get(`cn-${regionCode}`) ?? null;
    }

    const chineseSpecialRegion: Readonly<Record<string, string>> = {
      HK: 'cn-hk',
      MO: 'cn-mo',
      TW: 'cn-tw',
    };
    const chineseSpecialId = chineseSpecialRegion[countryCode];
    if (chineseSpecialId) return chineseLocationById.get(chineseSpecialId) ?? null;
    if (!/^[A-Z]{2}$/.test(countryCode)) return null;

    return countryLocationById.get(`country-${countryCode.toLowerCase()}`)
      ?? fallbackCountryLocation(payload, countryCode);
  } catch {
    return null;
  }
}

function readCachedCounts(): LocationCache | null {
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) ?? '') as Partial<LocationCache>;
    if (!cached.counts || typeof cached.counts !== 'object') return null;

    const counts = Object.fromEntries(
      Object.entries(cached.counts).flatMap(([id, value]) => {
        const parsed = Number(value);
        return isLocationId(id) && Number.isFinite(parsed)
          ? [[id, Math.max(0, parsed)] as const]
          : [];
      })
    );
    return { counts, savedAt: Number(cached.savedAt) || 0 };
  } catch {
    return null;
  }
}

function writeCachedCounts(counts: Record<string, number>) {
  try {
    const cached: LocationCache = { counts, savedAt: Date.now() };
    localStorage.setItem(cacheKey, JSON.stringify(cached));
  } catch {
    // The live map remains usable when browser storage is unavailable.
  }
}

function hasCountedThisSession() {
  try {
    return sessionStorage.getItem(sessionKey) === 'true';
  } catch {
    return true;
  }
}

function markSessionAsCounted() {
  try {
    sessionStorage.setItem(sessionKey, 'true');
  } catch {
    // Do not block rendering when browser storage is unavailable.
  }
}

function shouldTrackVisit() {
  const hostname = window.location.hostname;
  return hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname !== '::1';
}

export default function VisitorMap() {
  const locale = useLocaleStore((state) => state.locale);
  const isChinese = locale === 'zh';
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [currentLocation, setCurrentLocation] = useState<VisitorLocation | null>(null);
  const [status, setStatus] = useState<MapStatus>('loading');

  useEffect(() => {
    let cancelled = false;
    let syncing = false;
    let resolvedLocation: VisitorLocation | null | undefined;
    const initialCache = readCachedCounts();

    if (initialCache) {
      setCounts(initialCache.counts);
      setStatus('stale');
    }

    const syncMap = async () => {
      if (syncing) return;
      syncing = true;

      try {
        const loadedCountsPromise = loadLocationCounts();
        const location = resolvedLocation === undefined
          ? await getCurrentLocation()
          : resolvedLocation;

        if (cancelled) return;
        if (location !== null) resolvedLocation = location;
        setCurrentLocation(location);

        const latestCache = readCachedCounts();
        const nextCounts: Record<string, number> = { ...(latestCache?.counts ?? {}) };
        let liveRequestSucceeded = false;

        if (location && shouldTrackVisit() && !hasCountedThisSession()) {
          const incrementedCount = await incrementLocation(location.id);
          if (cancelled) return;

          if (incrementedCount !== null) {
            markSessionAsCounted();
            nextCounts[location.id] = Math.max(nextCounts[location.id] ?? 0, incrementedCount);
            liveRequestSucceeded = true;
          }
        }

        if (liveRequestSucceeded) {
          writeCachedCounts(nextCounts);
          setCounts({ ...nextCounts });
          setStatus('ready');
        }

        try {
          const loadedCounts = await loadedCountsPromise;
          if (cancelled) return;

          Object.entries(loadedCounts).forEach(([id, count]) => {
            nextCounts[id] = Math.max(nextCounts[id] ?? 0, count);
          });
          liveRequestSucceeded = true;
        } catch {
          // Keep the most recently cached counts when the public statistics list is unavailable.
        }

        if (liveRequestSucceeded) {
          writeCachedCounts(nextCounts);
          setCounts({ ...nextCounts });
          setStatus('ready');
        } else {
          setStatus(latestCache || initialCache ? 'stale' : 'unavailable');
        }
      } finally {
        syncing = false;
      }
    };

    void syncMap();

    const intervalId = window.setInterval(() => void syncMap(), refreshInterval);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void syncMap();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const visibleLocations = useMemo(() => {
    const locations = new Map<string, VisitorLocation>();

    Object.entries(counts).forEach(([id, count]) => {
      const location = count > 0 ? resolveLocation(id) : null;
      if (location) locations.set(id, location);
    });
    if (currentLocation) locations.set(currentLocation.id, currentLocation);

    return Array.from(locations.values());
  }, [counts, currentLocation]);

  const totalMappedVisits = useMemo(
    () => visibleLocations.reduce((total, location) => total + (counts[location.id] ?? 0), 0),
    [counts, visibleLocations]
  );

  const statusText =
    status === 'loading'
      ? isChinese
        ? '正在同步访客地区…'
        : 'Syncing visitor locations…'
      : status === 'stale'
        ? isChinese
          ? '正在显示上次成功获取的数据'
          : 'Showing the last successfully loaded data'
        : status === 'unavailable'
          ? isChinese
            ? '地区统计暂时不可用，地图仍可正常显示'
            : 'Location statistics are temporarily unavailable; the map remains available'
          : isChinese
            ? `${visibleLocations.length} 个访问地区 · ${totalMappedVisits} 次已记录访问`
            : `${visibleLocations.length} visitor locations · ${totalMappedVisits} mapped visits`;

  return (
    <section className="flex h-full min-h-[320px] flex-col rounded-xl border border-neutral-200 bg-neutral-50 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="font-semibold text-primary">
          {isChinese ? '访客地图' : 'Visitor Map'}
        </h3>
        <span className="inline-flex items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400">
          <MapIcon className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
          {isChinese ? '匿名地区统计' : 'Anonymous location stats'}
        </span>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg border border-neutral-200 bg-gradient-to-b from-sky-50 to-white dark:border-neutral-700 dark:from-slate-950 dark:to-neutral-900">
        <svg
          viewBox="0 0 720 348"
          role="img"
          aria-label={isChinese ? '带有访客地区红点的世界地图' : 'World map with visitor-location markers'}
          className="h-full min-h-[222px] w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <path
            d={graticulePath ?? undefined}
            fill="none"
            className="stroke-sky-200/60 dark:stroke-slate-700/45"
            strokeWidth="0.55"
          />
          <g className="fill-slate-200 stroke-white dark:fill-slate-700 dark:stroke-slate-900">
            {countries.map((country, index) => (
              <path
                key={String(country.id ?? index)}
                d={pathGenerator(country) ?? undefined}
                strokeWidth="0.55"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </g>

          {visibleLocations.map((location) => {
            const point = projection(location.coordinates);
            if (!point) return null;

            const count = counts[location.id] ?? 0;
            const isCurrent = location.id === currentLocation?.id;
            const radius = Math.min(7, 3.5 + Math.log2(Math.max(1, count)) * 0.65);
            const label = isChinese ? location.labelZh : location.labelEn;

            return (
              <g key={location.id} transform={`translate(${point[0]} ${point[1]})`}>
                {isCurrent && (
                  <circle
                    r={radius + 5}
                    fill="none"
                    className="animate-ping stroke-rose-400 opacity-50 motion-reduce:animate-none"
                    strokeWidth="1.4"
                  />
                )}
                <circle
                  r={radius + 2}
                  className="fill-white/90 stroke-rose-300 dark:fill-slate-900/90 dark:stroke-rose-500"
                  strokeWidth="1"
                />
                <circle r={radius} className="fill-rose-500" />
                <title>
                  {label}: {count || (isChinese ? '当前访问' : 'current visit')}
                </title>
              </g>
            );
          })}
        </svg>

        {status === 'loading' && visibleLocations.length === 0 && (
          <div className="pointer-events-none absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/25 to-transparent dark:via-slate-700/10" />
        )}
      </div>

      <div className="mt-2.5 text-center text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
        <p role="status" aria-live="polite">{statusText}</p>
        <p>
          {isChinese
            ? '国内按省级、海外按国家级近似显示；不保存或展示访客 IP'
            : 'China is shown by province and overseas visits by country; visitor IPs are neither stored nor displayed'}
          {' · '}
          <a
            href="https://www.naturalearthdata.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent transition-colors hover:text-accent-dark"
          >
            Natural Earth
          </a>
        </p>
      </div>
    </section>
  );
}
