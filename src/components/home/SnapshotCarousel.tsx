'use client';

import { useCallback, useRef, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useLocaleStore } from '@/lib/stores/localeStore';
import AcademicSnapshot from '@/components/home/AcademicSnapshot';
import VisitorMap from '@/components/home/VisitorMap';
import { cn } from '@/lib/utils';

interface SnapshotCarouselProps {
  scholarUrl?: string;
}

export default function SnapshotCarousel({ scholarUrl }: SnapshotCarouselProps) {
  const locale = useLocaleStore((state) => state.locale);
  const isChinese = locale === 'zh';
  const viewportRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const slideLabels = [
    isChinese ? '学术概览' : 'Academic Snapshot',
    isChinese ? '访客地图' : 'Visitor Map',
  ];

  const goToSlide = useCallback((index: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    setActiveSlide(index);
    viewport.scrollTo({ left: viewport.clientWidth * index, behavior: 'smooth' });
  }, []);

  const handleScroll = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport || viewport.clientWidth === 0) return;

    const nextSlide = Math.max(0, Math.min(1, Math.round(viewport.scrollLeft / viewport.clientWidth)));
    setActiveSlide(nextSlide);
  }, []);

  return (
    <div className="mb-5">
      <div
        ref={viewportRef}
        onScroll={handleScroll}
        role="region"
        aria-roledescription="carousel"
        aria-label={isChinese ? '学术与访客信息' : 'Academic and visitor insights'}
        className="overflow-x-auto scroll-smooth snap-x snap-mandatory overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex items-stretch">
          <div className="w-full shrink-0 snap-start" aria-label={slideLabels[0]}>
            <AcademicSnapshot scholarUrl={scholarUrl} />
          </div>
          <div className="w-full shrink-0 snap-start" aria-label={slideLabels[1]}>
            <VisitorMap />
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => goToSlide(Math.max(0, activeSlide - 1))}
          disabled={activeSlide === 0}
          aria-label={isChinese ? '上一张卡片' : 'Previous card'}
          className="rounded-full p-1 text-neutral-500 transition hover:bg-neutral-100 hover:text-accent disabled:cursor-default disabled:opacity-30 dark:hover:bg-neutral-800"
        >
          <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-1.5">
          {slideLabels.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => goToSlide(index)}
              aria-label={label}
              aria-current={activeSlide === index ? 'true' : undefined}
              className={cn(
                'h-1.5 rounded-full transition-all duration-200',
                activeSlide === index ? 'w-5 bg-accent' : 'w-1.5 bg-neutral-300 hover:bg-neutral-400 dark:bg-neutral-700'
              )}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => goToSlide(Math.min(1, activeSlide + 1))}
          disabled={activeSlide === 1}
          aria-label={isChinese ? '下一张卡片' : 'Next card'}
          className="rounded-full p-1 text-neutral-500 transition hover:bg-neutral-100 hover:text-accent disabled:cursor-default disabled:opacity-30 dark:hover:bg-neutral-800"
        >
          <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
