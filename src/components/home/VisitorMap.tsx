'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapIcon } from '@heroicons/react/24/outline';
import { geoGraticule10, geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import worldAtlas from 'world-atlas/countries-110m.json';
import { useLocaleStore } from '@/lib/stores/localeStore';

type VisitorRegion = {
  id: string;
  labelEn: string;
  labelZh: string;
  coordinates: [number, number];
  countries: readonly string[];
};

type CounterPayload = {
  count?: unknown;
  value?: unknown;
  data?: { count?: unknown; value?: unknown };
};

type RegionCache = {
  counts: Record<string, number>;
  savedAt: number;
};

type MapStatus = 'loading' | 'ready' | 'stale' | 'unavailable';

const counterBaseUrl = 'https://api.counterapi.dev/v1/kian-qiyan';
const countryLookupUrl = 'https://api.country.is/';
const regionCounterPrefix = 'visitor-region-';
const sessionKey = 'kian-home-region-counted-v1';
const cacheKey = 'kian-home-region-counts-v1';
const requestTimeout = 5000;

const visitorRegions: readonly VisitorRegion[] = [
  {
    id: 'north-america',
    labelEn: 'North America',
    labelZh: '北美洲',
    coordinates: [-104, 47],
    countries: ['BM', 'CA', 'GL', 'PM', 'US'],
  },
  {
    id: 'central-america-caribbean',
    labelEn: 'Central America & Caribbean',
    labelZh: '中美洲与加勒比地区',
    coordinates: [-82, 18],
    countries: ['AG', 'AI', 'AW', 'BB', 'BL', 'BQ', 'BS', 'BZ', 'CR', 'CU', 'CW', 'DM', 'DO', 'GD', 'GP', 'GT', 'HN', 'HT', 'JM', 'KN', 'KY', 'LC', 'MF', 'MQ', 'MS', 'MX', 'NI', 'PA', 'PR', 'SV', 'SX', 'TC', 'TT', 'VC', 'VG', 'VI'],
  },
  {
    id: 'northern-south-america',
    labelEn: 'Northern South America',
    labelZh: '南美洲北部',
    coordinates: [-64, 3],
    countries: ['CO', 'EC', 'GF', 'GY', 'SR', 'VE'],
  },
  {
    id: 'southern-south-america',
    labelEn: 'Southern South America',
    labelZh: '南美洲南部',
    coordinates: [-62, -25],
    countries: ['AR', 'BO', 'BR', 'CL', 'FK', 'PE', 'PY', 'UY'],
  },
  {
    id: 'northern-europe',
    labelEn: 'Northern Europe',
    labelZh: '北欧',
    coordinates: [10, 59],
    countries: ['DK', 'EE', 'FI', 'FO', 'GB', 'GG', 'IE', 'IM', 'IS', 'JE', 'LT', 'LV', 'NO', 'SE', 'SJ'],
  },
  {
    id: 'western-europe',
    labelEn: 'Western Europe',
    labelZh: '西欧',
    coordinates: [3, 48],
    countries: ['AT', 'BE', 'CH', 'DE', 'FR', 'LI', 'LU', 'MC', 'NL'],
  },
  {
    id: 'southern-europe',
    labelEn: 'Southern Europe',
    labelZh: '南欧',
    coordinates: [15, 40],
    countries: ['AD', 'AL', 'BA', 'CY', 'ES', 'GI', 'GR', 'HR', 'IT', 'ME', 'MK', 'MT', 'PT', 'RS', 'SI', 'SM', 'VA', 'XK'],
  },
  {
    id: 'eastern-europe',
    labelEn: 'Eastern Europe',
    labelZh: '东欧',
    coordinates: [31, 52],
    countries: ['BG', 'BY', 'CZ', 'HU', 'MD', 'PL', 'RO', 'RU', 'SK', 'UA'],
  },
  {
    id: 'north-africa',
    labelEn: 'North Africa',
    labelZh: '北非',
    coordinates: [14, 28],
    countries: ['DZ', 'EG', 'EH', 'LY', 'MA', 'SD', 'TN'],
  },
  {
    id: 'west-africa',
    labelEn: 'West Africa',
    labelZh: '西非',
    coordinates: [-4, 10],
    countries: ['BF', 'BJ', 'CI', 'CV', 'GH', 'GM', 'GN', 'GW', 'LR', 'ML', 'MR', 'NE', 'NG', 'SH', 'SL', 'SN', 'TG'],
  },
  {
    id: 'central-africa',
    labelEn: 'Central Africa',
    labelZh: '中非',
    coordinates: [18, 1],
    countries: ['AO', 'CD', 'CF', 'CG', 'CM', 'GA', 'GQ', 'ST', 'TD'],
  },
  {
    id: 'east-africa',
    labelEn: 'East Africa',
    labelZh: '东非',
    coordinates: [38, 2],
    countries: ['BI', 'DJ', 'ER', 'ET', 'KE', 'KM', 'MG', 'MU', 'MW', 'MZ', 'RE', 'RW', 'SC', 'SO', 'SS', 'TZ', 'UG', 'YT', 'ZM', 'ZW'],
  },
  {
    id: 'southern-africa',
    labelEn: 'Southern Africa',
    labelZh: '南部非洲',
    coordinates: [24, -27],
    countries: ['BW', 'LS', 'NA', 'SZ', 'ZA'],
  },
  {
    id: 'middle-east',
    labelEn: 'Middle East',
    labelZh: '中东',
    coordinates: [45, 29],
    countries: ['AE', 'BH', 'IL', 'IQ', 'IR', 'JO', 'KW', 'LB', 'OM', 'PS', 'QA', 'SA', 'SY', 'TR', 'YE'],
  },
  {
    id: 'central-asia',
    labelEn: 'Central Asia',
    labelZh: '中亚',
    coordinates: [68, 43],
    countries: ['KG', 'KZ', 'TJ', 'TM', 'UZ'],
  },
  {
    id: 'south-asia',
    labelEn: 'South Asia',
    labelZh: '南亚',
    coordinates: [78, 23],
    countries: ['AF', 'BD', 'BT', 'IN', 'LK', 'MV', 'NP', 'PK'],
  },
  {
    id: 'east-asia',
    labelEn: 'East Asia',
    labelZh: '东亚',
    coordinates: [112, 36],
    countries: ['CN', 'HK', 'JP', 'KP', 'KR', 'MO', 'MN', 'TW'],
  },
  {
    id: 'southeast-asia',
    labelEn: 'Southeast Asia',
    labelZh: '东南亚',
    coordinates: [108, 10],
    countries: ['BN', 'ID', 'KH', 'LA', 'MM', 'MY', 'PH', 'SG', 'TH', 'TL', 'VN'],
  },
  {
    id: 'oceania',
    labelEn: 'Oceania',
    labelZh: '大洋洲',
    coordinates: [139, -26],
    countries: ['AS', 'AU', 'CC', 'CK', 'CX', 'FJ', 'FM', 'GU', 'KI', 'MH', 'MP', 'NC', 'NF', 'NR', 'NU', 'NZ', 'PF', 'PG', 'PN', 'PW', 'SB', 'TK', 'TO', 'TV', 'VU', 'WF', 'WS'],
  },
] as const;

const countryToRegion = new Map(
  visitorRegions.flatMap((region) => region.countries.map((country) => [country, region.id] as const))
);

const topology = worldAtlas as unknown as Parameters<typeof feature>[0];
const geography = feature(topology, topology.objects.countries);
const countries = geography.type === 'FeatureCollection' ? geography.features : [geography];
const projection = geoNaturalEarth1().translate([360, 174]).scale(126);
const pathGenerator = geoPath(projection);
const graticulePath = pathGenerator(geoGraticule10());

function counterUrl(regionId: string, increment = false) {
  return `${counterBaseUrl}/${regionCounterPrefix}${regionId}/${increment ? 'up' : ''}`;
}

function readCount(payload: unknown): number | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as CounterPayload;
  const candidate = record.count ?? record.value ?? record.data?.count ?? record.data?.value;
  const parsed = typeof candidate === 'number' ? candidate : Number(candidate);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : null;
}

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), requestTimeout);

  try {
    const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
    if (!response.ok) throw new Error(`Request failed with ${response.status}`);
    return await response.json();
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function getRegionCount(regionId: string): Promise<number> {
  try {
    return readCount(await fetchJson(counterUrl(regionId))) ?? 0;
  } catch {
    return 0;
  }
}

async function incrementRegion(regionId: string): Promise<number | null> {
  try {
    return readCount(await fetchJson(counterUrl(regionId, true)));
  } catch {
    return null;
  }
}

async function getCurrentRegion(): Promise<string | null> {
  try {
    const payload = (await fetchJson(countryLookupUrl)) as { country?: unknown };
    const country = typeof payload.country === 'string' ? payload.country.toUpperCase() : '';
    return countryToRegion.get(country) ?? null;
  } catch {
    return null;
  }
}

function readCachedCounts(): RegionCache | null {
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) ?? '') as Partial<RegionCache>;
    if (!cached.counts || typeof cached.counts !== 'object') return null;

    const counts = Object.fromEntries(
      visitorRegions.map((region) => {
        const value = Number(cached.counts?.[region.id]);
        return [region.id, Number.isFinite(value) ? Math.max(0, value) : 0];
      })
    );
    return { counts, savedAt: Number(cached.savedAt) || 0 };
  } catch {
    return null;
  }
}

function writeCachedCounts(counts: Record<string, number>) {
  try {
    const cached: RegionCache = { counts, savedAt: Date.now() };
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
  const [currentRegionId, setCurrentRegionId] = useState<string | null>(null);
  const [status, setStatus] = useState<MapStatus>('loading');

  useEffect(() => {
    let cancelled = false;
    const cached = readCachedCounts();

    if (cached) {
      setCounts(cached.counts);
      setStatus('stale');
    }

    const syncMap = async () => {
      const [regionId, loadedCounts] = await Promise.all([
        getCurrentRegion(),
        Promise.all(visitorRegions.map(async (region) => [region.id, await getRegionCount(region.id)] as const)),
      ]);

      if (cancelled) return;
      setCurrentRegionId(regionId);

      const nextCounts = Object.fromEntries(loadedCounts);
      let liveRequestSucceeded = loadedCounts.some(([, count]) => count > 0);

      if (regionId && shouldTrackVisit() && !hasCountedThisSession()) {
        markSessionAsCounted();
        const incrementedCount = await incrementRegion(regionId);
        if (cancelled) return;

        if (incrementedCount !== null) {
          nextCounts[regionId] = Math.max(nextCounts[regionId] ?? 0, incrementedCount);
          liveRequestSucceeded = true;
        }
      }

      if (liveRequestSucceeded || regionId) {
        writeCachedCounts(nextCounts);
        setCounts(nextCounts);
        setStatus('ready');
      } else {
        setStatus(cached ? 'stale' : 'unavailable');
      }
    };

    void syncMap();
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleRegions = useMemo(
    () =>
      visitorRegions.filter(
        (region) => (counts[region.id] ?? 0) > 0 || region.id === currentRegionId
      ),
    [counts, currentRegionId]
  );
  const totalMappedVisits = useMemo(
    () => visitorRegions.reduce((total, region) => total + (counts[region.id] ?? 0), 0),
    [counts]
  );

  const statusText =
    status === 'loading'
      ? isChinese
        ? '正在同步访客区域…'
        : 'Syncing visitor regions…'
      : status === 'stale'
        ? isChinese
          ? '正在显示上次成功获取的数据'
          : 'Showing the last successfully loaded data'
        : status === 'unavailable'
          ? isChinese
            ? '区域统计暂时不可用，地图仍可正常显示'
            : 'Regional statistics are temporarily unavailable; the map remains available'
          : isChinese
            ? `${visibleRegions.length} 个访问区域 · ${totalMappedVisits} 次已记录访问`
            : `${visibleRegions.length} visitor regions · ${totalMappedVisits} mapped visits`;

  return (
    <section className="flex h-full min-h-[320px] flex-col rounded-xl border border-neutral-200 bg-neutral-50 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="font-semibold text-primary">
          {isChinese ? '访客地图' : 'Visitor Map'}
        </h3>
        <span className="inline-flex items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400">
          <MapIcon className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
          {isChinese ? '匿名区域统计' : 'Anonymous regional stats'}
        </span>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg border border-neutral-200 bg-gradient-to-b from-sky-50 to-white dark:border-neutral-700 dark:from-slate-950 dark:to-neutral-900">
        <svg
          viewBox="0 0 720 348"
          role="img"
          aria-label={isChinese ? '带有访客区域红点的世界地图' : 'World map with visitor-region markers'}
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

          {visibleRegions.map((region) => {
            const point = projection(region.coordinates);
            if (!point) return null;

            const count = counts[region.id] ?? 0;
            const isCurrent = region.id === currentRegionId;
            const radius = Math.min(7, 3.5 + Math.log2(Math.max(1, count)) * 0.65);
            const label = isChinese ? region.labelZh : region.labelEn;

            return (
              <g key={region.id} transform={`translate(${point[0]} ${point[1]})`}>
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

        {status === 'loading' && visibleRegions.length === 0 && (
          <div className="pointer-events-none absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/25 to-transparent dark:via-slate-700/10" />
        )}
      </div>

      <div className="mt-2.5 text-center text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
        <p role="status" aria-live="polite">{statusText}</p>
        <p>
          {isChinese
            ? '红点仅表示国家级近似区域，不保存或展示访客 IP'
            : 'Dots show country-level approximations; visitor IPs are neither stored nor displayed'}
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
