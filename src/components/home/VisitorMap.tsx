'use client';

import { MapIcon } from '@heroicons/react/24/outline';
import { useLocaleStore } from '@/lib/stores/localeStore';

const mapEmbedDocument = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; background: #fff; }
      body { display: flex; align-items: center; justify-content: center; }
      img, iframe, canvas, svg { max-width: 100% !important; }
    </style>
  </head>
  <body>
    <script id="mapmyvisitors" src="https://mapmyvisitors.com/map.js?d=zSEcLqTW75nSzV0_-inTbKuZ9KaNQBAj1OwX532dGgA&cl=ffffff&w=a"><\/script>
  </body>
</html>`;

export default function VisitorMap() {
  const locale = useLocaleStore((state) => state.locale);
  const isChinese = locale === 'zh';

  return (
    <section className="flex h-full min-h-[320px] flex-col rounded-xl border border-neutral-200 bg-neutral-50 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-semibold text-primary">
          {isChinese ? '访客地图' : 'Visitor Map'}
        </h3>
        <span className="inline-flex items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400">
          <MapIcon className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
          {isChinese ? '全球访问' : 'Global visits'}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-700">
        <iframe
          title={isChinese ? '网站访客地理分布地图' : 'Geographic distribution of website visitors'}
          srcDoc={mapEmbedDocument}
          loading="eager"
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
          referrerPolicy="strict-origin-when-cross-origin"
          className="h-full min-h-[222px] w-full border-0 bg-white"
        />
      </div>

      <p className="mt-3 text-center text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
        {isChinese ? '红点表示访客的大致所在区域' : 'Dots indicate approximate visitor regions'}
        {' · '}
        <a
          href="https://mapmyvisitors.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-accent transition-colors hover:text-accent-dark"
        >
          MapMyVisitors
        </a>
      </p>
    </section>
  );
}
