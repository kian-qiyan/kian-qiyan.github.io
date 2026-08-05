'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowTopRightOnSquareIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Publication } from '@/types/publication';
import { useMessages } from '@/lib/i18n/useMessages';
import FormattedBibTeXText from '@/components/publications/FormattedBibTeXText';
import PublicationBadges from '@/components/publications/PublicationBadges';
import { useLocaleStore } from '@/lib/stores/localeStore';
import { cn } from '@/lib/utils';

interface SelectedPublicationsProps {
    publications: Publication[];
    title?: string;
    enableOnePageMode?: boolean;
}

export default function SelectedPublications({ publications, title, enableOnePageMode = false }: SelectedPublicationsProps) {
    const messages = useMessages();
    const locale = useLocaleStore((state) => state.locale);
    const resolvedTitle = title || messages.home.selectedPublications;
    const [expandedAbstractId, setExpandedAbstractId] = useState<string | null>(null);

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
        >
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-serif font-bold text-primary">{resolvedTitle}</h2>
                <Link
                    href={enableOnePageMode ? "/#publications" : "/publications"}
                    prefetch={true}
                    className="text-accent hover:text-accent-dark text-sm font-medium transition-all duration-200 rounded hover:bg-accent/10 hover:shadow-sm"
                >
                    {messages.home.viewAll} →
                </Link>
            </div>
            <p className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
                {messages.publications.correspondingAuthor}
            </p>
            <div className="space-y-4">
                {publications.map((pub, index) => (
                    <motion.div
                        key={pub.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 * index }}
                        className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg shadow-sm border border-neutral-200 dark:border-[rgba(148,163,184,0.24)] hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                    >
                        <h3 className="font-semibold text-primary mb-2 leading-tight">
                            {pub.abstract ? (
                                <button
                                    type="button"
                                    onClick={() => setExpandedAbstractId(expandedAbstractId === pub.id ? null : pub.id)}
                                    aria-expanded={expandedAbstractId === pub.id}
                                    aria-label={expandedAbstractId === pub.id ? messages.publications.collapseAbstract : messages.publications.expandAbstract}
                                    className="group inline-flex w-full items-start gap-2 text-left transition-colors hover:text-accent"
                                >
                                    <span className="flex-1">
                                        <FormattedBibTeXText nodes={pub.titleNodes} fallback={pub.title} />
                                    </span>
                                    <ChevronDownIcon
                                        className={cn(
                                            'mt-0.5 h-4 w-4 flex-none text-neutral-400 transition-transform duration-200 group-hover:text-accent',
                                            expandedAbstractId === pub.id && 'rotate-180'
                                        )}
                                    />
                                </button>
                            ) : (
                                <FormattedBibTeXText nodes={pub.titleNodes} fallback={pub.title} />
                            )}
                        </h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-500 mb-1">
                            {pub.authors.map((author, idx) => (
                                <span key={idx}>
                                    <span className={`${author.isHighlighted ? 'font-semibold text-accent' : ''} ${author.isCoAuthor ? `underline underline-offset-4 ${author.isHighlighted ? 'decoration-accent' : 'decoration-neutral-400'}` : ''}`}>
                                        {author.name}
                                    </span>
                                    {author.isCorresponding && (
                                        <span
                                            aria-label={messages.publications.correspondingAuthor}
                                            title={messages.publications.correspondingAuthor}
                                            className="ml-0.5 font-bold text-rose-600 dark:text-rose-400"
                                        >*</span>
                                    )}
                                    {idx < pub.authors.length - 1 && ', '}
                                </span>
                            ))}
                        </p>
                        <p className="text-sm text-neutral-600 dark:text-neutral-500 mb-2">
                            {pub.journal || pub.conference}
                        </p>
                        {pub.description && (
                            <p className="text-sm text-neutral-500 dark:text-neutral-500 line-clamp-2">
                                {pub.description}
                            </p>
                        )}
                        <AnimatePresence>
                            {expandedAbstractId === pub.id && pub.abstract ? (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-3 overflow-hidden"
                                >
                                    <div className="rounded-lg border border-neutral-200 bg-white/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/50">
                                        <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                                            {pub.abstract}
                                        </p>
                                    </div>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-neutral-200 pt-3 dark:border-neutral-700">
                            {pub.doi && (
                                <a
                                    href={`https://doi.org/${pub.doi}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-xs font-semibold text-accent transition-colors hover:text-accent-dark"
                                >
                                    {messages.publications.originalPaper}
                                    <ArrowTopRightOnSquareIcon className="ml-1.5 h-3.5 w-3.5" />
                                </a>
                            )}
                            <PublicationBadges
                                publication={pub}
                                className="ml-auto justify-end"
                                highlyCitedLabel={pub.highlyCited ? (locale === 'zh' ? '高被引论文' : 'Highly Cited Paper') : undefined}
                            />
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.section>
    );
}
