'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useLocaleStore } from '@/lib/stores/localeStore';

const counterUrl = 'https://api.counterapi.dev/v1/kianqiyan/profilelikes';
const storageKey = 'kian-profile-liked-v2';

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

export default function GlobalLikeButton() {
  const locale = useLocaleStore((state) => state.locale);
  const isChinese = locale === 'zh';
  const [count, setCount] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    setLiked(localStorage.getItem(storageKey) === 'true');

    const loadCount = async () => {
      try {
        const response = await fetch(counterUrl, { cache: 'no-store' });
        if (response.status === 400 || response.status === 404) {
          setCount(0);
          return;
        }
        if (!response.ok) throw new Error('Unable to load like count');

        const nextCount = readCount(await response.json());
        if (nextCount === null) throw new Error('Invalid like count');
        setCount(nextCount);
      } catch {
        setIsAvailable(false);
      }
    };

    void loadCount();
  }, []);

  const handleLike = async () => {
    if (liked || isUpdating || !isAvailable) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`${counterUrl}/up`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Unable to update like count');

      const nextCount = readCount(await response.json());
      setCount((current) => nextCount ?? (current ?? 0) + 1);
      setLiked(true);
      localStorage.setItem(storageKey, 'true');
    } catch {
      setIsAvailable(false);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="mt-4 flex justify-center">
      <motion.button
        type="button"
        onClick={handleLike}
        disabled={liked || isUpdating || !isAvailable}
        whileHover={liked || !isAvailable ? undefined : { y: -2, scale: 1.02 }}
        whileTap={liked || !isAvailable ? undefined : { scale: 0.97 }}
        aria-pressed={liked}
        title={!isAvailable ? (isChinese ? '点赞服务暂时不可用' : 'Like service is temporarily unavailable') : undefined}
        className={`inline-flex min-h-10 items-center overflow-hidden rounded-full border text-sm font-medium shadow-sm transition-colors ${
          liked
            ? 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-400'
            : isAvailable
              ? 'border-neutral-200 bg-white text-neutral-700 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-rose-900 dark:hover:bg-rose-950/30 dark:hover:text-rose-400'
              : 'cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-600'
        }`}
      >
        <span className="inline-flex items-center gap-2 px-4 py-2">
          {liked ? (
            <HeartSolidIcon className="h-4 w-4" aria-hidden="true" />
          ) : (
            <HeartIcon className="h-4 w-4" aria-hidden="true" />
          )}
          <span>
            {liked
              ? (isChinese ? '感谢支持' : 'Thank you')
              : (isChinese ? '为主页点赞' : 'Like this page')}
          </span>
        </span>
        <span className="min-w-11 border-l border-current/15 px-3 py-2 text-center font-mono tabular-nums">
          {count === null ? '—' : count.toLocaleString(isChinese ? 'zh-CN' : 'en-US')}
        </span>
      </motion.button>
    </div>
  );
}
