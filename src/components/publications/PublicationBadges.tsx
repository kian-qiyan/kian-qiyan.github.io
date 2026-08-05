import { Publication } from '@/types/publication';
import { cn } from '@/lib/utils';

interface PublicationBadgesProps {
  publication: Publication;
  className?: string;
}

const badgeBase = 'inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold tracking-wide shadow-sm';

export default function PublicationBadges({ publication, className }: PublicationBadgesProps) {
  const badges = [
    publication.impactFactor !== undefined ? {
      label: `IF ${publication.impactFactor.toFixed(1)}`,
      className: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-300',
    } : null,
    publication.jcrQuartile ? {
      label: `JCR ${publication.jcrQuartile}`,
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
    } : null,
    publication.ccfRank ? {
      label: `CCF ${publication.ccfRank}`,
      className: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-300',
    } : null,
    publication.absRank ? {
      label: `ABS ${publication.absRank}`,
      className: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
    } : null,
    publication.indexing === 'EI' ? {
      label: 'EI',
      className: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300',
    } : null,
  ].filter((badge): badge is { label: string; className: string } => badge !== null);

  if (badges.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {badges.map((badge) => (
        <span key={badge.label} className={cn(badgeBase, badge.className)}>
          {badge.label}
        </span>
      ))}
    </div>
  );
}
