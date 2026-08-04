'use client';

import { useEffect, useState } from 'react';
import { EyeIcon } from '@heroicons/react/24/outline';
import { useLocaleStore } from '@/lib/stores/localeStore';

const counterUrl = 'https://counterapi.com/api/kian-qiyan.github.io/view/home';
const sessionKey = 'kian-home-visit-counted-v1';
let visitRequest: Promise<number> | null = null;

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

function requestVisitCount() {
  if (visitRequest) return visitRequest;

  const hasCounted = sessionStorage.getItem(sessionKey) === 'true';
  const url = hasCounted ? `${counterUrl}?readOnly=true` : counterUrl;

  if (!hasCounted) sessionStorage.setItem(sessionKey, 'true');

  visitRequest = fetch(url, { cache: 'no-store' })
    .then(async (response) => {
      if (!response.ok) throw new Error('Unable to load visit count');

      const count = readCount(await response.json());
      if (count === null) throw new Error('Invalid visit count');
      return count;
    })
    .catch((error) => {
      if (!hasCounted) sessionStorage.removeItem(sessionKey);
      visitRequest = null;
      throw error;
    });

  return visitRequest;
}

export default function GlobalVisitCounter() {
  const locale = useLocaleStore((state) => state.locale);
  const isChinese = locale === 'zh';
  const [count, setCount] = useState<number | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    requestVisitCount()
      .then(setCount)
      .catch(() => setIsAvailable(false));
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      title={!isAvailable ? (isChinese ? '访问统计暂时不可用' : 'Visit counter is temporarily unavailable') : undefined}
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
        {count === null ? '—' : count.toLocaleString(isChinese ? 'zh-CN' : 'en-US')}
      </span>
    </div>
  );
}
