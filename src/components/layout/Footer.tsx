'use client';

import Image from 'next/image';
import { useLocaleStore } from '@/lib/stores/localeStore';
import { useMessages } from '@/lib/i18n/useMessages';

interface FooterProps {
  lastUpdated?: string;
  lastUpdatedByLocale?: Record<string, string | undefined>;
  defaultLocale?: string;
}

export default function Footer({ lastUpdated, lastUpdatedByLocale, defaultLocale = 'en' }: FooterProps) {
  const locale = useLocaleStore((state) => state.locale);
  const messages = useMessages();

  const resolvedLastUpdated =
    lastUpdatedByLocale?.[locale] ||
    (defaultLocale ? lastUpdatedByLocale?.[defaultLocale] : undefined) ||
    lastUpdated ||
    new Date().toLocaleDateString(locale || 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <footer className="border-t border-neutral-200/50 bg-neutral-50/50 dark:bg-neutral-900/50 dark:border-neutral-700/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-xs text-neutral-500">
            {messages.footer.lastUpdated}: {resolvedLastUpdated}
          </p>
          <p className="text-xs text-neutral-500 flex items-center">
            <a href="https://github.com/xyjoey/PRISM" target="_blank" rel="noopener noreferrer">
              {messages.footer.builtWithPrism}
            </a>
            <span className="mx-2" aria-hidden="true">·</span>
            <a
              href="https://github.com/kian-qiyan/kian-qiyan.github.io"
              target="_blank"
              rel="noopener noreferrer"
            >
              {messages.footer.refinedBy}
            </a>
            <Image
              src="/bio.jpg"
              alt="Qi Yan"
              width={24}
              height={24}
              className="ml-2 h-6 w-6 rounded-full object-cover object-[50%_12%] ring-1 ring-neutral-200 dark:ring-neutral-700"
            />
          </p>
        </div>
      </div>
    </footer>
  );
}
