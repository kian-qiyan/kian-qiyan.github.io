'use client';

import { MapIcon } from '@heroicons/react/24/outline';
import { useLocaleStore } from '@/lib/stores/localeStore';

const widgetDocument = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <base target="_blank" />
  <style>
    html, body { margin: 0; min-height: 100%; background: transparent; }
    body { display: flex; align-items: center; justify-content: center; overflow: hidden; }
    img, canvas, svg { max-width: 100% !important; height: auto !important; }
  </style>
</head>
<body>
  <script type="text/javascript" id="mapmyvisitors" src="https://mapmyvisitors.com/map.js?d=zSEcLqTW75nSzV0_-inTbKuZ9KaNQBAj1OwX532dGgA&cl=ffffff&w=a"></script>
</body>
</html>`;

export default function VisitorMap() {
  const locale = useLocaleStore((state) => state.locale);
  const isChinese = locale === 'zh';

  return (
    <section className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between px-4 pb-2 pt-3.5">
        <div className="flex items-center gap-2">
          <MapIcon className="h-4 w-4 text-accent" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-primary">
            {isChinese ? '访客地图' : 'Visitor Map'}
          </h3>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
          </span>
          {isChinese ? '实时更新' : 'Live'}
        </span>
      </div>

      <div className="mx-3 mb-2 overflow-hidden rounded-lg bg-white dark:bg-neutral-950">
        <iframe
          title={isChinese ? '全球访客位置与访问统计' : 'Global visitor locations and visit statistics'}
          srcDoc={widgetDocument}
          className="block h-52 w-full border-0"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
        />
      </div>

      <p className="px-4 pb-3 text-center text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
        {isChinese
          ? '红点表示访客的大致区域；今日与累计访问数据由 MapMyVisitors 统计。'
          : 'Dots show approximate visitor regions; today and total visits are tracked by MapMyVisitors.'}
      </p>
    </section>
  );
}
