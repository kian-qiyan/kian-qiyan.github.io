'use client';

import { useEffect, useState } from 'react';
import { EyeIcon } from '@heroicons/react/24/outline';
import { useLocaleStore } from '@/lib/stores/localeStore';

const counterUrl = 'https://api.counterapi.dev/v1/kian-qiyan/home-visits';
const sessionKey = 'kian-home-visit-counted-v2';
const cacheKey = 'kian-home-visit-count-v1';
const requestTimeout = 3500;
let visitRequest: Promise<number> | null = null;

type CounterStatus = 'loading' | 'ready' | 'stale' | 'unavailable';

type CachedCount = {
  count: number;
  savedAt: number;
};

function readCount(payload: unknown): number | null {
  if (!payload || typeof payload !== 'object') return null;

  const record = payload as {
    count?: unknown;
    value?: unknown;
    data?: { count?: unknown; value?: unknown };
  };
  const candidate = record.count ?? record.value ?? record.data?.count ?? record.data?.value;
  const parsed = typeof candidate === 'number' ? candidate : Number(candidate);

  return Number.isFinite(parsed) ? Math.max(0, parsed) : null;
}

function readCachedCount(): number | null {
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) ?? '') as Partial<CachedCount>;
    return typeof cached.count === 'number' && Number.isFinite(cached.count)
      ? Math.max(0, cached.count)
      : null;
  } catch {
    return null;
  }
}

function writeCachedCount(count: number) {
  try {
    const cached: CachedCount = { count, savedAt: Date.now() };
    localStorage.setItem(cacheKey, JSON.stringify(cached));
  } catch {
    // The live value can still be shown when storage is unavailable.
  }
}

function hasCountedThisSession(): boolean {
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
    // Avoid blocking the counter when session storage is unavailable.
  }
}

function wait(delay: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, delay));
}

async function fetchCount(url: string): Promise<number> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), requestTimeout);

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) throw new Error('Unable to load visit count');

    const count = readCount(await response.json());
    if (count === null) throw new Error('Invalid visit count');
    return count;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function fetchCountWithRetry(url: string, attempts: number): Promise<number> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fetchCount(url);
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) await wait(500 * (attempt + 1));
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Unable to load visit count');
}

function requestVisitCount() {
  if (visitRequest) return visitRequest;

  const hasCounted = hasCountedThisSession();

  if (!hasCounted) markSessionAsCounted();

  const request = hasCounted
    ? fetchCountWithRetry(`${counterUrl}/`, 2)
    : fetchCountWithRetry(`${counterUrl}/up`, 1).catch(() =>
        fetchCountWithRetry(`${counterUrl}/`, 2)
      );

  visitRequest = request.catch((error) => {
    visitRequest = null;
    throw error;
  });

  return visitRequest;
}

export default function GlobalVisitCounter() {
  const locale = useLocaleStore((state) => state.locale);
  const isChinese = locale === 'zh';
  const [count, setCount] = useState<number | null>(null);
  const [status, setStatus] = useState<CounterStatus>('loading');

  useEffect(() => {
    const cachedCount = readCachedCount();

    if (cachedCount !== null) {
      setCount(cachedCount);
      setStatus('stale');
    }

    requestVisitCount()
      .then((nextCount) => {
        writeCachedCount(nextCount);
        setCount(nextCount);
        setStatus('ready');
      })
      .catch(() => setStatus(cachedCount === null ? 'unavailable' : 'stale'));
  }, []);

  const isAvailable = status !== 'unavailable';
  const title =
    status === 'unavailable'
      ? isChinese
        ? '访问统计暂时不可用'
        : 'Visit counter is temporarily unavailable'
      : status === 'stale'
        ? isChinese
          ? '正在显示上次成功获取的访问数据'
          : 'Showing the last successfully loaded visit count'
        : undefined;

  return (
    <div
      role="status"
      aria-live="polite"
      title={title}
      className={`inline-flex min-h-10 items-center overflow-hidden rounded-full border text-sm font-medium shadow-sm ${
        isAvailable
          ? 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-400'
          : 'border-neutral-200 bg-neutral-100 text-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-600'
      }`}
    >
      <span className="inline-flex items-center gap-2 px-4 py-2">
        <EyeIcon className="h-4 w-4" aria-hidden="true" />
        <span>{isChinese ? '累计访问' : 'Visits'}</span>
      </span>
      <span className="min-w-11 border-l border-current/15 px-3 py-2 text-center font-mono tabular-nums">
        {count === null
          ? status === 'loading'
            ? '…'
            : '—'
          : count.toLocaleString(isChinese ? 'zh-CN' : 'en-US')}
      </span>
    </div>
  );
}
