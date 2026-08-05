'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    CalendarIcon,
    BookOpenIcon,
    ArrowsUpDownIcon,
    ClipboardDocumentIcon,
    ChevronDownIcon,
    ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import { Publication } from '@/types/publication';
import { PublicationPageConfig } from '@/types/page';
import { cn } from '@/lib/utils';
import { useMessages } from '@/lib/i18n/useMessages';
import FormattedBibTeXText from './FormattedBibTeXText';
import PublicationBadges from './PublicationBadges';

interface PublicationsListProps {
    config: PublicationPageConfig;
    publications: Publication[];
    embedded?: boolean;
}

type SortOption = 'year' | 'if' | 'jcr' | 'ccf' | 'ajg';

const sortOptions: Array<{ value: SortOption; label: string }> = [
    { value: 'year', label: 'Year' },
    { value: 'if', label: 'IF' },
    { value: 'jcr', label: 'JCR' },
    { value: 'ccf', label: 'CCF' },
    { value: 'ajg', label: 'AJG' },
];

const jcrScores: Record<NonNullable<Publication['jcrQuartile']>, number> = {
    Q1: 4,
    Q2: 3,
    Q3: 2,
    Q4: 1,
};

const ccfScores: Record<NonNullable<Publication['ccfRank']>, number> = {
    A: 3,
    B: 2,
    C: 1,
};

const ajgScores: Record<NonNullable<Publication['ajgRank']>, number> = {
    '4*': 5,
    '4': 4,
    '3': 3,
    '2': 2,
    '1': 1,
};

function parseYearInput(value: string): number | null {
    return /^\d{4}$/.test(value) ? Number(value) : null;
}

function getSortScore(publication: Publication, sortOption: SortOption): number | undefined {
    switch (sortOption) {
        case 'if':
            return publication.impactFactor;
        case 'jcr':
            return publication.jcrQuartile ? jcrScores[publication.jcrQuartile] : undefined;
        case 'ccf':
            return publication.ccfRank ? ccfScores[publication.ccfRank] : undefined;
        case 'ajg':
            return publication.ajgRank ? ajgScores[publication.ajgRank] : undefined;
        default:
            return publication.year;
    }
}

export default function PublicationsList({ config, publications, embedded = false }: PublicationsListProps) {
    const messages = useMessages();
    const [searchQuery, setSearchQuery] = useState('');
    const [startYear, setStartYear] = useState('');
    const [endYear, setEndYear] = useState('');
    const [selectedType, setSelectedType] = useState<string | 'all'>('all');
    const [sortOption, setSortOption] = useState<SortOption>('year');
    const [expandedBibtexId, setExpandedBibtexId] = useState<string | null>(null);
    const [expandedAbstractId, setExpandedAbstractId] = useState<string | null>(null);

    const types = useMemo(() => {
        const uniqueTypes = Array.from(new Set(publications.map(p => p.type)));
        return uniqueTypes.sort();
    }, [publications]);

    // Filter and sort publications while preserving the source order for exact ties.
    const filteredPublications = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();
        const parsedStartYear = parseYearInput(startYear);
        const parsedEndYear = parseYearInput(endYear);
        const lowerYear = parsedStartYear !== null && parsedEndYear !== null
            ? Math.min(parsedStartYear, parsedEndYear)
            : parsedStartYear;
        const upperYear = parsedStartYear !== null && parsedEndYear !== null
            ? Math.max(parsedStartYear, parsedEndYear)
            : parsedEndYear;

        return publications.map((publication, sourceIndex) => ({ publication, sourceIndex })).filter(({ publication: pub }) => {
            const matchesSearch =
                pub.title.toLowerCase().includes(normalizedSearch) ||
                pub.authors.some(author => author.name.toLowerCase().includes(normalizedSearch)) ||
                pub.journal?.toLowerCase().includes(normalizedSearch) ||
                pub.conference?.toLowerCase().includes(normalizedSearch);

            const matchesYear =
                (lowerYear === null || pub.year >= lowerYear) &&
                (upperYear === null || pub.year <= upperYear);
            const matchesType = selectedType === 'all' || pub.type === selectedType;

            return matchesSearch && matchesYear && matchesType;
        }).sort((a, b) => {
            if (sortOption === 'year') {
                return b.publication.year - a.publication.year || a.sourceIndex - b.sourceIndex;
            }

            const scoreA = getSortScore(a.publication, sortOption);
            const scoreB = getSortScore(b.publication, sortOption);

            if (scoreA === undefined && scoreB !== undefined) return 1;
            if (scoreA !== undefined && scoreB === undefined) return -1;
            if (scoreA !== undefined && scoreB !== undefined && scoreA !== scoreB) return scoreB - scoreA;

            return b.publication.year - a.publication.year || a.sourceIndex - b.sourceIndex;
        }).map(({ publication }) => publication);
    }, [publications, searchQuery, startYear, endYear, selectedType, sortOption]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
        >
            <div className="mb-8">
                <h1 className={`${embedded ? "text-2xl" : "text-4xl"} font-serif font-bold text-primary mb-4`}>{config.title}</h1>
                {config.description && (
                    <p className={`${embedded ? "text-base" : "text-lg"} text-neutral-600 dark:text-neutral-500 max-w-2xl`}>
                        {config.description}
                    </p>
                )}
                <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
                    {messages.publications.correspondingAuthor}
                </p>
            </div>

            {/* Search and Filter Controls */}
            <div className="mb-8 space-y-4">
                {/* ... (keep existing controls) ... */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-grow">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                        <input
                            type="text"
                            placeholder={messages.publications.searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                        />
                    </div>
                    <div
                        className="flex cursor-default items-center justify-center rounded-lg border border-accent bg-accent px-4 py-2 text-white"
                    >
                        <FunnelIcon className="h-5 w-5 mr-2" />
                        {messages.publications.filters}
                    </div>
                </div>

                <div className="grid gap-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/50 xl:grid-cols-[minmax(0,1fr)_max-content_minmax(0,1.25fr)]">
                    {/* Year Filter */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" /> {messages.publications.year}
                        </label>
                        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto">
                            <button
                                type="button"
                                onClick={() => {
                                    setStartYear('');
                                    setEndYear('');
                                }}
                                aria-pressed={startYear === '' && endYear === ''}
                                className={cn(
                                    "shrink-0 whitespace-nowrap px-3 py-1 text-xs rounded-full transition-colors",
                                    startYear === '' && endYear === ''
                                        ? "bg-accent text-white"
                                        : "bg-white dark:bg-neutral-800 text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                )}
                            >
                                {messages.common.all}
                            </button>
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={4}
                                value={startYear}
                                onChange={(event) => setStartYear(event.target.value.replace(/\D/g, '').slice(0, 4))}
                                placeholder={messages.publications.fromYear}
                                aria-label={messages.publications.fromYear}
                                className="w-20 shrink-0 rounded-md border border-neutral-200 bg-white px-3 py-1 text-xs tabular-nums text-neutral-700 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
                            />
                            <span className="text-xs text-neutral-400" aria-hidden="true">–</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={4}
                                value={endYear}
                                onChange={(event) => setEndYear(event.target.value.replace(/\D/g, '').slice(0, 4))}
                                placeholder={messages.publications.toYear}
                                aria-label={messages.publications.toYear}
                                className="w-20 shrink-0 rounded-md border border-neutral-200 bg-white px-3 py-1 text-xs tabular-nums text-neutral-700 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
                            />
                        </div>
                    </div>

                    {/* Type Filter */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
                            <BookOpenIcon className="h-4 w-4 mr-1" /> {messages.publications.type}
                        </label>
                        <div className="flex flex-nowrap gap-2 overflow-x-auto">
                            <button
                                type="button"
                                onClick={() => setSelectedType('all')}
                                aria-pressed={selectedType === 'all'}
                                className={cn(
                                    "shrink-0 whitespace-nowrap px-3 py-1 text-xs rounded-full transition-colors",
                                    selectedType === 'all'
                                        ? "bg-accent text-white"
                                        : "bg-white dark:bg-neutral-800 text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                )}
                            >
                                {messages.common.all}
                            </button>
                            {types.map(type => (
                                <button
                                    type="button"
                                    key={type}
                                    onClick={() => setSelectedType(type)}
                                    aria-pressed={selectedType === type}
                                    className={cn(
                                        "shrink-0 whitespace-nowrap px-3 py-1 text-xs rounded-full capitalize transition-colors",
                                        selectedType === type
                                            ? "bg-accent text-white"
                                            : "bg-white dark:bg-neutral-800 text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                    )}
                                >
                                    {type.replace('-', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sort Controls */}
                    <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            <ArrowsUpDownIcon className="mr-1 h-4 w-4" /> {messages.publications.sortBy}
                        </label>
                        <div className="flex flex-nowrap gap-2 overflow-x-auto">
                            {sortOptions.map(option => (
                                <button
                                    type="button"
                                    key={option.value}
                                    onClick={() => setSortOption(option.value)}
                                    aria-pressed={sortOption === option.value}
                                    className={cn(
                                        "shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs transition-colors",
                                        sortOption === option.value
                                            ? "bg-accent text-white"
                                            : "bg-white text-neutral-600 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                                    )}
                                >
                                    {option.value === 'year' ? messages.publications.year : option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Publications Grid */}
            <div className="space-y-6">
                {filteredPublications.length === 0 ? (
                    <div className="text-center py-12 text-neutral-500">
                        {messages.publications.noResults}
                    </div>
                ) : (
                    filteredPublications.map((pub, index) => (
                        <motion.div
                            key={pub.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 * index }}
                            className="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-all duration-200"
                        >
                            <div className="flex flex-col md:flex-row gap-6">
                                {pub.preview && (
                                    <div className="w-full md:w-48 flex-shrink-0">
                                        <div className="aspect-video md:aspect-[4/3] relative rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                                            <Image
                                                src={`/papers/${pub.preview}`}
                                                alt={pub.title}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            />
                                        </div>
                                    </div>
                                )}
                                <div className="flex-grow">
                                    <h3 className={`${embedded ? "text-lg" : "text-xl"} font-semibold text-primary mb-2 leading-tight`}>
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
                                                        'mt-1 h-4 w-4 flex-none text-neutral-400 transition-transform duration-200 group-hover:text-accent',
                                                        expandedAbstractId === pub.id && 'rotate-180'
                                                    )}
                                                />
                                            </button>
                                        ) : (
                                            <FormattedBibTeXText nodes={pub.titleNodes} fallback={pub.title} />
                                        )}
                                    </h3>
                                    <p className={`${embedded ? "text-sm" : "text-base"} text-neutral-600 dark:text-neutral-400 mb-2`}>
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
                                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-600 mb-3">
                                        {pub.journal || pub.conference} {pub.year}
                                    </p>

                                    {pub.description && (
                                        <p className="text-sm text-neutral-600 dark:text-neutral-500 mb-4 line-clamp-3">
                                            {pub.description}
                                        </p>
                                    )}

                                    <AnimatePresence>
                                        {expandedAbstractId === pub.id && pub.abstract ? (
                                            <motion.div
                                                key="abstract"
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden mt-4"
                                            >
                                                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
                                                    <p className="text-sm text-neutral-600 dark:text-neutral-500 leading-relaxed">
                                                        {pub.abstract}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ) : null}
                                    </AnimatePresence>

                                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                        <div className="flex flex-wrap gap-2">
                                            {pub.doi && (
                                                <a
                                                    href={`https://doi.org/${pub.doi}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center rounded-md bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700 transition-colors hover:bg-accent hover:text-white dark:bg-neutral-800 dark:text-neutral-300"
                                                >
                                                    <ArrowTopRightOnSquareIcon className="mr-1.5 h-3.5 w-3.5" />
                                                    {messages.publications.originalPaper}
                                                </a>
                                            )}
                                            {pub.code && (
                                                <a
                                                    href={pub.code}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center rounded-md bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700 transition-colors hover:bg-accent hover:text-white dark:bg-neutral-800 dark:text-neutral-300"
                                                >
                                                    {messages.publications.code}
                                                </a>
                                            )}
                                            {pub.bibtex && (
                                                <button
                                                    onClick={() => setExpandedBibtexId(expandedBibtexId === pub.id ? null : pub.id)}
                                                    className={cn(
                                                        "inline-flex items-center rounded-md px-3 py-1 text-xs font-medium transition-colors",
                                                        expandedBibtexId === pub.id
                                                            ? "bg-accent text-white"
                                                            : "bg-neutral-100 text-neutral-700 hover:bg-accent hover:text-white dark:bg-neutral-800 dark:text-neutral-300"
                                                    )}
                                                >
                                                    <BookOpenIcon className="mr-1.5 h-3 w-3" />
                                                    {messages.publications.bibtex}
                                                </button>
                                            )}
                                        </div>
                                        <PublicationBadges publication={pub} className="sm:justify-end" />
                                    </div>

                                    <AnimatePresence>
                                        {expandedBibtexId === pub.id && pub.bibtex ? (
                                            <motion.div
                                                key="bibtex"
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden mt-4"
                                            >
                                                <div className="relative bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
                                                    <pre className="text-xs text-neutral-600 dark:text-neutral-500 overflow-x-auto whitespace-pre-wrap font-mono">
                                                        {pub.bibtex}
                                                    </pre>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(pub.bibtex || '');
                                                            // Optional: Show copied feedback
                                                        }}
                                                        className="absolute top-2 right-2 p-1.5 rounded-md bg-white dark:bg-neutral-700 text-neutral-500 hover:text-accent shadow-sm border border-neutral-200 dark:border-neutral-600 transition-colors"
                                                        title={messages.common.copyToClipboard}
                                                    >
                                                        <ClipboardDocumentIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ) : null}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </motion.div>
    );
}
