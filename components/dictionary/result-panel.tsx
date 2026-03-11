"use client";

import {
  LinkSimple,
  Quotes,
  SpeakerHigh,
  SpeakerSlash,
} from "@phosphor-icons/react";
import { motion, type Variants, useReducedMotion } from "framer-motion";
import { useMemo, type CSSProperties } from "react";
import type { DictionaryResult } from "@/types/dictionary";

type ResultPanelProps = {
  result: DictionaryResult;
  audioError: string | null;
  onPlayAudio: (audioUrl: string) => void;
};

type SenseRecord = {
  id: string;
  definition: string;
  example: string | null;
  synonyms: string[];
  antonyms: string[];
};

type WordClassRecord = {
  id: string;
  anchorId: string;
  partOfSpeech: string;
  senses: SenseRecord[];
  meaningSynonyms: string[];
  meaningAntonyms: string[];
};

type SourceRecord = {
  id: string;
  url: string;
};

const CONTENT_EASE = [0.22, 1, 0.36, 1] as const;

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.26,
      ease: CONTENT_EASE,
    },
  },
};

const uniqueStrings = (values: string[]) => [...new Set(values)];

const summarizeTerms = (values: string[], limit = 8) => {
  const unique = uniqueStrings(values.filter(Boolean));
  return {
    shown: unique.slice(0, limit),
    hiddenCount: Math.max(unique.length - limit, 0),
  };
};

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "word-class";

const formatSourceLabel = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

function TermPillGroup({
  label,
  values,
  className = "mt-4",
}: {
  label: string;
  values: string[];
  className?: string;
}) {
  const summary = summarizeTerms(values, 6);

  if (summary.shown.length === 0) {
    return null;
  }

  return (
    <div className={`${className} space-y-2`}>
      <p className="section-label text-[var(--ink-subtle)]">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {summary.shown.map((value) => (
          <span
            key={value}
            className="rounded-full border border-[#e3cf98] bg-white/88 px-2.5 py-1 text-sm text-[var(--ink-muted)]"
          >
            {value}
          </span>
        ))}
        {summary.hiddenCount > 0 ? (
          <span className="rounded-full border border-[#e3cf98] bg-[#f5e7c4] px-2.5 py-1 text-sm text-[var(--ink-subtle)]">
            +{summary.hiddenCount} more
          </span>
        ) : null}
      </div>
    </div>
  );
}

const getAudioTone = (index: number): CSSProperties => {
  const tones = [
    { bg: "var(--yellow)", shadow: "var(--yellow-shadow)", ink: "#4f3810" },
    { bg: "var(--sky)", shadow: "var(--sky-shadow)", ink: "#234656" },
    { bg: "var(--teal)", shadow: "var(--teal-shadow)", ink: "#174238" },
  ];
  const tone = tones[index % tones.length];

  return {
    "--toy-bg": tone.bg,
    "--toy-shadow": tone.shadow,
    "--toy-ink": tone.ink,
  } as CSSProperties;
};

const getPartOfSpeechTone = (partOfSpeech: string): CSSProperties => {
  const normalized = partOfSpeech.toLowerCase();

  if (normalized.includes("noun")) {
    return {
      "--toy-bg": "var(--yellow)",
      "--toy-shadow": "var(--yellow-shadow)",
      "--toy-ink": "#4f3810",
    } as CSSProperties;
  }

  if (normalized.includes("verb")) {
    return {
      "--toy-bg": "var(--pink)",
      "--toy-shadow": "var(--pink-shadow)",
      "--toy-ink": "var(--cream-soft)",
    } as CSSProperties;
  }

  if (normalized.includes("adjective")) {
    return {
      "--toy-bg": "var(--teal)",
      "--toy-shadow": "var(--teal-shadow)",
      "--toy-ink": "#174238",
    } as CSSProperties;
  }

  return {
    "--toy-bg": "var(--sky)",
    "--toy-shadow": "var(--sky-shadow)",
    "--toy-ink": "#234656",
  } as CSSProperties;
};

export default function ResultPanel({
  result,
  audioError,
  onPlayAudio,
}: ResultPanelProps) {
  const shouldReduceMotion = useReducedMotion();

  const primaryEntry = result.entries[0];
  const titlePhonetic = uniqueStrings(
    result.entries
      .flatMap((entry) => entry.phonetics)
      .map((item) => item.text ?? "")
      .filter(Boolean),
  ).join(" · ");
  const headerPronunciations = useMemo(
    () =>
      uniqueStrings(
        result.entries
          .flatMap((entry) => entry.phonetics)
          .map((item) => item.audio ?? "")
          .filter(Boolean),
      ),
    [result],
  );

  const wordClasses = useMemo<WordClassRecord[]>(() => {
    const grouped = new Map<string, WordClassRecord>();

    result.entries.forEach((entry, entryIndex) => {
      entry.meanings.forEach((meaning, meaningIndex) => {
        const groupKey = meaning.partOfSpeech.trim().toLowerCase() || "unknown";

        let section = grouped.get(groupKey);

        if (!section) {
          section = {
            id: groupKey,
            anchorId: `definition-section-${grouped.size}-${slugify(meaning.partOfSpeech)}`,
            partOfSpeech: meaning.partOfSpeech,
            senses: [],
            meaningSynonyms: [],
            meaningAntonyms: [],
          };
          grouped.set(groupKey, section);
        }

        section.meaningSynonyms = uniqueStrings([
          ...section.meaningSynonyms,
          ...meaning.synonyms,
        ]);
        section.meaningAntonyms = uniqueStrings([
          ...section.meaningAntonyms,
          ...meaning.antonyms,
        ]);

        meaning.definitions.forEach((definition, definitionIndexValue) => {
          section?.senses.push({
            id: `${entry.word}-${entryIndex}-${meaning.partOfSpeech}-${meaningIndex}-${definitionIndexValue}`,
            definition: definition.definition,
            example: definition.example,
            synonyms: uniqueStrings(definition.synonyms),
            antonyms: uniqueStrings(definition.antonyms),
          });
        });
      });
    });

    return Array.from(grouped.values());
  }, [result]);
  const totalSenses = useMemo(
    () => wordClasses.reduce((count, section) => count + section.senses.length, 0),
    [wordClasses],
  );
  const partOfSpeechCount = wordClasses.length;

  const sources = useMemo<SourceRecord[]>(
    () =>
      uniqueStrings(result.entries.flatMap((entry) => entry.sourceUrls)).map(
        (url, index) => ({
          id: `source-${index}`,
          url,
        }),
      ),
    [result],
  );
  const updatedLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(result.fetchedAt)),
    [result.fetchedAt],
  );

  const panelTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.22, ease: CONTENT_EASE };

  return (
    <motion.section
      layout
      variants={containerVariants}
      initial={shouldReduceMotion ? false : "hidden"}
      animate="show"
      className="grid gap-4"
    >
      <motion.header
        layout
        layoutId={`dictionary-word-${result.term}`}
        transition={panelTransition}
        className="calm-panel rounded-[1.85rem] p-5 sm:p-6"
      >
        <p className="section-label text-[var(--ink-subtle)]">
          Current Word
        </p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="min-w-0 break-words font-[family:var(--font-display)] text-[clamp(2.3rem,5vw,3.35rem)] font-semibold leading-none tracking-[-0.05em] text-[var(--ink-strong)] text-balance">
              {primaryEntry.word}
            </h2>
            <p className="mt-3 max-w-[42ch] text-sm leading-relaxed text-[var(--ink-muted)]">
              {titlePhonetic || "No phonetic notation available."}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-2 lg:max-w-[40%]">
            {headerPronunciations.length > 0 ? (
              headerPronunciations.map((audioUrl, index) => (
                <button
                  key={`${audioUrl}-${index}`}
                  type="button"
                  onClick={() => onPlayAudio(audioUrl)}
                  aria-label={`Play pronunciation ${index + 1} for ${primaryEntry.word}`}
                  className="toy-surface toy-icon inline-flex items-center justify-center"
                  style={getAudioTone(index)}
                >
                  <SpeakerHigh size={18} weight="fill" aria-hidden />
                </button>
              ))
            ) : (
              <button
                type="button"
                disabled
                aria-label={`Pronunciation audio unavailable for ${primaryEntry.word}`}
                className="toy-surface toy-icon inline-flex items-center justify-center opacity-70"
                style={
                  {
                    "--toy-bg": "var(--sky)",
                    "--toy-shadow": "var(--sky-shadow)",
                    "--toy-ink": "#234656",
                  } as CSSProperties
                }
              >
                <SpeakerSlash size={18} weight="fill" aria-hidden />
              </button>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="toy-surface toy-badge">
            {totalSenses} senses
          </span>
          <span className="toy-surface toy-badge">
            {partOfSpeechCount} word classes
          </span>
          <span className="toy-surface toy-badge">
            {sources.length} sources
          </span>
          <span className="toy-surface toy-badge">
            Updated {updatedLabel}
          </span>
        </div>
        {audioError ? (
          <p
            className="reading-card mt-4 rounded-[1rem] px-3 py-2 text-sm text-[var(--ink-muted)]"
            aria-live="polite"
            role="status"
          >
            {audioError}
          </p>
        ) : null}
      </motion.header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.42fr)_minmax(18rem,0.78fr)] lg:items-start">
        <motion.section
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }}
          transition={panelTransition}
          className="calm-panel rounded-[1.8rem] p-4 sm:p-5"
        >
          <div className="flex flex-col">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[rgb(115,88,40,0.14)] pb-4">
              <div>
                <p className="section-label text-[var(--ink-subtle)]">
                  Definitions
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--ink-muted)]">
                  {totalSenses} senses across {partOfSpeechCount} word classes. Jump
                  to a class or scroll through the grouped sections below.
                </p>
              </div>
              {wordClasses.length > 0 ? (
                <div className="flex flex-wrap gap-2 lg:max-w-[48%] lg:justify-end">
                  {wordClasses.map((section, index) => (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => {
                        document.getElementById(section.anchorId)?.scrollIntoView({
                          behavior: shouldReduceMotion ? "auto" : "smooth",
                          block: "start",
                        });
                      }}
                      aria-label={`Jump to ${section.partOfSpeech} definitions`}
                      className="toy-surface toy-badge min-h-[38px] px-3"
                      style={
                        {
                          ...getPartOfSpeechTone(section.partOfSpeech),
                          "--toy-rotate": index % 2 === 0 ? "-1deg" : "1deg",
                        } as CSSProperties
                      }
                    >
                      <span>{section.partOfSpeech}</span>
                      <span className="ml-2 text-[0.72rem] opacity-80">
                        {section.senses.length}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="mt-4 space-y-3">
              {wordClasses.length > 0 ? (
                wordClasses.map((section) => (
                  <section
                    key={section.id}
                    id={section.anchorId}
                    className="reading-card scroll-mt-4 rounded-[1.55rem] p-4 sm:p-5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="toy-surface toy-badge"
                        style={getPartOfSpeechTone(section.partOfSpeech)}
                      >
                        {section.partOfSpeech}
                      </span>
                      <span className="section-label text-[var(--ink-subtle)]">
                        {section.senses.length} senses
                      </span>
                    </div>

                    {section.meaningSynonyms.length > 0 ||
                    section.meaningAntonyms.length > 0 ? (
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <TermPillGroup
                          label="Word-Class Synonyms"
                          values={section.meaningSynonyms}
                          className=""
                        />
                        <TermPillGroup
                          label="Word-Class Antonyms"
                          values={section.meaningAntonyms}
                          className=""
                        />
                      </div>
                    ) : null}

                    <ol className="mt-4 space-y-3">
                      {section.senses.map((sense, index) => (
                        <li key={sense.id}>
                          <article className="rounded-[1.2rem] border border-[#e8d5a4] bg-white/54 px-4 py-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="section-label text-[var(--ink-subtle)]">
                                {index + 1}
                              </span>
                              {sense.example ? (
                                <span className="rounded-full border border-[#d8c48f] bg-[#f8edcc] px-2.5 py-1 text-xs font-medium text-[var(--ink-muted)]">
                                  Example sentence
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-3 break-words text-[15px] leading-7 text-[var(--ink-strong)]">
                              {sense.definition}
                            </p>
                            {sense.example ? (
                              <div className="reading-card mt-4 rounded-[1rem] px-3 py-3">
                                <p className="section-label text-[var(--ink-subtle)]">
                                  Example Sentence
                                </p>
                                <div className="mt-2 flex items-start gap-2 text-sm leading-relaxed text-[var(--ink-muted)]">
                                  <Quotes
                                    size={14}
                                    weight="bold"
                                    aria-hidden
                                    className="mt-0.5 shrink-0 text-[#16524c]"
                                  />
                                  <span className="break-words">{sense.example}</span>
                                </div>
                              </div>
                            ) : null}
                            <TermPillGroup label="Synonyms" values={sense.synonyms} />
                            <TermPillGroup label="Antonyms" values={sense.antonyms} />
                          </article>
                        </li>
                      ))}
                    </ol>
                  </section>
                ))
              ) : (
                <article className="reading-card rounded-[1.3rem] p-4 text-sm text-[var(--ink-muted)]">
                  No definition data is available for this entry.
                </article>
              )}
            </div>
          </div>
        </motion.section>

        <aside className="grid content-start gap-4 lg:sticky lg:top-6">
          <article className="calm-panel rounded-[1.8rem] p-4 sm:p-5">
            <div className="border-b border-[rgb(115,88,40,0.14)] pb-4">
              <p className="section-label text-[var(--ink-subtle)]">
                Sources
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--ink-muted)]">
                Reference links used for this lookup.
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {sources.length > 0 ? (
                <ul className="space-y-3">
                  {sources.map((source) => (
                    <li key={source.id}>
                      <article className="reading-card rounded-[1.4rem] p-4">
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="board-link group flex items-start justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="font-[family:var(--font-display)] text-base font-semibold text-[var(--ink-strong)]">
                              {formatSourceLabel(source.url)}
                            </p>
                            <p className="mt-2 break-all text-sm leading-relaxed text-[var(--ink-muted)]">
                              {source.url}
                            </p>
                          </div>
                          <span
                            className="toy-surface inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                            style={
                              {
                                "--toy-bg": "var(--teal)",
                                "--toy-shadow": "var(--teal-shadow)",
                                "--toy-ink": "#174238",
                              } as CSSProperties
                            }
                          >
                            <LinkSimple size={16} weight="bold" aria-hidden />
                          </span>
                        </a>
                      </article>
                    </li>
                  ))}
                </ul>
              ) : (
                <article className="reading-card rounded-[1.3rem] p-4 text-sm text-[var(--ink-muted)]">
                  No source links are available for this term.
                </article>
              )}
            </div>
          </article>
        </aside>
      </div>
    </motion.section>
  );
}
