import { AcademicCapIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { useMessages } from '@/lib/i18n/useMessages';
import type { EducationItem } from '@/types/education';

interface EducationProps {
  items: EducationItem[];
}

export default function Education({ items }: EducationProps) {
  const messages = useMessages();

  return (
    <section className="mb-6 rounded-lg bg-neutral-100 p-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg dark:bg-neutral-800">
      <h3 className="mb-3 font-semibold text-primary">{messages.profile.education}</h3>
      <div className="relative space-y-3 before:absolute before:bottom-3 before:left-[11px] before:top-3 before:w-px before:bg-accent/35">
        {items.map((item) => (
          <article key={`${item.title}-${item.period}`} className="relative pl-8">
            <div className="absolute left-0 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-accent/70 bg-background text-accent shadow-sm">
              <AcademicCapIcon className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <div className="rounded-lg border border-neutral-200 bg-background p-3 shadow-sm transition-colors hover:border-accent/40 dark:border-neutral-700 dark:bg-neutral-900">
              <h4 className="text-sm font-semibold leading-snug text-primary">{item.title}</h4>
              <p className="mt-1.5 text-xs leading-relaxed text-accent">{item.institution}</p>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                <CalendarDaysIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{item.period}</span>
              </div>
              {(item.gpa || (item.supervisors && item.supervisors.length > 0)) && (
                <div className="mt-2 space-y-1 border-t border-neutral-200/80 pt-2 text-[11px] leading-relaxed text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
                  {item.gpa && (
                    <p><span className="font-medium text-primary">{messages.profile.gpa}:</span> {item.gpa}</p>
                  )}
                  {item.supervisors && item.supervisors.length > 0 && (
                    <p>
                      <span className="font-medium text-primary">
                        {item.supervisors.length > 1 ? messages.profile.supervisors : messages.profile.supervisor}:
                      </span>{' '}
                      {item.supervisors.join(' · ')}
                    </p>
                  )}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
