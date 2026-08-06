'use client';

import {
  ArrowTopRightOnSquareIcon,
  ChartBarSquareIcon,
  DocumentTextIcon,
  LinkIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import { useLocaleStore } from '@/lib/stores/localeStore';

interface AcademicSnapshotProps {
  scholarUrl?: string;
}

export default function AcademicSnapshot({ scholarUrl }: AcademicSnapshotProps) {
  const locale = useLocaleStore((state) => state.locale);
  const isChinese = locale === 'zh';

  const metrics = [
    {
      value: '14',
      label: isChinese ? '论文' : 'Publications',
      icon: DocumentTextIcon,
      color: 'text-sky-600 dark:text-sky-400',
      dot: 'bg-sky-500',
      background: 'bg-sky-50 dark:bg-sky-950/35',
      border: 'border-sky-100 dark:border-sky-900/60',
    },
    {
      value: '556',
      label: isChinese ? '引用次数' : 'Citations',
      icon: LinkIcon,
      color: 'text-violet-600 dark:text-violet-400',
      dot: 'bg-violet-500',
      background: 'bg-violet-50 dark:bg-violet-950/35',
      border: 'border-violet-100 dark:border-violet-900/60',
    },
    {
      value: '8',
      label: 'h-index',
      icon: ChartBarSquareIcon,
      color: 'text-amber-600 dark:text-amber-400',
      dot: 'bg-amber-500',
      background: 'bg-amber-50 dark:bg-amber-950/35',
      border: 'border-amber-100 dark:border-amber-900/60',
    },
    {
      value: '7',
      label: 'i10-index',
      icon: TrophyIcon,
      color: 'text-emerald-600 dark:text-emerald-400',
      dot: 'bg-emerald-500',
      background: 'bg-emerald-50 dark:bg-emerald-950/35',
      border: 'border-emerald-100 dark:border-emerald-900/60',
    },
  ];

  return (
    <section className="flex h-full min-h-[320px] flex-col overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 p-4 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-lg motion-reduce:transform-none dark:border-neutral-800 dark:bg-neutral-900">
      <h3 className="mb-3 font-semibold text-primary">
        {isChinese ? '学术概览' : 'Academic Snapshot'}
      </h3>

      <div className="grid grid-cols-2 gap-2.5">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <div
              key={metric.label}
              className={`${metric.background} ${metric.border} group rounded-lg border px-3 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm`}
            >
              <div className="mb-2 flex items-center justify-between">
                <Icon className={`h-4 w-4 ${metric.color}`} aria-hidden="true" />
                <span className={`h-1.5 w-1.5 rounded-full opacity-60 ${metric.dot}`} />
              </div>
              <p className="academic-metric-number text-2xl font-bold leading-none text-primary">
                {metric.value}
              </p>
              <p className="mt-1.5 text-sm font-medium tracking-wide text-neutral-600 dark:text-neutral-400">
                {metric.label}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-auto flex items-center justify-center gap-1 pt-3 text-[11px] text-neutral-500 dark:text-neutral-400">
        <span>{isChinese ? '数据统计参考' : 'Statistics referenced from'}</span>
        {scholarUrl ? (
          <a
            href={scholarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 font-medium text-[#4285f4] transition-colors hover:text-blue-600"
          >
            Google Scholar
            <ArrowTopRightOnSquareIcon className="h-2.5 w-2.5" aria-hidden="true" />
          </a>
        ) : (
          <span className="font-medium">Google Scholar</span>
        )}
      </div>
    </section>
  );
}
